using System.Globalization;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Keeps conformed clips between exports, so a clip that has not changed is never encoded
/// twice.
/// <para>
/// Conforming is nearly all of a stitch's cost - a 117-clip, 19-minute export spent 12 of
/// its 12.5 minutes there - and almost all of it is repeated on the next export, because
/// people export, notice one thing, fix it and export again. The second export then only
/// encodes the clips that changed and stream-copies the join.
/// </para>
/// <para>
/// The key is a hash of everything that decides the output's bytes: the complete filter
/// graph, every input's arguments and a fingerprint of the file behind it, the output
/// arguments, and the watermark text file the graph reads by path. Inputs are named after
/// their asset id in the workspace, so the fingerprint (length plus the first and last
/// megabyte) only has to catch an asset whose file was replaced in place.
/// </para>
/// <para>
/// Entries are hard links where the volume allows, so storing a clip and restoring it both
/// cost a directory entry rather than a copy. Every failure here is a cache miss: the
/// cache must never be the reason a render fails.
/// </para>
/// </summary>
public sealed class ClipConformCache
{
    /// <summary>Bump to invalidate every entry when the meaning of a key changes.</summary>
    private const string KeyVersion = "clip-conform-v1";

    private const int FingerprintChunk = 1 << 20;
    private static readonly TimeSpan TrimInterval = TimeSpan.FromMinutes(5);

    private readonly string? _root;
    private readonly long _maxBytes;
    private readonly ILogger<ClipConformCache> _logger;
    private readonly Lock _trimLock = new();
    private DateTime _lastTrimUtc = DateTime.MinValue;

    public ClipConformCache(
        IOptions<RenderOptions> options, IHostEnvironment environment,
        ILogger<ClipConformCache> logger)
    {
        _logger = logger;
        var configured = options.Value.ClipCacheRoot;
        _maxBytes = Math.Max(options.Value.ClipCacheMaxGigabytes, 0) * 1024L * 1024 * 1024;

        if (string.IsNullOrWhiteSpace(configured) || _maxBytes == 0) return;

        _root = Path.IsPathRooted(configured)
            ? configured
            : Path.Combine(environment.ContentRootPath, configured);
    }

    public bool IsEnabled => _root is not null;

    /// <summary>
    /// The cache key for one conform, or null when an input cannot be fingerprinted - in
    /// which case the clip is simply encoded.
    /// </summary>
    public string? KeyFor(FilterGraphPlan graph, ClipRenderPlan plan, Func<string, string> resolve)
    {
        if (_root is null) return null;

        try
        {
            using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
            void Add(string value)
            {
                hash.AppendData(Encoding.UTF8.GetBytes(value));
                hash.AppendData([0]);
            }

            Add(KeyVersion);
            Add(graph.FilterComplex);

            foreach (var input in graph.Inputs)
            {
                Add(string.Join('\u001f', input.PreInputArguments));
                Add(input.RelativePath);
                if (!input.IsLavfi) Fingerprint(hash, resolve(input.RelativePath));
            }

            foreach (var argument in graph.OutputArguments) Add(argument);

            // Read by path from inside the graph, so its CONTENT is not in the graph text.
            if (plan.Watermark?.TextRelativePath is { Length: > 0 } text)
                Fingerprint(hash, resolve(text));

            return Convert.ToHexStringLower(hash.GetHashAndReset());
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogDebug(ex, "Could not fingerprint clip {Index}; encoding it.", plan.ClipIndex);
            return null;
        }
    }

    /// <summary>Puts a cached clip at <paramref name="destination"/>, if there is one.</summary>
    public bool TryRestore(string key, string destination, out FrameCount frames)
    {
        frames = FrameCount.Zero;
        if (_root is null) return false;

        var (video, meta) = PathsFor(key);
        try
        {
            if (!File.Exists(video) || !File.Exists(meta)) return false;

            if (!int.TryParse(File.ReadAllText(meta).Trim(), NumberStyles.Integer,
                    CultureInfo.InvariantCulture, out var count) || count <= 0)
                return false;

            if (File.Exists(destination)) File.Delete(destination);
            LinkOrCopy(video, destination);

            // Last-used order is what the trim evicts by.
            File.SetLastWriteTimeUtc(meta, DateTime.UtcNow);

            frames = new FrameCount(count);
            return true;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogDebug(ex, "Clip cache entry {Key} could not be restored.", key);
            return false;
        }
    }

    /// <summary>Remembers a freshly conformed clip. Best effort.</summary>
    public void Store(string key, string source, FrameCount frames)
    {
        if (_root is null || frames.Value <= 0) return;

        var (video, meta) = PathsFor(key);
        var staging = $"{video}.{Guid.NewGuid():N}.tmp";
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(video)!);

            // Video first and the frame count last: an entry only counts once both exist,
            // so a crash between the two leaves a miss rather than a wrong length.
            LinkOrCopy(source, staging);
            File.Move(staging, video, overwrite: true);
            File.WriteAllText(meta, frames.Value.ToString(CultureInfo.InvariantCulture));
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogDebug(ex, "Clip cache entry {Key} could not be stored.", key);
            TryDelete(staging);
            return;
        }

        TrimIfDue();
    }

    private (string Video, string Meta) PathsFor(string key)
    {
        var folder = Path.Combine(_root!, key[..2]);
        return (Path.Combine(folder, key + ".mp4"), Path.Combine(folder, key + ".frames"));
    }

    /// <summary>
    /// Evicts least-recently-used entries until the cache is back under 90% of its cap.
    /// Runs at most every few minutes, because listing the cache is not free and a stitch
    /// stores a hundred entries in a row.
    /// </summary>
    private void TrimIfDue()
    {
        lock (_trimLock)
        {
            if (DateTime.UtcNow - _lastTrimUtc < TrimInterval) return;
            _lastTrimUtc = DateTime.UtcNow;
        }

        try
        {
            var entries = new DirectoryInfo(_root!)
                .EnumerateFiles("*.frames", SearchOption.AllDirectories)
                .Select(meta => (Meta: meta, Video: new FileInfo(Path.ChangeExtension(meta.FullName, ".mp4"))))
                .Where(e => e.Video.Exists)
                .OrderBy(e => e.Meta.LastWriteTimeUtc)
                .ToList();

            var total = entries.Sum(e => e.Video.Length);
            var target = _maxBytes / 10 * 9;

            foreach (var (meta, video) in entries)
            {
                if (total <= target) break;
                total -= video.Length;
                TryDelete(meta.FullName);
                TryDelete(video.FullName);
            }
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            _logger.LogDebug(ex, "Clip cache trim failed; it will be retried.");
        }
    }

    /// <summary>
    /// Length plus the first and last megabyte. The whole file would be the stronger
    /// identity, but inputs here are named by asset id already; this only has to notice a
    /// file swapped under the same id, and it costs milliseconds instead of a full read.
    /// </summary>
    private static void Fingerprint(IncrementalHash hash, string path)
    {
        using var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        var length = file.Length;
        hash.AppendData(BitConverter.GetBytes(length));

        var buffer = new byte[FingerprintChunk];
        hash.AppendData(buffer, 0, file.ReadAtLeast(buffer, buffer.Length, throwOnEndOfStream: false));

        if (length > FingerprintChunk)
        {
            file.Seek(Math.Max(FingerprintChunk, length - FingerprintChunk), SeekOrigin.Begin);
            hash.AppendData(buffer, 0, file.ReadAtLeast(buffer, buffer.Length, throwOnEndOfStream: false));
        }
    }

    private static void LinkOrCopy(string source, string destination)
    {
        if (TryHardLink(source, destination)) return;
        File.Copy(source, destination, overwrite: true);
    }

    private static bool TryHardLink(string source, string destination)
    {
        try
        {
            return OperatingSystem.IsWindows()
                ? CreateHardLink(destination, source, IntPtr.Zero)
                : Link(source, destination) == 0;
        }
        catch (Exception ex) when (ex is DllNotFoundException or EntryPointNotFoundException)
        {
            return false;
        }
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path)) File.Delete(path);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // Left for the next trim.
        }
    }

    // DllImport rather than LibraryImport: the generated marshalling needs unsafe code,
    // which this project does not enable for the sake of two calls.
#pragma warning disable SYSLIB1054
    [DllImport("kernel32.dll", EntryPoint = "CreateHardLinkW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateHardLink(string fileName, string existingFileName, IntPtr securityAttributes);

    [DllImport("libc", EntryPoint = "link", SetLastError = true)]
    private static extern int Link(string oldPath, string newPath);
#pragma warning restore SYSLIB1054
}
