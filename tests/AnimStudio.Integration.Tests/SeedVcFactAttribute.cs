using AnimStudio.Infrastructure.Voices;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Integration.Tests;

/// <summary>
/// A fact that runs only where Seed-VC is installed (scripts/setup-voice-ai.ps1) - it is slow,
/// downloads models on first use, and most machines and CI jobs won't have it.
/// </summary>
public sealed class SeedVcFactAttribute : FactAttribute
{
    public static string SeedVcPath { get; } =
        Environment.GetEnvironmentVariable("ANIMSTUDIO_SEEDVC_PATH")
        ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AnimStudio", "seed-vc");

    public static string PythonPath => Path.Combine(SeedVcPath, ".venv", "Scripts", "python.exe");

    public SeedVcFactAttribute()
    {
        if (!FfmpegLocator.IsAvailable)
            Skip = "ffmpeg not found.";
        else if (!File.Exists(PythonPath) || !File.Exists(Path.Combine(SeedVcPath, "inference.py")))
            Skip = $"Seed-VC isn't installed at '{SeedVcPath}'.";
    }

    public static SeedVcVoiceConverter Converter() => new(
        Options.Create(new VoiceConversionOptions
        {
            Enabled = true,
            PythonPath = PythonPath,
            SeedVcPath = SeedVcPath,
            DiffusionSteps = 10
        }),
        NullLogger<SeedVcVoiceConverter>.Instance);
}
