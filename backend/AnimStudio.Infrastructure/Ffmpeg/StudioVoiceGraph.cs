using System.Globalization;
using System.Text;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Characters;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// The filtergraph that re-voices a recording. Input 0 is the recording; input 1, when a
/// voice has a hall, is the hall's impulse response. The recording's audio is cut at each
/// voice switch, each part goes through its character's chain and is padded or trimmed back
/// to exactly its own length, and the parts are joined again - so every word stays where it
/// was said, and the picture (copied untouched) stays in sync.
/// <para>
/// Pitch and body are moved separately: <c>asetrate</c> scales everything (pitch, formants
/// and speed) by the body's factor, then rubberband restores the speed and sets the pitch
/// while keeping those new formants. A deeper voice from a bigger body is what sounds like
/// another person; the browser's live preview can only move both together.
/// </para>
/// </summary>
public static class StudioVoiceGraph
{
    public const int SampleRate = 48000;

    /// <summary>The hall's impulse response, written next to the recording when needed.</summary>
    public const string HallFileName = "hall.wav";

    private const double HallSeconds = 2.8;
    private const int EchoMilliseconds = 270;
    private const double EchoFeedback = 0.35;

    public sealed record Built(string FilterComplex, bool NeedsHall);

    /// <param name="converted">
    /// Parts already turned into a person's voice by the AI converter: segment index to the
    /// ffmpeg input holding that part. They replace the recording's audio for that part, and
    /// skip pitch and size - the person's own voice sets those - but keep the other effects.
    /// </param>
    public static Built Build(IReadOnlyList<StudioVoiceSegment> segments, IReadOnlyDictionary<int, int>? converted = null)
    {
        if (segments.Count == 0) throw new ArgumentException("At least one segment is needed.", nameof(segments));
        converted ??= new Dictionary<int, int>();

        var statements = new List<string>();
        var count = segments.Count;

        // The recording is tapped once per part it supplies, plus once for the last part's
        // length reference when that part is changed.
        var taps = new List<string>();
        for (var i = 0; i < count; i++)
        {
            if (!converted.ContainsKey(i)) taps.Add($"[s{i}]");
            if (i == count - 1 && segments[i].Voice is not null) taps.Add($"[ref{i}]");
        }

        // Voices are mono; resampling once up front keeps every part at the same rate.
        statements.Add(taps.Count == 1
            ? $"[0:a]aformat=channel_layouts=mono,aresample=48000{taps[0]}"
            : $"[0:a]aformat=channel_layouts=mono,aresample=48000,asplit={taps.Count}{string.Concat(taps)}");

        var halls = segments.Count(s => s.Voice is { Reverb: > 0 });
        if (halls > 0)
        {
            statements.Add(halls == 1
                ? "[1:a]aformat=channel_layouts=mono,aresample=48000[ir0]"
                : $"[1:a]aformat=channel_layouts=mono,aresample=48000,asplit={halls}{Labels("ir", halls)}");
        }

        var hall = 0;
        for (var i = 0; i < count; i++)
        {
            var start = segments[i].StartSeconds;
            double? end = i + 1 < count ? segments[i + 1].StartSeconds : null;
            var voice = segments[i].Voice;
            var trim = end is { } e ? $"atrim=start={N(start)}:end={N(e)}" : $"atrim=start={N(start)}";

            string input;
            var chain = new List<string>();
            if (converted.TryGetValue(i, out var source))
            {
                // The converter's output is already just this part.
                input = $"{source}:a";
                chain.AddRange(["aformat=channel_layouts=mono", "aresample=48000", "asetpts=PTS-STARTPTS"]);
            }
            else
            {
                input = $"s{i}";
                chain.AddRange([trim, "asetpts=PTS-STARTPTS"]);
            }
            if (voice is not null) chain.AddRange(Effects(voice, keepPitch: !converted.ContainsKey(i)));

            // Each part comes out exactly as long as it went in (an echo's tail is cut, a
            // stretch's rounding is padded), so the next part starts on time.
            var fit = end is { } stop ? $"apad=whole_dur={N(stop - start)},atrim=duration={N(stop - start)}" : null;

            // The last part's length isn't known up front (a browser recording often doesn't
            // say how long it is), so it is held to the recording's own: a silent copy of that
            // part leads an amix that ends when the copy does.
            var last = end is null && voice is not null;
            if (last) statements.Add($"[ref{i}]{trim},asetpts=PTS-STARTPTS,volume=0[z{i}]");
            var output = last ? $"y{i}" : $"v{i}";

            if (voice is { Reverb: > 0 } wet)
            {
                // The hall is a separate wet layer under the untouched voice, so the
                // convolution's small delay never moves the words themselves.
                statements.Add($"[{input}]{string.Join(',', chain)},asplit=2[d{i}][w{i}]");
                statements.Add($"[w{i}][ir{hall++}]afir=dry=1:wet=1:irnorm=0,volume={N(wet.Reverb * 0.9)}[h{i}]");
                statements.Add($"[d{i}]volume={N(1 - wet.Reverb * 0.35)}[dd{i}]");
                statements.Add($"[dd{i}][h{i}]amix=inputs=2:normalize=0:duration=first{(fit is null ? "" : "," + fit)}[{output}]");
            }
            else
            {
                if (fit is not null) chain.Add(fit);
                statements.Add($"[{input}]{string.Join(',', chain)}[{output}]");
            }

            if (last) statements.Add($"[z{i}][y{i}]amix=inputs=2:normalize=0:duration=first[v{i}]");
        }

        // The limiter catches a growl or hall that pushed past full scale; level=0 keeps it
        // from also turning the whole recording up.
        statements.Add(count == 1
            ? "[v0]alimiter=limit=0.9:level=0[out]"
            : $"{Labels("v", count)}concat=n={count}:v=0:a=1,alimiter=limit=0.9:level=0[out]");

        return new Built(string.Join(";\n", statements), halls > 0);
    }

    /// <summary>The character's chain, in the same order as the browser's: pitch, tone, band, grit, ring, echo.</summary>
    private static IEnumerable<string> Effects(CharacterVoice v, bool keepPitch)
    {
        if (!keepPitch)
        {
            // An AI-converted part already has the person's pitch and body.
        }
        else if (v.SizeSemitones != 0)
        {
            var rate = (int)Math.Round(SampleRate * Math.Pow(2, v.SizeSemitones / 12));
            var body = (double)rate / SampleRate;
            yield return $"asetrate={rate}";
            yield return $"aresample={SampleRate}";
            yield return $"rubberband=tempo={N(1 / body)}:pitch={N(Math.Pow(2, v.PitchSemitones / 12) / body)}:formant=preserved";
        }
        else if (v.PitchSemitones != 0)
        {
            yield return $"rubberband=pitch={N(Math.Pow(2, v.PitchSemitones / 12))}:formant=preserved";
        }

        if (v.BassDecibels != 0) yield return $"bass=g={N(v.BassDecibels)}:f=200";
        if (v.TrebleDecibels != 0) yield return $"treble=g={N(v.TrebleDecibels)}:f=3000";
        if (v.Radio)
        {
            yield return "highpass=f=450";
            yield return "lowpass=f=3000";
        }
        if (v.Drive > 0)
        {
            yield return $"volume={N(1 + v.Drive * 9)}";
            yield return "asoftclip=type=tanh";
        }
        if (v.Robot > 0)
        {
            // Multiplying by a low tone: the metallic sound. No commas, so it can sit in a chain.
            yield return $"aeval=val(0)*({N(1 - v.Robot)}+{N(v.Robot)}*sin(2*PI*{N(v.RobotHertz)}*t)):c=same";
        }
        if (v.Echo > 0)
        {
            var first = v.Echo * 0.6;
            yield return $"aecho=1:1:{EchoMilliseconds}|{EchoMilliseconds * 2}|{EchoMilliseconds * 3}"
                         + $":{N(first)}|{N(first * EchoFeedback)}|{N(first * EchoFeedback * EchoFeedback)}";
            yield return $"volume={N(1 - v.Echo * 0.15)}";
        }
    }

    /// <summary>
    /// A hall as a mono 16-bit WAV of decaying noise, scaled to unit energy like the browser's
    /// normalised convolver, so the same "hall" amount sounds alike in both. Seeded, so a
    /// render is repeatable.
    /// </summary>
    public static byte[] HallImpulse()
    {
        var length = (int)(SampleRate * HallSeconds);
        var random = new Random(7);
        var samples = new double[length];
        double energy = 0, peak = 0;
        for (var i = 0; i < length; i++)
        {
            samples[i] = (random.NextDouble() * 2 - 1) * Math.Pow(1 - (double)i / length, 3);
            energy += samples[i] * samples[i];
        }
        energy = Math.Sqrt(energy);
        for (var i = 0; i < length; i++)
        {
            samples[i] /= energy;
            peak = Math.Max(peak, Math.Abs(samples[i]));
        }

        // afir's irnorm=0 normalises the response again, so only its shape matters here:
        // it is scaled to the full 16-bit range to keep the quiet tail's detail.
        var scale = 0.99 / peak;
        using var stream = new MemoryStream(44 + length * 2);
        using (var writer = new BinaryWriter(stream, Encoding.ASCII, leaveOpen: true))
        {
            writer.Write("RIFF"u8);
            writer.Write(36 + length * 2);
            writer.Write("WAVEfmt "u8);
            writer.Write(16);
            writer.Write((short)1);
            writer.Write((short)1);
            writer.Write(SampleRate);
            writer.Write(SampleRate * 2);
            writer.Write((short)2);
            writer.Write((short)16);
            writer.Write("data"u8);
            writer.Write(length * 2);
            foreach (var s in samples) writer.Write((short)Math.Round(s * scale * short.MaxValue));
        }
        return stream.ToArray();
    }

    private static string Labels(string prefix, int count) =>
        string.Concat(Enumerable.Range(0, count).Select(i => $"[{prefix}{i}]"));

    private static string N(double value) => value.ToString("0.######", CultureInfo.InvariantCulture);
}
