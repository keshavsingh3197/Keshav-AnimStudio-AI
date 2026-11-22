using System.Net;
using System.Text;
using AnimStudio.Infrastructure.Ai;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AnimStudio.Application.Tests.Ai;

public sealed class AiRetryHandlerTests
{
    [Fact]
    public void AnalyzeRateLimitBody_honors_Google_RetryInfo_retryDelay_and_aborts_daily_quota()
    {
        const string rpmBody = """
            {
              "error": {
                "code": 429,
                "message": "Quota exceeded for GenerateRequestsPerMinute. Please retry in 18.2s.",
                "status": "RESOURCE_EXHAUSTED",
                "details": [
                  { "@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "21s" }
                ]
              }
            }
            """;
        var (abortRpm, delayRpm) = AiRetryHandler.AnalyzeRateLimitBody(rpmBody, attempt: 1);
        Assert.False(abortRpm);
        Assert.InRange(delayRpm.TotalSeconds, 21.0, 22.0);

        const string dailyBody = """
            {
              "error": {
                "code": 429,
                "message": "Daily quota reached.",
                "status": "RESOURCE_EXHAUSTED",
                "details": [
                  { "@type": "type.googleapis.com/google.rpc.QuotaFailure", "violations": [ { "quotaId": "GenerateRequestsPerDayPerProjectPerModel" } ] }
                ]
              }
            }
            """;
        var (abortDaily, _) = AiRetryHandler.AnalyzeRateLimitBody(dailyBody, attempt: 1);
        Assert.True(abortDaily);
    }

    [Fact]
    public void AnalyzeRateLimitBody_gives_RESOURCE_EXHAUSTED_without_retryDelay_multi_second_backoff()
    {
        const string unannotated = """{ "error": { "code": 429, "status": "RESOURCE_EXHAUSTED" } }""";
        var (abort, delay) = AiRetryHandler.AnalyzeRateLimitBody(unannotated, attempt: 1);
        Assert.False(abort);
        Assert.True(delay >= TimeSpan.FromSeconds(6));
    }

    [Fact]
    public async Task SendAsync_aborts_immediately_on_PerDay_429_and_keeps_response_body_readable()
    {
        const string dailyPayload = """
            {
              "error": {
                "code": 429,
                "status": "RESOURCE_EXHAUSTED",
                "details": [
                  { "@type": "type.googleapis.com/google.rpc.QuotaFailure", "violations": [ { "quotaId": "RequestsPerDayPerProject" } ] }
                ]
              }
            }
            """;
        var stub = new StubInnerHandler(() => new HttpResponseMessage(HttpStatusCode.TooManyRequests)
        {
            Content = new StringContent(dailyPayload, Encoding.UTF8, "application/json")
        });
        var handler = new AiRetryHandler(NullLogger<AiRetryHandler>.Instance) { InnerHandler = stub };
        using var invoker = new HttpMessageInvoker(handler);

        using var response = await invoker.SendAsync(new HttpRequestMessage(HttpMethod.Post, "https://example.com/tts"), CancellationToken.None);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.Equal(1, stub.CallCount);
        var downstreamBody = await response.Content.ReadAsStringAsync();
        Assert.Contains("RequestsPerDayPerProject", downstreamBody, StringComparison.Ordinal);
    }

    private sealed class StubInnerHandler(Func<HttpResponseMessage> factory) : HttpMessageHandler
    {
        public int CallCount { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(factory());
        }
    }
}
