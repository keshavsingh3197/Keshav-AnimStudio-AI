using AnimStudio.Application.Common;
using AnimStudio.Domain.Characters;

namespace AnimStudio.Application.Characters;

/// <summary>
/// What a character voice may be. Shared by the character editor, which stores voices, and
/// the studio render, which plays them, so a voice that saves always renders.
/// </summary>
public static class CharacterVoiceRules
{
    /// <summary>
    /// Out-of-range amounts are refused rather than clamped: the editor never sends them, so
    /// one arriving means a broken client, and saving a quietly different voice would hide it.
    /// </summary>
    public static CharacterVoice? ToVoice(CharacterVoiceCommand command)
    {
        if (!command.Enabled) return null;

        var preset = string.IsNullOrWhiteSpace(command.Preset) ? null : command.Preset.Trim();
        if (preset is not null && (preset.Length > 40 || !preset.All(c => c is >= 'a' and <= 'z' or >= '0' and <= '9' or '-')))
            throw EditingException.Invalid("voice-preset-invalid", "A voice preset is a short lowercase name.");

        Require(command.PitchSemitones, -CharacterVoice.MaxPitchSemitones, CharacterVoice.MaxPitchSemitones, "pitch");
        Require(command.SizeSemitones, -CharacterVoice.MaxSizeSemitones, CharacterVoice.MaxSizeSemitones, "size");
        Require(command.BassDecibels, -CharacterVoice.MaxToneDecibels, CharacterVoice.MaxToneDecibels, "bass");
        Require(command.TrebleDecibels, -CharacterVoice.MaxToneDecibels, CharacterVoice.MaxToneDecibels, "treble");
        Require(command.Drive, 0, 1, "drive");
        Require(command.Robot, 0, 1, "robot");
        Require(command.RobotHertz, CharacterVoice.MinRobotHertz, CharacterVoice.MaxRobotHertz, "robot tone");
        Require(command.Echo, 0, 1, "echo");
        Require(command.Reverb, 0, 1, "reverb");

        var sample = string.IsNullOrWhiteSpace(command.AiSampleAssetId) ? null : command.AiSampleAssetId.Trim();
        if (sample is { Length: > 64 })
            throw EditingException.Invalid("voice-sample-invalid", "That voice sample isn't a file id.");
        if (sample is not null && !command.AiSampleConsent)
        {
            throw EditingException.Invalid("voice-consent-required",
                "Confirm the person in the voice sample agreed to their voice being used.");
        }

        return new CharacterVoice
        {
            Preset = preset,
            PitchSemitones = command.PitchSemitones,
            SizeSemitones = command.SizeSemitones,
            BassDecibels = command.BassDecibels,
            TrebleDecibels = command.TrebleDecibels,
            Drive = command.Drive,
            Robot = command.Robot,
            RobotHertz = command.RobotHertz,
            Radio = command.Radio,
            Echo = command.Echo,
            Reverb = command.Reverb,
            AiSampleAssetId = sample,
            AiSampleConsent = sample is not null && command.AiSampleConsent
        };
    }

    private static void Require(double value, double min, double max, string what)
    {
        if (!double.IsFinite(value) || value < min || value > max)
        {
            throw EditingException.Invalid("voice-out-of-range",
                $"The voice's {what} must be between {min} and {max}.");
        }
    }
}
