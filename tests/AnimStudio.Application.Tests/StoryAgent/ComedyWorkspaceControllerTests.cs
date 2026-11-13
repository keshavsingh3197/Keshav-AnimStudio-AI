using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Api.Controllers;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class ComedyWorkspaceControllerTests
{
    private sealed class User : ICurrentUser
    {
        public string UserId => "owner";
        public string? DisplayName => null;
        public string? Email => null;
        public bool IsAuthenticated => true;
        public bool IsAdmin => false;
        public IReadOnlyList<string> Roles => [];
    }

    private sealed class Access(bool allowed) : IStudioAccessEvaluator
    {
        public bool HasPermission(ICurrentUser user, string permissionKey) => allowed;
        public bool CanAccessFeature(ICurrentUser user, string featureKey) => allowed;
        public (bool Allowed, string? Reason) CheckRenderQuota(ICurrentUser user, double requestedDurationSeconds) => (allowed, null);
        public (bool Allowed, string? Reason) CheckAiQuota(ICurrentUser user) => (allowed, "Quota exceeded.");
    }

    private static readonly ComedyWorkspaceRequest Input = new()
    {
        Title = "Three sketches",
        Material = "First scene\nSecond scene\nThird scene",
        Reference = "https://example.test/video",
        Language = "en",
        Style = "2D"
    };

    [Fact]
    public void Prompt_keeps_multiple_scripts_and_reference_as_json_data_without_calling_ai()
    {
        var ai = new FakeAi();
        var controller = new ComedyWorkspaceController(ai, new Access(false), new User());
        var response = Assert.IsType<OkObjectResult>(controller.Prompt(Input).Result);
        var prompt = Assert.IsType<ApiResponse<ComedyPromptResponse>>(response.Value).Data!.Prompt;
        Assert.Contains("do not claim to have watched it", prompt);
        using var data = JsonDocument.Parse(prompt[(prompt.LastIndexOf("Creator data:", StringComparison.Ordinal) + "Creator data:".Length)..]);
        Assert.Equal(Input.Material, data.RootElement.GetProperty("material").GetString());
        Assert.Equal(Input.Reference, data.RootElement.GetProperty("reference").GetString());
        Assert.Equal(60, data.RootElement.GetProperty("targetSeconds").GetInt32());
        Assert.Equal("Narrated", data.RootElement.GetProperty("voicing").GetString());
        Assert.Empty(ai.TextCalls);
    }

    [Fact]
    public void Prompt_requests_acted_dialogue_and_thirty_second_target()
    {
        var request = Input with { TargetSeconds = 30, Voicing = "CharactersOnly" };
        var controller = new ComedyWorkspaceController(new FakeAi(), new Access(false), new User());
        var response = Assert.IsType<OkObjectResult>(controller.Prompt(request).Result);
        var prompt = Assert.IsType<ApiResponse<ComedyPromptResponse>>(response.Value).Data!.Prompt;
        Assert.Contains("no narrator, descriptive voiceover", prompt);
        using var data = JsonDocument.Parse(prompt[(prompt.LastIndexOf("Creator data:", StringComparison.Ordinal) + "Creator data:".Length)..]);
        Assert.Equal(30, data.RootElement.GetProperty("targetSeconds").GetInt32());
        Assert.Equal("CharactersOnly", data.RootElement.GetProperty("voicing").GetString());
    }

    [Fact]
    public async Task Conversion_uses_the_callers_quota_and_returns_model_response_for_review()
    {
        var ai = new FakeAi { Text = _ => FakeAi.TextOk("{\"kind\":\"animstudio-story\"}") };
        var controller = new ComedyWorkspaceController(ai, new Access(true), new User());
        var response = Assert.IsType<OkObjectResult>((await controller.Convert(Input, default)).Result);
        var result = Assert.IsType<ApiResponse<ComedyConversionResponse>>(response.Value).Data!;
        Assert.Equal("{\"kind\":\"animstudio-story\"}", result.Reply);
        Assert.Equal("stub-text", result.Provider);
        Assert.Equal("owner", Assert.Single(ai.Contexts).UserId);
        Assert.Contains("Third scene", Assert.Single(ai.TextCalls).Prompt);
    }

    [Fact]
    public async Task Quota_refusal_and_unavailable_model_are_not_success_responses()
    {
        var ai = new FakeAi();
        var denied = await new ComedyWorkspaceController(ai, new Access(false), new User()).Convert(Input, default);
        Assert.Equal(403, Assert.IsType<ObjectResult>(denied.Result).StatusCode);
        Assert.Empty(ai.TextCalls);

        var unavailable = await new ComedyWorkspaceController(ai, new Access(true), new User()).Convert(Input, default);
        Assert.Equal(503, Assert.IsType<ObjectResult>(unavailable.Result).StatusCode);
    }

    [Fact]
    public void Request_validation_refuses_oversized_and_unsupported_fields()
    {
        var invalid = Input with { Material = new string('x', 20001), Language = "fr", Style = "live", TargetSeconds = 29, Voicing = "invalid" };
        var errors = new List<ValidationResult>();
        Assert.False(Validator.TryValidateObject(invalid, new ValidationContext(invalid), errors, true));
        Assert.Equal(5, errors.Count);
    }
}
