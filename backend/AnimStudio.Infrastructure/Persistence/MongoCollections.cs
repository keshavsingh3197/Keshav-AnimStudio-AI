namespace AnimStudio.Infrastructure.Persistence;

/// <summary>Collection names in one place, so a typo cannot silently create a second store.</summary>
public static class MongoCollections
{
    public const string Projects = "projects";
    public const string Characters = "characters";
    public const string Scenes = "scenes";
    public const string Assets = "assets";
    public const string Scripts = "scripts";
    public const string Ingests = "transcriptIngests";
    public const string RenderJobs = "renderJobs";
    public const string AiUsage = "aiUsage";
    public const string AiCredentials = "aiCredentials";
    public const string PromptTemplates = "promptTemplates";
    public const string AiSettings = "aiSettings";
    public const string AdminAudit = "adminAudit";
}
