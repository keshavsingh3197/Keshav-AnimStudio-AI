using System.Text.Json;
using AnimStudio.Api.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.ApiErrors;

/// <summary>What a caller is told when the server could not read its request, and what it is never told.</summary>
public sealed class GlobalExceptionHandlerTests
{
    private static async Task<(int Status, JsonElement Body)> HandleAsync(Exception exception)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var handled = await new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance)
            .TryHandleAsync(context, exception, CancellationToken.None);

        Assert.True(handled);
        context.Response.Body.Position = 0;
        using var document = await JsonDocument.ParseAsync(context.Response.Body);
        return (context.Response.StatusCode, document.RootElement.Clone());
    }

    private static string CodeOf(JsonElement body) => body.GetProperty("errors")[0].GetProperty("code").GetString()!;

    [Fact]
    public async Task A_request_over_its_size_limit_is_refused_as_too_large_and_not_as_a_server_fault()
    {
        var (status, body) = await HandleAsync(new BadHttpRequestException(
            "Request body too large. The max request body size is 65536 bytes.", StatusCodes.Status413PayloadTooLarge));

        Assert.Equal(StatusCodes.Status413PayloadTooLarge, status);
        Assert.False(body.GetProperty("success").GetBoolean());
        Assert.Equal("payload-too-large", CodeOf(body));
        Assert.Equal("That is too large to send.", body.GetProperty("message").GetString());
        Assert.DoesNotContain("65536", body.GetRawText());
    }

    [Fact]
    public async Task A_request_that_could_not_be_read_is_the_callers_to_fix_and_says_nothing_of_why()
    {
        var (status, body) = await HandleAsync(new BadHttpRequestException(
            "Unexpected end of request content on connection 0HN4.", StatusCodes.Status400BadRequest));

        Assert.Equal(StatusCodes.Status400BadRequest, status);
        Assert.Equal("bad-request", CodeOf(body));
        Assert.DoesNotContain("0HN4", body.GetRawText());
    }

    [Fact]
    public async Task An_unrecognised_failure_is_still_a_generic_500_that_describes_nothing()
    {
        var (status, body) = await HandleAsync(new InvalidOperationException(@"Could not open C:\secret\keys.db"));

        Assert.Equal(StatusCodes.Status500InternalServerError, status);
        Assert.Equal("internal-error", CodeOf(body));
        Assert.DoesNotContain("secret", body.GetRawText());
    }
}
