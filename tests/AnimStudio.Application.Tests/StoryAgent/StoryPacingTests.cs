using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Tests.StoryAgent;

public class StoryPacingTests
{
    [Fact]
    public void A_long_narration_takes_longer_and_a_short_one_is_held_to_a_minimum()
    {
        Assert.Equal(StoryPacing.MinSceneSeconds, StoryPacing.EstimateSeconds("हाँ।"));

        var line = new string('क', 230);
        var seconds = StoryPacing.EstimateSeconds(line);
        Assert.InRange(seconds, 20.9, 21.1); // 230 / 11.5 + 0.45 + 0.55
        Assert.True(StoryPacing.EstimateSeconds(line, 1.25) < seconds);
    }

    [Theory]
    [InlineData(double.NaN)]
    [InlineData(0)]
    [InlineData(-3)]
    [InlineData(99)]
    public void A_silly_speech_rate_is_ignored_or_clamped(double rate) =>
        Assert.True(double.IsFinite(StoryPacing.EstimateSeconds(new string('क', 100), rate)));

    [Fact]
    public void Captions_break_at_sentence_ends_in_hindi_and_english()
    {
        var chunks = StoryPacing.SplitCaptions("अंधकार चाहे कितना भी गहरा हो, एक दीपक उसे मिटा देता है। यही है दीपावली। Is it not? Yes! It is 3.5 miles away.");

        Assert.Equal(
        [
            "अंधकार चाहे कितना भी गहरा हो, एक दीपक उसे मिटा देता है।",
            "यही है दीपावली।",
            "Is it not?",
            "Yes!",
            "It is 3.5 miles away."
        ], chunks);
    }

    [Fact]
    public void A_sentence_that_is_too_long_is_halved_at_the_comma_nearest_its_middle()
    {
        var sentence = "पहली बात यह है कि भगवान ने बहुत सोचकर यह निर्णय लिया, और फिर दूसरी बात यह है कि सबने उसका स्वागत किया और खुशियाँ मनाईं।";

        var chunks = StoryPacing.SplitCaptions(sentence, 70);

        Assert.True(chunks.Count >= 2);
        Assert.All(chunks, c => Assert.True(c.Length <= 70, c));
        Assert.Equal(sentence.Replace(" ", string.Empty), string.Concat(chunks).Replace(" ", string.Empty));
        Assert.EndsWith("निर्णय लिया,", chunks[0]);
    }

    [Fact]
    public void Splitting_nothing_gives_nothing()
    {
        Assert.Empty(StoryPacing.SplitCaptions(null));
        Assert.Empty(StoryPacing.SplitCaptions("   "));
    }

    [Fact]
    public void Captions_are_cut_where_the_speaker_paused()
    {
        var chunks = new[] { "पहला वाक्य यहाँ है।", "दूसरा वाक्य यहाँ है।" };
        // Quiet for the first 0.4s, a breath at 3.0-3.4, quiet again from 6.2 to the end at 6.8.
        var pauses = new List<StoryPause> { new() { Start = 0, End = 0.4 }, new() { Start = 3.0, End = 3.4 }, new() { Start = 6.2, End = 6.8 } };

        var spans = StoryPacing.Align(chunks, 6.8, pauses);

        Assert.Equal(2, spans.Count);
        Assert.Equal(0.3, spans[0].Start, 2);
        Assert.Equal(3.2, spans[0].End, 2);
        Assert.Equal(3.2, spans[1].Start, 2);
        Assert.Equal(6.5, spans[1].End, 2);
    }

    [Fact]
    public void Without_pauses_the_cut_falls_in_proportion_to_the_text()
    {
        var spans = StoryPacing.Align(["aaaa", "aaaa"], 10, []);

        Assert.Equal(5.0, spans[0].End, 1);
        Assert.Equal(spans[0].End, spans[1].Start, 3);
        Assert.True(spans[1].End <= 10);
    }

    [Fact]
    public void One_caption_spans_the_speech_and_captions_never_overlap_or_run_backwards()
    {
        var one = StoryPacing.Align(["एक वाक्य।"], 4, [new StoryPause { Start = 0, End = 0.5 }, new StoryPause { Start = 3.5, End = 4.0 }]);
        Assert.Single(one);
        Assert.Equal(0.4, one[0].Start, 2);
        Assert.Equal(3.8, one[0].End, 2);

        var many = StoryPacing.Align(["a", "b", "c", "d", "e"], 5, [new StoryPause { Start = 2.0, End = 2.2 }]);
        for (var i = 1; i < many.Count; i++)
        {
            Assert.True(many[i].Start >= many[i - 1].End - 1e-9);
            Assert.True(many[i].End >= many[i].Start);
        }
    }

    [Fact]
    public void Spread_gives_each_caption_time_in_proportion_inside_the_lead_and_tail()
    {
        var spans = StoryPacing.Spread(["aa", "aaaaaa"], 8);

        Assert.Equal(StoryPacing.LeadSeconds, spans[0].Start, 2);
        Assert.True(spans[1].End <= 8 - StoryPacing.TailSeconds + 0.01);
        Assert.True(spans[1].End - spans[1].Start > spans[0].End - spans[0].Start);
    }

    [Theory]
    [InlineData("सोलह हज़ार कन्याएँ।", false)]
    [InlineData("16000 कन्याएँ।", true)]
    [InlineData("सोलह १६ कन्याएँ।", true)]
    public void Digits_in_narration_are_found(string text, bool expected) =>
        Assert.Equal(expected, StoryPacing.HasDigits(text));

    [Theory]
    [InlineData("मान्यता है कि उस रात दीप जले।", true)]
    [InlineData("कहा जाता है कि राम लौटे।", true)]
    [InlineData("It is believed that lamps were lit.", true)]
    [InlineData("राम अयोध्या लौटे।", false)]
    public void A_hedge_is_recognised_in_hindi_and_english(string text, bool expected) =>
        Assert.Equal(expected, StoryPacing.UsesHedge(text));
}
