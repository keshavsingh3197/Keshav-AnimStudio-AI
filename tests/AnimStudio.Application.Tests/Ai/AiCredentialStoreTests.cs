using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai;
using KeshavSingh.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class AiCredentialStoreTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);
    private static readonly AiProviderId Groq = AiProviderId.Parse("groq");

    /// <summary>A throwaway AES-256 key. Test-only, and never a key any deployment uses.</summary>
    private const string TestDataKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

    private sealed class FakeCredentialRepository : IAiCredentialRepository
    {
        private readonly Dictionary<string, AiCredential> _byProvider = new(StringComparer.Ordinal);

        public Task<AiCredential?> GetAsync(string providerId, CancellationToken ct) =>
            Task.FromResult(_byProvider.GetValueOrDefault(providerId));

        public Task<IReadOnlyList<AiCredential>> ListAsync(CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<AiCredential>>([.. _byProvider.Values]);

        public Task UpsertAsync(AiCredential credential, CancellationToken ct)
        {
            _byProvider[credential.ProviderId] = credential;
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string providerId, CancellationToken ct) =>
            Task.FromResult(_byProvider.Remove(providerId));

        public AiCredential? Raw(string providerId) => _byProvider.GetValueOrDefault(providerId);
    }

    private static (AiCredentialStore Store, FakeCredentialRepository Repository)
        Build(params (string Key, string Value)[] configuration)
    {
        var (store, repository, _) = BuildWithResolver(configuration);
        return (store, repository);
    }

    private static (AiCredentialStore Store, FakeCredentialRepository Repository, StubSecretResolver Resolver)
        BuildWithResolver(params (string Key, string Value)[] configuration)
    {
        var repository = new FakeCredentialRepository();
        var resolver = new StubSecretResolver();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(configuration.Select(c =>
                new KeyValuePair<string, string?>(c.Key, c.Value)))
            .Build();

        var protector = new Lazy<DataProtector>(() => new DataProtector(
            Microsoft.Extensions.Options.Options.Create(
                new EncryptionOptions { DataKey = TestDataKey })));

        var store = new AiCredentialStore(
            repository, protector, config, resolver, new ManualTimeProvider(Now),
            NullLogger<AiCredentialStore>.Instance);

        return (store, repository, resolver);
    }

    [Fact]
    public async Task A_key_round_trips_through_encryption()
    {
        var (store, _) = Build();

        await store.SetAsync(Groq, "gsk_super_secret_value_9f2c", "admin-1", CancellationToken.None);

        Assert.Equal("gsk_super_secret_value_9f2c",
            await store.GetSecretAsync(Groq, CancellationToken.None));
    }

    [Fact]
    public async Task The_key_is_never_stored_in_plaintext()
    {
        var (store, repository) = Build();
        const string secret = "gsk_super_secret_value_9f2c";

        await store.SetAsync(Groq, secret, "admin-1", CancellationToken.None);

        var stored = repository.Raw("groq")!;
        Assert.DoesNotContain(secret, stored.CipherText, StringComparison.Ordinal);
        Assert.DoesNotContain("super_secret", stored.CipherText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_ciphertext_differs_every_time_even_for_the_same_key()
    {
        // AES-GCM with a fresh nonce. Identical ciphertext would leak that two providers
        // share a key.
        var (store, repository) = Build();

        await store.SetAsync(Groq, "gsk_the_same_key_value", null, CancellationToken.None);
        var first = repository.Raw("groq")!.CipherText;

        await store.SetAsync(Groq, "gsk_the_same_key_value", null, CancellationToken.None);
        var second = repository.Raw("groq")!.CipherText;

        Assert.NotEqual(first, second);
    }

    [Fact]
    public async Task Describing_a_key_reveals_a_mask_and_never_the_value()
    {
        var (store, _) = Build();

        var status = await store.SetAsync(
            Groq, "gsk_super_secret_value_9f2c", "admin-1", CancellationToken.None);

        Assert.True(status.Configured);
        Assert.Equal(AiCredentialSource.Database, status.Source);
        Assert.Equal("9f2c", status.Last4);
        Assert.Equal("••••9f2c", status.Masked);
        Assert.Equal(8, status.Fingerprint!.Length);
        Assert.DoesNotContain("super_secret", status.Fingerprint, StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_same_key_always_has_the_same_fingerprint_and_a_different_key_does_not()
    {
        // The fingerprint is how two systems confirm they hold the same key without
        // either of them showing it.
        var (a, _) = Build();
        var (b, _) = Build();

        var first = await a.SetAsync(Groq, "gsk_identical_key_value", null, CancellationToken.None);
        var second = await b.SetAsync(Groq, "gsk_identical_key_value", null, CancellationToken.None);
        var third = await b.SetAsync(Groq, "gsk_a_different_value_x", null, CancellationToken.None);

        Assert.Equal(first.Fingerprint, second.Fingerprint);
        Assert.NotEqual(first.Fingerprint, third.Fingerprint);
    }

    [Fact]
    public async Task A_key_supplied_by_the_host_is_used_and_reported_as_read_only()
    {
        var (store, _) = Build(("Ai:Secrets:groq", "gsk_from_the_environment"));

        Assert.Equal("gsk_from_the_environment",
            await store.GetSecretAsync(Groq, CancellationToken.None));

        var status = await store.DescribeAsync(Groq, CancellationToken.None);
        Assert.Equal(AiCredentialSource.Configuration, status.Source);
        Assert.True(status.Configured);
    }

    [Fact]
    public async Task A_key_set_in_the_admin_ui_takes_precedence_over_the_environment()
    {
        var (store, _) = Build(("Ai:Secrets:groq", "gsk_from_the_environment"));

        await store.SetAsync(Groq, "gsk_pasted_just_now_1234", "admin-1", CancellationToken.None);

        Assert.Equal("gsk_pasted_just_now_1234",
            await store.GetSecretAsync(Groq, CancellationToken.None));
    }

    [Fact]
    public async Task Host_supplied_keys_appear_in_the_listing_alongside_stored_ones()
    {
        var (store, _) = Build(("Ai:Secrets:gemini", "AIza_from_the_environment"));

        await store.SetAsync(Groq, "gsk_stored_in_the_database", null, CancellationToken.None);

        var all = await store.DescribeAllAsync(CancellationToken.None);

        Assert.Equal(2, all.Count);
        Assert.Contains(all, c => c.ProviderId == "groq" && c.Source == AiCredentialSource.Database);
        Assert.Contains(all, c => c.ProviderId == "gemini" && c.Source == AiCredentialSource.Configuration);
    }

    [Fact]
    public async Task An_unset_provider_reports_as_not_configured_rather_than_failing()
    {
        var (store, _) = Build();

        var status = await store.DescribeAsync(Groq, CancellationToken.None);

        Assert.False(status.Configured);
        Assert.Equal(AiCredentialSource.None, status.Source);
        Assert.Equal(string.Empty, status.Masked);
        Assert.Null(await store.GetSecretAsync(Groq, CancellationToken.None));
    }

    [Fact]
    public async Task Surrounding_whitespace_from_a_paste_is_trimmed()
    {
        // A trailing newline is the single most common reason a correct key is rejected by
        // a provider, and the resulting error says "unauthorized", not "you pasted a newline".
        var (store, _) = Build();

        await store.SetAsync(Groq, "  gsk_pasted_with_a_newline\n", null, CancellationToken.None);

        Assert.Equal("gsk_pasted_with_a_newline",
            await store.GetSecretAsync(Groq, CancellationToken.None));
    }

    [Theory]
    [InlineData("", "key-required")]
    [InlineData("   ", "key-required")]
    [InlineData("short", "key-too-short")]
    public async Task An_implausible_key_is_refused_with_a_code(string secret, string expectedCode)
    {
        var (store, _) = Build();

        var error = await Assert.ThrowsAsync<AiCredentialException>(() =>
            store.SetAsync(Groq, secret, null, CancellationToken.None));

        Assert.Equal(expectedCode, error.Code);
    }

    [Fact]
    public async Task A_key_containing_a_line_break_is_refused_with_an_accurate_message()
    {
        var (store, _) = Build();

        var error = await Assert.ThrowsAsync<AiCredentialException>(() =>
            store.SetAsync(Groq, "gsk_first_half\ngsk_second_half", null, CancellationToken.None));

        Assert.Equal("key-invalid", error.Code);
        Assert.DoesNotContain("gsk_first_half", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task An_over_long_value_is_refused()
    {
        var (store, _) = Build();

        var error = await Assert.ThrowsAsync<AiCredentialException>(() =>
            store.SetAsync(Groq, new string('a', 513), null, CancellationToken.None));

        Assert.Equal("key-too-long", error.Code);
    }

    [Fact]
    public async Task Rotating_a_key_keeps_the_original_creation_time_and_records_the_rotation()
    {
        var (store, _) = Build();

        await store.SetAsync(Groq, "gsk_the_first_key_value", "admin-1", CancellationToken.None);
        var rotated = await store.SetAsync(Groq, "gsk_the_second_key_val", "admin-2", CancellationToken.None);

        Assert.Equal(Now.UtcDateTime, rotated.CreatedAt);
        Assert.Equal(Now.UtcDateTime, rotated.RotatedAt);
        Assert.Equal("gsk_the_second_key_val", await store.GetSecretAsync(Groq, CancellationToken.None));
    }

    [Fact]
    public async Task Deleting_a_key_removes_it_and_reports_whether_there_was_one()
    {
        var (store, _) = Build();

        Assert.False(await store.DeleteAsync(Groq, CancellationToken.None));

        await store.SetAsync(Groq, "gsk_installed_for_now_x", null, CancellationToken.None);

        Assert.True(await store.DeleteAsync(Groq, CancellationToken.None));
        Assert.Null(await store.GetSecretAsync(Groq, CancellationToken.None));
    }

    [Fact]
    public async Task Deleting_a_stored_key_falls_back_to_the_host_supplied_one()
    {
        var (store, _) = Build(("Ai:Secrets:groq", "gsk_from_the_environment"));

        await store.SetAsync(Groq, "gsk_pasted_just_now_1234", null, CancellationToken.None);
        await store.DeleteAsync(Groq, CancellationToken.None);

        Assert.Equal("gsk_from_the_environment",
            await store.GetSecretAsync(Groq, CancellationToken.None));
    }

    [Fact]
    public async Task An_empty_provider_id_is_handled_rather_than_throwing()
    {
        var (store, _) = Build();

        Assert.Null(await store.GetSecretAsync(default, CancellationToken.None));
        Assert.False((await store.DescribeAsync(default, CancellationToken.None)).Configured);
        Assert.False(await store.DeleteAsync(default, CancellationToken.None));
    }
    [Fact]
    public async Task Installing_a_key_tells_the_resolver_to_forget_what_it_cached()
    {
        // Provider availability is answered from a cached presence flag. Without this, a key
        // pasted in the admin console would save correctly and the capability would keep
        // reporting NotConfigured until the next restart.
        var (store, _, resolver) = BuildWithResolver();

        await store.SetAsync(Groq, "gsk_super_secret_value_9f2c", "admin-1", CancellationToken.None);

        Assert.Contains(Groq, resolver.Invalidated);
    }

    [Fact]
    public async Task Removing_a_key_tells_the_resolver_too()
    {
        var (store, _, resolver) = BuildWithResolver();

        await store.SetAsync(Groq, "gsk_super_secret_value_9f2c", "admin-1", CancellationToken.None);
        resolver.Invalidated.Clear();

        Assert.True(await store.DeleteAsync(Groq, CancellationToken.None));
        Assert.Contains(Groq, resolver.Invalidated);
    }

    [Fact]
    public async Task Removing_a_key_that_was_never_there_notifies_nobody()
    {
        var (store, _, resolver) = BuildWithResolver();

        Assert.False(await store.DeleteAsync(Groq, CancellationToken.None));
        Assert.Empty(resolver.Invalidated);
    }

}
