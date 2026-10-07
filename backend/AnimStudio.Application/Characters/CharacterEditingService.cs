using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Characters;

public sealed record CharacterAppearanceCommand
{
    public int? Age { get; init; }
    public string? Gender { get; init; }
    public string? Hair { get; init; }
    public string? Clothes { get; init; }
    public string? AdditionalDetails { get; init; }
}

public sealed record CharacterVoiceCommand
{
    /// <summary>False clears the voice: the character speaks in the performer's own voice.</summary>
    public bool Enabled { get; init; }
    public string? Preset { get; init; }
    public double PitchSemitones { get; init; }
    public double SizeSemitones { get; init; }
    public double BassDecibels { get; init; }
    public double TrebleDecibels { get; init; }
    public double Drive { get; init; }
    public double Robot { get; init; }
    public double RobotHertz { get; init; } = 60;
    public bool Radio { get; init; }
    public double Echo { get; init; }
    public double Reverb { get; init; }
    public string? AiSampleAssetId { get; init; }
    public bool AiSampleConsent { get; init; }
}

public sealed record UpsertCharacterCommand
{
    /// <summary>Null when creating; the character being edited otherwise.</summary>
    public string? CharacterId { get; init; }

    public required string ProjectId { get; init; }
    public required string UserId { get; init; }

    public required string Name { get; init; }
    public string? Description { get; init; }
    public IReadOnlyList<string> Aliases { get; init; } = [];

    public string? ClosedMouthAssetId { get; init; }
    public string? OpenMouthAssetId { get; init; }
    public string? SubtitleColorHex { get; init; }

    /// <summary>Null leaves the recorded appearance untouched.</summary>
    public CharacterAppearanceCommand? Appearance { get; init; }

    /// <summary>Null leaves the recorded voice untouched.</summary>
    public CharacterVoiceCommand? Voice { get; init; }
}

/// <summary>
/// The cast of one project. Deleting is the interesting operation: a character id is
/// referenced from every scene it appears in, so removing the document alone would leave
/// staging entries and dialogue pointing at nothing.
/// </summary>
public sealed class CharacterEditingService(
    ICharacterRepository characters,
    IProjectRepository projects,
    ISceneRepository scenes,
    IAssetRepository assets,
    TimeProvider clock)
{
    public async Task<Character> UpsertAsync(UpsertCharacterCommand command, CancellationToken ct)
    {
        var project = await LoadProjectAsync(command.ProjectId, command.UserId, ct)
            .ConfigureAwait(false);

        var name = command.Name?.Trim();
        if (string.IsNullOrEmpty(name))
            throw EditingException.Invalid("name-required", "A character needs a name.");

        if (command.SubtitleColorHex is { Length: > 0 } hex && !IsHexColor(hex))
        {
            throw EditingException.Invalid("colour-invalid",
                "A subtitle colour must look like #RRGGBB.");
        }

        var voice = command.Voice is { } voiceCommand ? CharacterVoiceRules.ToVoice(voiceCommand) : null;

        await EnsureVoiceSampleAsync(voice?.AiSampleAssetId, project.Id, ct).ConfigureAwait(false);
        await EnsureSpriteAsync(command.ClosedMouthAssetId, project.Id, ct).ConfigureAwait(false);
        await EnsureSpriteAsync(command.OpenMouthAssetId, project.Id, ct).ConfigureAwait(false);

        var now = clock.GetUtcNow().UtcDateTime;

        Character character;

        if (command.CharacterId is { Length: > 0 } id)
        {
            character = await characters.GetAsync(id, ct).ConfigureAwait(false)
                ?? throw new KeyNotFoundException();

            if (!string.Equals(character.ProjectId, project.Id, StringComparison.Ordinal))
                throw new UnauthorizedAccessException();
        }
        else
        {
            character = new Character { ProjectId = project.Id, CreatedAt = now };
        }

        character.Name = name;
        character.Description = string.IsNullOrWhiteSpace(command.Description)
            ? null
            : command.Description.Trim();
        character.Aliases = [.. command.Aliases.Select(a => a.Trim()).Where(a => a.Length > 0)];
        character.Sprites.ClosedMouthAssetId = Blank(command.ClosedMouthAssetId);
        character.Sprites.OpenMouthAssetId = Blank(command.OpenMouthAssetId);
        character.SubtitleColorHex = Blank(command.SubtitleColorHex);

        if (command.Appearance is { } appearance)
        {
            if (appearance.Age is < 0 or > 200)
                throw EditingException.Invalid("age-out-of-range", "That age is not plausible.");

            character.Appearance = new CharacterAppearance
            {
                Age = appearance.Age,
                Gender = Blank(appearance.Gender),
                Hair = Blank(appearance.Hair),
                Clothes = Blank(appearance.Clothes),
                AdditionalDetails = Blank(appearance.AdditionalDetails)
            };
        }

        if (command.Voice is not null)
            character.Voice = voice;

        character.UpdatedAt = now;

        if (command.CharacterId is { Length: > 0 })
            await characters.ReplaceAsync(character, ct).ConfigureAwait(false);
        else
            await characters.InsertAsync(character, ct).ConfigureAwait(false);

        return character;
    }

    public async Task<Character> GetAsync(string characterId, string userId, CancellationToken ct)
    {
        var character = await characters.GetAsync(characterId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        await LoadProjectAsync(character.ProjectId, userId, ct).ConfigureAwait(false);
        return character;
    }

    /// <summary>
    /// Removes a character and repairs the scenes that referenced it: its staging is
    /// dropped and its lines are handed to the narrator, so the dialogue survives as
    /// subtitles instead of vanishing with the sprite.
    /// </summary>
    public async Task<int> DeleteAsync(string characterId, string userId, CancellationToken ct)
    {
        var character = await characters.GetAsync(characterId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        await LoadProjectAsync(character.ProjectId, userId, ct).ConfigureAwait(false);

        if (character.IsNarrator)
        {
            throw EditingException.Conflict("narrator-required",
                "The narrator speaks every unattributed line and cannot be deleted.");
        }

        var cast = await characters.ListByProjectAsync(character.ProjectId, ct).ConfigureAwait(false);
        var narratorId = cast.FirstOrDefault(c => c.IsNarrator)?.Id;

        var list = await scenes.ListByProjectAsync(character.ProjectId, ct).ConfigureAwait(false);
        var now = clock.GetUtcNow().UtcDateTime;
        var touched = 0;

        foreach (var scene in list)
        {
            var changed = scene.Characters
                .RemoveAll(c => string.Equals(c.CharacterId, characterId, StringComparison.Ordinal)) > 0;

            foreach (var line in scene.Dialogue)
            {
                if (!string.Equals(line.SpeakerCharacterId, characterId, StringComparison.Ordinal))
                    continue;

                line.SpeakerCharacterId = narratorId;
                changed = true;
            }

            if (!changed) continue;

            scene.UpdatedAt = now;
            scene.RevisionToken = Guid.NewGuid().ToString("n");
            await scenes.ReplaceAsync(scene, ct).ConfigureAwait(false);
            touched++;
        }

        await characters.DeleteAsync(characterId, ct).ConfigureAwait(false);
        return touched;
    }

    private async Task EnsureSpriteAsync(string? assetId, string projectId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(assetId)) return;

        var asset = await assets.GetAsync(assetId, ct).ConfigureAwait(false);

        if (asset is null || !string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal))
            throw EditingException.Invalid("asset-not-found", "That file is not in this project.");

        if (asset.Kind != AssetKind.Image)
            throw EditingException.Invalid("asset-wrong-kind", $"'{asset.Name}' is not an image.");
    }

    /// <summary>A voice sample is a recording in this project: audio, or a video whose sound is used.</summary>
    private async Task EnsureVoiceSampleAsync(string? assetId, string projectId, CancellationToken ct)
    {
        if (assetId is null) return;

        var asset = await assets.GetAsync(assetId, ct).ConfigureAwait(false);

        if (asset is null || !string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal))
            throw EditingException.Invalid("asset-not-found", "That voice sample is not in this project.");

        if (asset.Kind is not (AssetKind.Audio or AssetKind.Video))
            throw EditingException.Invalid("asset-wrong-kind", $"'{asset.Name}' has no sound to use as a voice sample.");
    }

    private async Task<Project> LoadProjectAsync(string projectId, string userId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }

    private static string? Blank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsHexColor(string value) =>
        value.Length is 7 or 9
        && value[0] == '#'
        && value.Skip(1).All(Uri.IsHexDigit);
}
