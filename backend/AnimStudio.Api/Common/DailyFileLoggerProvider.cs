using Microsoft.Extensions.Logging;

namespace AnimStudio.Api.Common;

/// <summary>
/// A minimal rolling daily-file logger provider.
/// Writes plain-text lines to: {logDirectory}/{prefix}-YYYY-MM-DD.log
/// No NuGet packages required — uses only BCL StreamWriter.
/// </summary>
public sealed class DailyFileLoggerProvider(string logDirectory, string prefix) : ILoggerProvider
{
    public ILogger CreateLogger(string categoryName) =>
        new DailyFileLogger(logDirectory, prefix, categoryName);

    public void Dispose() { }
}

file sealed class DailyFileLogger(string logDirectory, string prefix, string category) : ILogger
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => logLevel >= LogLevel.Information;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;

        var date = DateTime.Now.ToString("yyyy-MM-dd");
        var path = Path.Combine(logDirectory, $"{prefix}-{date}.log");
        var level = logLevel switch
        {
            LogLevel.Trace => "TRC",
            LogLevel.Debug => "DBG",
            LogLevel.Information => "INF",
            LogLevel.Warning => "WRN",
            LogLevel.Error => "ERR",
            LogLevel.Critical => "CRT",
            _ => "???"
        };
        var message = formatter(state, exception);
        var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] [{level}] {category}{Environment.NewLine}  {message}";
        if (exception != null)
            line += $"{Environment.NewLine}  {exception}";

        try
        {
            File.AppendAllText(path, line + Environment.NewLine);
        }
        catch (Exception)
        {
            // If logging itself fails, swallow — never crash the app because of logging.
        }
    }
}
