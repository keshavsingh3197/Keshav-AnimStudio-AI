with open('backend/AnimStudio.Api/Controllers/AssetsController.cs', 'r', encoding='utf-8') as f:
    text = f.read()

new_meth = '''    public sealed record ReorderAssetsRequest
    {
        public List<string> AssetIds { get; init; } = [];
    }

    [HttpPut("api/projects/{projectId}/assets/reorder")]
    public async Task<ActionResult<ApiResponse<object>>> ReorderAssets(
        string projectId, [FromBody] ReorderAssetsRequest req, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);
        var projectAssets = await assets.ListByProjectAsync(projectId, ct);
        for (int i = 0; i < req.AssetIds.Count; i++)
        {
            var id = req.AssetIds[i];
            var asset = projectAssets.FirstOrDefault(a => a.Id == id);
            if (asset != null)
            {
                asset.OrderIndex = i;
                await assets.ReplaceAsync(asset, ct);
            }
        }
        return Ok(ApiResponse.Ok<object>(null!));
    }
'''

idx = text.find("    public sealed record MoveAssetRequest")
text = text[:idx] + new_meth + "\n" + text[idx:]

with open('backend/AnimStudio.Api/Controllers/AssetsController.cs', 'w', encoding='utf-8') as f:
    f.write(text)
print('Added reorder endpoint')
