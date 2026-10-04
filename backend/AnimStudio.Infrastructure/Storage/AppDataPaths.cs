using Microsoft.Extensions.Configuration;

namespace AnimStudio.Infrastructure.Storage;

/// <summary>
/// The one place that decides where the server writes to disk. Every working folder -
/// downloads, chunk jobs, thumbnails, logs, probe scratch - hangs off <c>Storage:DataRoot</c>,
/// so moving the studio to another drive is a single config edit instead of a hunt for
/// hardcoded paths. Durable objects keep their own <c>Storage:LocalRoot</c> because the
/// object store reads that key itself.
/// </summary>
/// <remarks>
/// A relative path resolves against the content root (the API project folder under
/// <c>dotnet run</c>), never against <see cref="AppContext.BaseDirectory"/>, which is
/// <c>bin/Debug/...</c> and is wiped by a clean build.
/// </remarks>
public sealed class AppDataPaths
{
    private AppDataPaths(string root, string objects)
    {
        Root = root;
        Objects = objects;
    }

    public string Root { get; }

    /// <summary>The object store's root - where project assets physically live.</summary>
    public string Objects { get; }

    public string Downloads => Path.Combine(Root, "downloads");
    public string Chunks => Path.Combine(Root, "chunks");
    public string Releases => Path.Combine(Root, "releases");
    public string Thumbnails => Path.Combine(Root, "thumbnails");
    public string Logs => Path.Combine(Root, "logs");
    public string Temp => Path.Combine(Root, "temp");
    public string Screenshots => Path.Combine(Root, "screenshots");

    public static AppDataPaths Resolve(IConfiguration configuration, string contentRoot)
    {
        var objects = ResolvePath(configuration["Storage:LocalRoot"] is { Length: > 0 } l ? l : "App_Data/files", contentRoot);

        // Without an explicit DataRoot the working folders sit beside the objects folder,
        // so a single LocalRoot setting still keeps everything on one drive.
        var root = configuration["Storage:DataRoot"] is { Length: > 0 } configured
            ? ResolvePath(configured, contentRoot)
            : Path.GetDirectoryName(objects) ?? objects;

        return new AppDataPaths(root, objects);
    }

    public void EnsureCreated()
    {
        foreach (var dir in new[] { Root, Objects, Downloads, Chunks, Releases, Thumbnails, Logs, Temp })
            Directory.CreateDirectory(dir);
    }

    /// <summary>
    /// The on-disk path of a local object-store key, or null when the key would escape
    /// the objects folder.
    /// </summary>
    public string? ObjectPath(string storageKey)
    {
        var full = Path.GetFullPath(Path.Combine(Objects, storageKey.Replace('/', Path.DirectorySeparatorChar)));
        var boundary = Path.GetFullPath(Objects).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        return full.StartsWith(boundary, StringComparison.OrdinalIgnoreCase) ? full : null;
    }

    private static string ResolvePath(string path, string contentRoot)
        => Path.GetFullPath(Path.IsPathRooted(path) ? path : Path.Combine(contentRoot, path));
}
