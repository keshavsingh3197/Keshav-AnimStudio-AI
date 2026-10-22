using System.Text;
using AnimStudio.Application.Common;
using AnimStudio.Application.Effects;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Effects;

namespace AnimStudio.Application.Tests.Effects;

public sealed class EffectRulesTests
{
    internal static byte[] Mp4Bytes() => [0, 0, 0, 0x18, .. "ftypisom"u8, .. new byte[64]];
    internal static byte[] WebmBytes() => [0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81, 0x01, .. "B\x82\x84webm"u8, .. new byte[64]];
    internal static byte[] MovBytes() => [0, 0, 0, 0x14, .. "ftypqt  "u8, .. new byte[64]];
    internal static byte[] PngBytes() => [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, .. new byte[64]];

    private static Task<AnimStudio.Application.Uploads.UploadValidationResult> Sniff(string name, string? type, byte[] bytes) =>
        EffectRules.SniffAsync(name, type, new MemoryStream(bytes), default);

    [Fact]
    public void Names_are_trimmed_and_single_spaced_and_bounded()
    {
        Assert.Equal("Subscribe pop", EffectRules.NormalizeName("  Subscribe   pop "));
        Assert.Throws<EditingException>(() => EffectRules.NormalizeName("   "));
        Assert.Throws<EditingException>(() => EffectRules.NormalizeName(new string('a', EffectRules.MaxNameLength + 1)));
        Assert.Throws<EditingException>(() => EffectRules.NormalizeName("bad\u0007name"));
    }

    [Fact]
    public void A_file_name_becomes_a_readable_starting_name()
    {
        Assert.Equal("whoosh fast", EffectRules.NameFromFile(@"C:\fakepath\whoosh_fast.mp3"));
        Assert.Equal("Effect", EffectRules.NameFromFile(".mp3"));
    }

    [Fact]
    public void Tags_are_lower_cased_deduplicated_and_lose_a_leading_hash()
    {
        Assert.Equal(["subscribe", "end card"], EffectRules.NormalizeTags(["#Subscribe", "subscribe", " End  Card ", ""]));
        Assert.Throws<EditingException>(() => EffectRules.NormalizeTags(["<script>"]));
        Assert.Throws<EditingException>(() => EffectRules.NormalizeTags(Enumerable.Range(0, EffectRules.MaxTags + 1).Select(i => $"t{i}")));
    }

    [Fact]
    public void Categories_come_only_from_the_allowlist()
    {
        Assert.Equal(EffectCategory.EndScreen, EffectRules.ParseCategory("endscreen"));
        Assert.Null(EffectRules.ParseCategory(null));
        Assert.Throws<EditingException>(() => EffectRules.ParseCategory("7"));
        Assert.Throws<EditingException>(() => EffectRules.ParseCategory("Explosions"));
        Assert.Throws<EditingException>(() => EffectRules.ParseKind("subtitle"));
    }

    [Fact]
    public void Sounds_and_pictures_keep_to_their_categories()
    {
        Assert.Throws<EditingException>(() => EffectRules.EnsureCategoryFits(EffectCategory.SoundEffect, AssetKind.Video));
        Assert.Throws<EditingException>(() => EffectRules.EnsureCategoryFits(EffectCategory.GreenScreen, AssetKind.Audio));
        EffectRules.EnsureCategoryFits(EffectCategory.Intro, AssetKind.Audio);
        Assert.Equal(EffectCategory.SoundEffect, EffectRules.DefaultCategory(AssetKind.Audio));
        Assert.Equal(EffectCategory.Overlay, EffectRules.DefaultCategory(AssetKind.Video));
    }

    [Fact]
    public void Storage_keys_are_composed_from_the_effect_id_only()
    {
        var id = Guid.NewGuid().ToString("N");
        Assert.Equal($"effects/{id}/clip.webm", EffectRules.StorageKey(id, ".webm"));
        Assert.Equal($"effects/{id}/thumb.jpg", EffectRules.ThumbnailKey(id));
        Assert.True(EffectRules.IsEffectId(id));
        Assert.False(EffectRules.IsEffectId("../../etc"));
        Assert.False(EffectRules.IsEffectId(id.ToUpperInvariant()));
    }

    [Fact]
    public void A_project_copy_is_named_with_the_files_extension()
    {
        Assert.Equal("Like burst.webm", EffectRules.AssetNameFor(new EffectClip { Name = "Like burst", StorageKey = "effects/x/clip.webm" }));
        Assert.Equal("ding.mp3", EffectRules.AssetNameFor(new EffectClip { Name = "ding.mp3", StorageKey = "effects/x/clip.mp3" }));
    }

    [Fact]
    public void The_list_puts_favourites_first_then_the_most_used()
    {
        var t0 = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        EffectClip E(string name, bool fav, int uses, int day, EffectCategory cat = EffectCategory.Overlay, params string[] tags) =>
            new() { Name = name, Favorite = fav, UseCount = uses, CreatedAt = t0.AddDays(day), Category = cat, Tags = [.. tags] };

        var all = new[]
        {
            E("Old popular", false, 9, 0),
            E("New unused", false, 0, 5),
            E("Fave", true, 0, 1, EffectCategory.Subscribe, "bell"),
        };

        Assert.Equal(["Fave", "Old popular", "New unused"], EffectRules.Filter(all, new EffectQuery()).Select(e => e.Name));
        Assert.Equal(["Fave"], EffectRules.Filter(all, new EffectQuery(Search: "BELL")).Select(e => e.Name));
        Assert.Equal(["Fave"], EffectRules.Filter(all, new EffectQuery(Category: EffectCategory.Subscribe)).Select(e => e.Name));
        Assert.Equal(["Fave"], EffectRules.Filter(all, new EffectQuery(FavoritesOnly: true)).Select(e => e.Name));
        Assert.Throws<EditingException>(() => EffectRules.Filter(all, new EffectQuery(Search: new string('x', 101))));
    }

    [Fact]
    public async Task WebM_and_MOV_are_recognised_by_their_container()
    {
        var webm = await Sniff("like.webm", "video/webm", WebmBytes());
        Assert.True(webm.IsValid);
        Assert.Equal(("video/webm", ".webm", AssetKind.Video), (webm.MimeType, webm.CanonicalExtension, webm.Kind));

        var mov = await Sniff("stinger.MOV", "video/quicktime", MovBytes());
        Assert.True(mov.IsValid);
        Assert.Equal(".mov", mov.CanonicalExtension);
    }

    [Fact]
    public async Task Other_types_use_the_project_upload_check()
    {
        Assert.True((await Sniff("end.mp4", "video/mp4", Mp4Bytes())).IsValid);
        Assert.True((await Sniff("frame.png", "image/png", PngBytes())).IsValid);
        Assert.False((await Sniff("end.mp4", "video/mp4", Encoding.ASCII.GetBytes("MZ this is not a video at all"))).IsValid);
    }

    [Fact]
    public async Task Mislabelled_or_unsupported_files_are_refused()
    {
        // Plain Matroska is EBML too, but not a WebM.
        byte[] mkv = [0x1A, 0x45, 0xDF, 0xA3, .. "matroska"u8, .. new byte[64]];
        Assert.Equal("file-content-mismatch", (await Sniff("x.webm", "video/webm", mkv)).Code);
        Assert.Equal("file-type-mismatch", (await Sniff("x.webm", "image/png", WebmBytes())).Code);
        Assert.Equal("file-content-mismatch", (await Sniff("x.mov", null, PngBytes())).Code);
        Assert.Equal("gif-not-supported", (await Sniff("x.gif", "image/gif", "GIF89a"u8.ToArray())).Code);
        Assert.Equal("file-type-not-allowed", (await Sniff("x.svg", "image/svg+xml", "<svg/>"u8.ToArray())).Code);
    }
}
