namespace AnimStudio.Domain.Ai;

/// <summary>
/// The four things an AI provider can be asked to do here. Deliberately coarse: a
/// capability is what a caller needs, not what a vendor sells, so a provider that
/// happens to do three of them registers three times rather than becoming a special case.
/// </summary>
public enum AiCapability
{
    Text = 0,
    Image = 1,
    Speech = 2,
    Transcription = 3
}
