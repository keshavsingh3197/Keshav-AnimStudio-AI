using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Builds the timeline expressions that put sprites on screen and make them "talk".
/// </summary>
internal static class SpriteOverlayFilters
{
    /// <summary>
    /// Presence window as an ffmpeg boolean expression. In a filter's <c>enable</c>
    /// option, multiplication acts as AND, addition as OR, and a zero value bypasses the
    /// filter entirely - which is exactly "sprite hidden".
    /// </summary>
    public static string Presence(FrameRange presence, FrameRate rate) =>
        $"between(t,{FilterExpr.Sec(presence.Start, rate)},{FilterExpr.Sec(presence.End, rate)})";

    /// <summary>
    /// Whether the character is speaking, as the OR of its dialogue windows. min(sum,1)
    /// collapses overlapping windows so the value stays boolean.
    /// </summary>
    public static string Speaking(IReadOnlyList<FrameRange> windows, FrameRate rate)
    {
        if (windows.Count == 0) return "0";

        var terms = windows.Select(w =>
            $"between(t,{FilterExpr.Sec(w.Start, rate)},{FilterExpr.Sec(w.End, rate)})");
        var sum = string.Join("+", terms);
        return windows.Count == 1 ? sum : $"min({sum},1)";
    }

    /// <summary>
    /// A square wave at <paramref name="hz"/> half-cycles per second. At 8 the open sprite
    /// shows for 125ms then the closed one for 125ms, reading as four mouth flaps a second.
    /// </summary>
    public static string Flap(int hz) => $"lt(mod(t*{FilterExpr.N(hz)},2),1)";

    /// <summary>
    /// Enable expressions for the closed- and open-mouth overlays. They are exact
    /// complements within the presence window, so no frame ever shows both sprites or
    /// neither.
    /// </summary>
    public static (string Closed, string Open) MouthEnables(
        SpritePlan sprite, FrameRate rate, int flapHz)
    {
        var presence = Presence(sprite.Presence, rate);

        if (sprite.OpenMouthRelativePath is null || sprite.SpeakingWindows.Count == 0)
            return (presence, string.Empty);

        var speaking = Speaking(sprite.SpeakingWindows, rate);
        var flap = Flap(flapHz);

        return (
            Closed: $"{presence}*(1-{speaking}*{flap})",
            Open: $"{presence}*{speaking}*{flap}");
    }

    /// <summary>Applies an entrance to the sprite's resting x/y expressions.</summary>
    public static (string X, string Y) WithEntrance(SpritePlan sprite, FrameRate rate)
    {
        var seconds = sprite.EntranceDuration.ToSeconds(rate);
        if (sprite.Entrance == SpriteEntrance.None || seconds <= 0)
            return (sprite.XExpression, sprite.YExpression);

        return sprite.Entrance switch
        {
            // Start fully off-screen and slide to the resting position.
            SpriteEntrance.SlideFromLeft =>
                (FilterExpr.Lerp("-w", sprite.XExpression, seconds), sprite.YExpression),
            SpriteEntrance.SlideFromRight =>
                (FilterExpr.Lerp("W", sprite.XExpression, seconds), sprite.YExpression),
            SpriteEntrance.SlideFromBottom =>
                (sprite.XExpression, FilterExpr.Lerp("H", sprite.YExpression, seconds)),
            // A fade entrance needs no geometry change; alpha is handled on the sprite chain.
            _ => (sprite.XExpression, sprite.YExpression)
        };
    }
}
