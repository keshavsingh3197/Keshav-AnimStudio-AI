using AnimStudio.Application.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

public class CelebrationPlannerTests
{
    [Fact]
    public void An_unknown_kind_draws_nothing()
    {
        Assert.Null(CelebrationPlanner.Normalize("fireworks; rm -rf", null, 50, 1, 1, "x"));
        Assert.Null(CelebrationPlanner.Normalize(null, null, 50, 1, 1, "x"));
    }

    [Fact]
    public void Values_are_held_to_their_ranges()
    {
        var s = CelebrationPlanner.Normalize("Confetti", "sideways", 900, double.NaN, -4, "x")!;
        Assert.Equal(CelebrationKind.Confetti, s.Kind);
        Assert.Equal(CelebrationMode.Burst, s.Mode);
        Assert.Equal(CelebrationPlanner.MaxDensity, s.Density);
        Assert.Equal(1, s.Size);
        Assert.Equal(CelebrationPlanner.MinSpeed, s.Speed);
    }

    [Fact]
    public void Weather_keeps_falling_by_default()
    {
        Assert.Equal(CelebrationMode.Rain, CelebrationPlanner.Normalize("snow", null, null, null, null, "x")!.Mode);
        Assert.Equal(CelebrationMode.Burst, CelebrationPlanner.Normalize("flowers", null, null, null, null, "x")!.Mode);
        Assert.Equal(CelebrationMode.Rain, CelebrationPlanner.Normalize("flowers", "rain", null, null, null, "x")!.Mode);
    }

    [Theory]
    [InlineData(1, 8)]
    [InlineData(100, CelebrationPlanner.MaxParticles)]
    public void Density_sets_the_particle_count(int density, int expected)
    {
        var s = CelebrationPlanner.Normalize("hearts", null, density, 1, 1, "x")!;
        Assert.Equal(expected, CelebrationPlanner.Plan(s, 1920, 1080, 5).Count);
    }

    [Fact]
    public void The_same_item_always_plans_the_same_particles()
    {
        var s = CelebrationPlanner.Normalize("flowers", null, 60, 1, 1, "item-7")!;
        Assert.Equal(CelebrationPlanner.Plan(s, 1080, 1920, 4), CelebrationPlanner.Plan(s, 1080, 1920, 4));
    }

    /// <summary>
    /// The studio's preview (frontend celebration.ts) pins these same numbers, so a change on
    /// one side that the other doesn't follow fails here or there instead of drifting silently.
    /// </summary>
    [Theory]
    [InlineData("confetti", ParticleShape.Ribbon, "9b5de5", 28, 12, 0.28264654730446637, 1.1029515857808292)]
    [InlineData("cannon", ParticleShape.Ribbon, "f15bb5", 36, 16, 0.04, 0.5737636706326157)]
    [InlineData("flowers", ParticleShape.Petal, "ff8fab", 48, 30, 0.9802954201586545, 1.5598768502241)]
    [InlineData("hearts", ParticleShape.Heart, "ff4d6d", 62, 62, 0.8546509237028658, 0.8646180568030104)]
    [InlineData("sparkles", ParticleShape.Star, "ffe8a3", 52, 52, 0.9562727843876928, 3.74370444053784)]
    [InlineData("balloons", ParticleShape.Balloon, "ef476f", 82, 110, 0.8546509237028658, 0.8646180568030104)]
    public void Matches_the_studio_preview(string kind, ParticleShape shape, string rgb, int width, int height, double x0, double delay)
    {
        Assert.Equal(1782669047, CelebrationPlanner.Seed("item-42"));
        var s = CelebrationPlanner.Normalize(kind, null, 37, 1.3, 0.8, "item-42")!;
        var particles = CelebrationPlanner.Plan(s, 1920, 1080, 6);
        var last = particles[^1];

        Assert.Equal(23, particles.Count);
        Assert.Equal(shape, last.Shape);
        Assert.Equal(rgb, last.Rgb);
        Assert.Equal(width, last.Width);
        Assert.Equal(height, last.Height);
        Assert.Equal(x0, last.X0, 12);
        Assert.Equal(delay, last.Delay, 12);
    }
}
