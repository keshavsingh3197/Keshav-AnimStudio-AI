using AnimStudio.Application.Transcripts.Parsing;
using AnimStudio.Domain.Transcripts;

namespace AnimStudio.Application.Tests.Transcripts;

public class SpeakerPrefixDetectorTests
{
    private static SubtitleParser NewParser() => new(new ParsingOptions());

    [Fact]
    public void Lifts_name_prefixes_out_of_a_pasted_transcript()
    {
        // The default source has no markup, so "Name:" is its only speaker signal.
        var result = NewParser().Parse("""
            Rahul: Hey Priya, look at this park!
            Priya: It is beautiful.
            Rahul: Let us make it our spot.
            """);

        Assert.Equal(3, result.Cues.Count);
        Assert.Equal(["Rahul", "Priya", "Rahul"], result.Cues.Select(c => c.SpeakerLabel));
        // The prefix must not remain in the spoken text.
        Assert.Equal("Hey Priya, look at this park!", result.Cues[0].Text);
        Assert.All(result.Cues, c => Assert.Equal(SpeakerDetectionTier.Prefix, c.SpeakerTier));
    }

    [Fact]
    public void Accepts_a_speaker_who_appears_only_once_when_the_convention_is_established()
    {
        // Rahul recurs, which establishes the pattern; Priya's single line is then a real
        // speaker rather than an accident. Short dialogues depend on this.
        var result = NewParser().Parse("""
            Rahul: First line.
            Priya: Only line.
            Rahul: Third line.
            """);

        Assert.Equal("Priya", result.Cues[1].SpeakerLabel);
    }

    [Fact]
    public void Leaves_ordinary_prose_alone_when_there_is_no_convention()
    {
        // One incidental colon in a paragraph must not invent a speaker.
        var result = NewParser().Parse("""
            The park was quiet this morning and the light was good.
            Note: we should come back tomorrow when it is warmer.
            The bench near the pond is the best spot for filming.
            The trees give shade for most of the afternoon.
            """);

        Assert.All(result.Cues, c => Assert.Null(c.SpeakerLabel));
    }

    [Theory]
    [InlineData("Note: remember this.")]
    [InlineData("Warning: do not do that.")]
    [InlineData("Transcript: the following is automated.")]
    [InlineData("Subject: your order.")]
    public void Never_treats_known_metadata_words_as_speakers(string line)
    {
        // Paired with a real speaker so the convention IS established - the denylist has to
        // hold even then.
        var result = NewParser().Parse($"""
            Rahul: A real line.
            {line}
            Rahul: Another real line.
            """);

        Assert.DoesNotContain(result.Cues, c =>
            c.SpeakerLabel is "Note" or "Warning" or "Transcript" or "Subject");
    }

    [Fact]
    public void Does_not_mistake_a_url_for_a_speaker()
    {
        var result = NewParser().Parse("""
            Rahul: Look at this.
            https://example.com/a-page
            Rahul: Good, isn't it.
            """);

        Assert.DoesNotContain(result.Cues, c => c.SpeakerLabel is "https" or "http");
    }

    [Fact]
    public void Rejects_a_candidate_containing_digits()
    {
        var result = NewParser().Parse("""
            Rahul: One.
            Scene 2: the park.
            Rahul: Two.
            """);

        Assert.DoesNotContain(result.Cues, c => c.SpeakerLabel is not null && c.SpeakerLabel.Any(char.IsDigit));
    }

    [Fact]
    public void A_voice_tag_outranks_a_name_prefix()
    {
        // Structural evidence wins: the tag is authoritative, the prefix is inferred.
        var vtt = """
            WEBVTT

            00:00:01.000 --> 00:00:04.000
            <v Priya>Rahul: this text has both

            00:00:05.000 --> 00:00:08.000
            <v Priya>and so does this one
            """;

        var result = NewParser().Parse(vtt);

        Assert.Equal("Priya", result.Cues[0].SpeakerLabel);
        Assert.Equal(SpeakerDetectionTier.VoiceTag, result.Cues[0].SpeakerTier);
    }

    [Fact]
    public void Prefixed_speakers_drive_segmentation_into_separate_scenes()
    {
        // The end-to-end point of all this: without prefix detection a three-way dialogue
        // collapses into a single segment and no character can be cast.
        var result = NewParser().Parse("""
            Rahul: Hey Priya, look at this park!
            Priya: It is beautiful.
            Rahul: Let us make it our spot.
            """);

        var segments = new AnimStudio.Application.Scripts.SegmentationEngine()
            .Segment(result.Cues, new AnimStudio.Application.Scripts.SegmentationOptions());

        Assert.Equal(3, segments.Count);
        Assert.Equal(["rahul", "priya", "rahul"], segments.Select(s => s.DominantSpeakerKey));
    }
}
