namespace AnimStudio.Domain.Rendering;

/// <summary>Coarse stage of a render job, used for progress messages.</summary>
public enum RenderStage
{
    None = 0,
    Preparing = 1,
    RenderingScene = 2,
    Merging = 3,
    Publishing = 4,
    Completed = 5
}
