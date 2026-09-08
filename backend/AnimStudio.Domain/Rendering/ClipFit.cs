namespace AnimStudio.Domain.Rendering;

/// <summary>
/// How a clip whose shape does not match the canvas is fitted to it.
/// <para>
/// This choice cannot be avoided or defaulted away, because a set of clips is almost never
/// all one shape: a phone recording, a screen capture and an exported edit put a 9:16, a
/// 16:10 and a 16:9 frame in the same running order. Something has to give - bars, pixels,
/// or a backdrop - and which one is right depends on the footage, so it is the user's call.
/// </para>
/// </summary>
public enum ClipFit
{
    /// <summary>
    /// Fit the whole frame inside the canvas and fill the rest with black. Loses nothing;
    /// costs bars.
    /// </summary>
    Contain = 0,

    /// <summary>
    /// Fill the canvas and crop what overflows, centred. No bars; loses the edges, which
    /// on a vertical clip in a wide canvas means most of the picture.
    /// </summary>
    Cover = 1,

    /// <summary>
    /// Fit the whole frame inside the canvas, over a blurred, cropped copy of itself
    /// instead of black. Loses nothing, no hard bars, and costs a second decode of every
    /// frame.
    /// </summary>
    BlurredBackdrop = 2
}
