using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    public sealed record ScreenshotRequest
    {
        public string Base64Image { get; init; } = string.Empty;
        public string ViewName { get; init; } = string.Empty;
    }

    [HttpPost("screenshot")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> SaveScreenshot([FromBody] ScreenshotRequest req)
    {
        try
        {
            var folder = @"D:\AI_STUDIO";
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            var base64Data = req.Base64Image.Contains(",") 
                ? req.Base64Image.Split(",")[1] 
                : req.Base64Image;

            var bytes = Convert.FromBase64String(base64Data);
            
            var safeName = string.IsNullOrWhiteSpace(req.ViewName) ? "screenshot" : string.Join("_", req.ViewName.Split(Path.GetInvalidFileNameChars()));
            var filename = $"{safeName}_{DateTime.Now:yyyyMMdd_HHmmss}.png";
            var path = Path.Combine(folder, filename);

            await System.IO.File.WriteAllBytesAsync(path, bytes);
            
            return Ok(new { success = true, path });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
