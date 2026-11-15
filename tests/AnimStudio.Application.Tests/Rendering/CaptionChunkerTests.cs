using AnimStudio.Application.Rendering;
using Xunit;

namespace AnimStudio.Application.Tests.Rendering;

public sealed class CaptionChunkerTests
{
    [Fact]
    public void Short_line_is_one_chunk_over_the_whole_turn()
    {
        var chunks = CaptionChunker.Split("Namaste, aaj ka panchang.", 2.0, 5.0, 80);
        var only = Assert.Single(chunks);
        Assert.Equal("Namaste, aaj ka panchang.", only.Text);
        Assert.Equal(2.0, only.StartSeconds);
        Assert.Equal(5.0, only.EndSeconds);
    }

    [Fact]
    public void Long_line_keeps_every_word_and_covers_the_turn_in_order()
    {
        var text = string.Join(' ', Enumerable.Range(1, 60).Select(i => $"word{i}")) + ".";
        var chunks = CaptionChunker.Split(text, 10.0, 30.0, 60);

        Assert.True(chunks.Count > 1);
        Assert.All(chunks, c => Assert.True(c.Text.Length <= 60));
        Assert.Equal(text, string.Join(' ', chunks.Select(c => c.Text)));
        Assert.Equal(10.0, chunks[0].StartSeconds);
        Assert.Equal(30.0, chunks[^1].EndSeconds);
        for (var i = 1; i < chunks.Count; i++)
            Assert.Equal(chunks[i - 1].EndSeconds, chunks[i].StartSeconds, 3);
    }

    [Fact]
    public void Prefers_breaking_after_a_sentence()
    {
        var text = "राम वन को गए और सीता भी साथ गईं। लक्ष्मण ने भी भाई का साथ नहीं छोड़ा और सेवा की।";
        var chunks = CaptionChunker.Split(text, 0, 6, 50);
        Assert.EndsWith("।", chunks[0].Text);
    }
}
