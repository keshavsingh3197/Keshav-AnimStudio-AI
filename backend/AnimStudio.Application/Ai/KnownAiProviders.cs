using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Ai;

/// <summary>
/// The wire format a provider speaks. Several services share one - which is the whole
/// reason a single OpenAI-compatible implementation can cover Groq, OpenRouter, Together,
/// Ollama and LM Studio.
/// </summary>
public enum AiProviderFamily
{
    OpenAiCompatibleText = 1,
    GeminiText = 2,
    PollinationsImage = 3,
    CloudflareWorkersAiImage = 4,
    HuggingFaceImage = 5,
    ComfyUiImage = 6,
    PiperSpeech = 7,
    OpenAiCompatibleTts = 8,
    WhisperCppTranscription = 9,
    OpenAiCompatibleAsr = 10,
    GeminiTts = 11
}

/// <summary>
/// Everything needed to offer a provider in the admin console and to construct it, without
/// anyone having to know a base URL or a model name by heart.
/// </summary>
/// <param name="DefaultDailyRequestLimit">
/// A deliberately conservative reading of the service's published free allowance. It exists
/// so that the first time someone pastes a key they cannot burn a day's quota in a single
/// runaway batch; it is not a billing guarantee, and an operator can raise it.
/// </param>
public sealed record AiProviderDescriptor(
    string Id,
    AiCapability Capability,
    AiProviderFamily Family,
    string DisplayName,
    string? DefaultBaseUrl,
    string? DefaultModel,
    bool RunsLocally,
    string FreeTierNote,
    string? KeyUrl,
    string LicenseClass = "Unknown",
    int? DefaultDailyRequestLimit = null,
    IReadOnlyList<AiModelChoice>? Models = null)
{
    /// <summary>
    /// Whether a model may be asked for per request: one this catalogue offers, or the one the
    /// operator configured. Anything else is refused - a model name reaches a request path.
    /// </summary>
    public bool Allows(string model, string? configuredModel) =>
        (Models ?? []).Any(m => string.Equals(m.Id, model, StringComparison.Ordinal))
        || string.Equals(model, configuredModel, StringComparison.Ordinal);

    /// <summary>
    /// A provider on this machine needs no key; a hosted one does. Derived rather than
    /// declared, so a local endpoint can never be configured to send a key over the wire.
    /// </summary>
    public bool RequiresApiKey => !RunsLocally;

    public AiProviderId ProviderId => AiProviderId.Parse(Id);
}

/// <summary>A model a user may pick per request, with a label that says what it trades.</summary>
public sealed record AiModelChoice(string Id, string Label);

/// <summary>
/// The catalogue of providers this build can actually construct.
/// </summary>
/// <remarks>
/// Only implemented providers appear here. A catalogue entry is a promise the admin console
/// makes to the user - offering one with no implementation behind it would let someone
/// configure a key, see it accepted, and get nothing.
/// </remarks>
public static class KnownAiProviders
{
    public const string Groq = "groq";
    public const string OpenRouter = "openrouter";
    public const string Together = "together";
    public const string Ollama = "ollama";
    public const string LmStudio = "lmstudio";
    public const string Gemini = "gemini";
    public const string Pollinations = "pollinations";
    public const string CloudflareWorkersAi = "cloudflare-ai";
    public const string HuggingFace = "huggingface";
    public const string ComfyUiLocal = "comfyui-local";
    public const string PiperLocal = "piper-local";
    public const string Kokoro = "kokoro";
    public const string OpenAiTts = "openai-tts";
    public const string GeminiTts = "gemini-tts";
    public const string WhisperCppLocal = "whispercpp-local";
    public const string FasterWhisper = "faster-whisper";
    public const string GroqWhisper = "groq-whisper";
    public const string OpenAiAsr = "openai-asr";

    public static IReadOnlyList<AiProviderDescriptor> All { get; } =
    [
        new(Groq, AiCapability.Text, AiProviderFamily.OpenAiCompatibleText,
            "Groq",
            "https://api.groq.com/openai/v1",
            "llama-3.3-70b-versatile",
            RunsLocally: false,
            "Free tier with a generous daily request allowance and very fast responses. " +
            "The best default for extraction work, which is many small calls.",
            "https://console.groq.com/keys",
            DefaultDailyRequestLimit: 900),

        new(Gemini, AiCapability.Text, AiProviderFamily.GeminiText,
            "Google Gemini",
            "https://generativelanguage.googleapis.com",
            "gemini-2.5-flash",
            RunsLocally: false,
            "Free tier on the Flash models. Handles long transcripts in one call, so it is " +
            "the better fallback when a whole video's captions go in at once.",
            "https://aistudio.google.com/apikey",
            DefaultDailyRequestLimit: 1200),

        new(OpenRouter, AiCapability.Text, AiProviderFamily.OpenAiCompatibleText,
            "OpenRouter",
            "https://openrouter.ai/api/v1",
            "meta-llama/llama-3.3-70b-instruct:free",
            RunsLocally: false,
            "Routes to many models behind one key, including several marked ':free'. " +
            "Useful as a third fallback because it rarely rate-limits at the same time as the others.",
            "https://openrouter.ai/keys",
            DefaultDailyRequestLimit: 200),

        new(Together, AiCapability.Text, AiProviderFamily.OpenAiCompatibleText,
            "Together AI",
            "https://api.together.xyz/v1",
            "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            RunsLocally: false,
            "Free endpoints for a small set of models.",
            "https://api.together.ai/settings/api-keys",
            DefaultDailyRequestLimit: 200),

        new(Ollama, AiCapability.Text, AiProviderFamily.OpenAiCompatibleText,
            "Ollama (local)",
            "http://localhost:11434/v1",
            "llama3.2",
            RunsLocally: true,
            "Runs on this machine, so there is no key, no quota and no request leaving the " +
            "network. Slower, and the only option that stays free at any volume.",
            KeyUrl: null),

        new(LmStudio, AiCapability.Text, AiProviderFamily.OpenAiCompatibleText,
            "LM Studio (local)",
            "http://localhost:1234/v1",
            null,
            RunsLocally: true,
            "Same as Ollama, for people who already run LM Studio's server. The model is " +
            "whichever one LM Studio has loaded, so the model name may be left empty.",
            KeyUrl: null),

        new(Pollinations, AiCapability.Image, AiProviderFamily.PollinationsImage,
            "Pollinations",
            "https://image.pollinations.ai",
            "flux",
            RunsLocally: false,
            "No account and no key - the one provider that works the moment it is switched " +
            "on. It sends the prompt in the URL, so it suits public material better than " +
            "private material.",
            KeyUrl: null,
            DefaultDailyRequestLimit: 500),

        new(ComfyUiLocal, AiCapability.Image, AiProviderFamily.ComfyUiImage,
            "ComfyUI (local)",
            "http://localhost:8188",
            null,
            RunsLocally: true,
            "Runs on this machine with no quota at all, which is the only way a " +
            "hundred-scene video gets a hundred backgrounds. Set the model to a checkpoint " +
            "filename your install has.",
            KeyUrl: null,
            LicenseClass: "PublicDomain"),

        new(CloudflareWorkersAi, AiCapability.Image, AiProviderFamily.CloudflareWorkersAiImage,
            "Cloudflare Workers AI",
            null,
            "@cf/black-forest-labs/flux-1-schnell",
            RunsLocally: false,
            "Free daily allowance. The base URL must include your account id: " +
            "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/",
            "https://dash.cloudflare.com/profile/api-tokens",
            DefaultDailyRequestLimit: 100),

        new(HuggingFace, AiCapability.Image, AiProviderFamily.HuggingFaceImage,
            "Hugging Face Inference",
            "https://api-inference.huggingface.co",
            "black-forest-labs/FLUX.1-schnell",
            RunsLocally: false,
            "The widest range of open models behind one key. A model that has been idle is " +
            "asleep, so the first request after a pause is slow rather than failed.",
            "https://huggingface.co/settings/tokens",
            DefaultDailyRequestLimit: 100),

        new(PiperLocal, AiCapability.Speech, AiProviderFamily.PiperSpeech,
            "Piper (local)",
            DefaultBaseUrl: null,
            DefaultModel: null,
            RunsLocally: true,
            "A narrated video is one call per line and a transcript has hundreds, which no " +
            "hosted free tier survives. Piper runs on the CPU with no quota at all. Set the " +
            "executable path and a folder of .onnx voices.",
            KeyUrl: null,
            LicenseClass: "PublicDomain"),

        new(Kokoro, AiCapability.Speech, AiProviderFamily.OpenAiCompatibleTts,
            "Kokoro (local server)",
            "http://localhost:8880/v1",
            "kokoro",
            RunsLocally: true,
            "Better-sounding than Piper and still local, for people already running " +
            "Kokoro-FastAPI. It implements the same route as the hosted services.",
            KeyUrl: null,
            LicenseClass: "PublicDomain"),

        new(GeminiTts, AiCapability.Speech, AiProviderFamily.GeminiTts,
            "Google Gemini speech",
            "https://generativelanguage.googleapis.com",
            "gemini-2.5-flash-preview-tts",
            RunsLocally: false,
            "Thirty natural stock voices that speak Hindi and English alike, steered by " +
            "asking (\"Say cheerfully: ...\"). Billed per use on a paid Gemini key, so Google " +
            "Cloud credits cover it. It needs its own copy of the Gemini key, and is never " +
            "sent a recording of anyone's voice.",
            "https://aistudio.google.com/apikey",
            DefaultDailyRequestLimit: 500,
            Models:
            [
                new("gemini-2.5-flash-preview-tts", "Flash - fast, cheaper"),
                new("gemini-2.5-pro-preview-tts", "Pro - most expressive, costs more")
            ]),

        new(OpenAiTts, AiCapability.Speech, AiProviderFamily.OpenAiCompatibleTts,
            "OpenAI-compatible speech",
            null,
            "tts-1",
            RunsLocally: false,
            "Any hosted service implementing /audio/speech. Paid rather than free, so it " +
            "belongs last in the chain if it is configured at all.",
            KeyUrl: null),

        new(WhisperCppLocal, AiCapability.Transcription, AiProviderFamily.WhisperCppTranscription,
            "whisper.cpp (local)",
            DefaultBaseUrl: null,
            DefaultModel: "ggml-base.en",
            RunsLocally: true,
            "The provider that makes a link-to-video run free: a match is an hour of audio " +
            "and every hosted recognizer meters by the minute. Nothing leaves the machine, " +
            "so a private recording stays private. Set the executable path, a folder of " +
            "ggml .bin models, and which one to load by its filename without the extension.",
            KeyUrl: null,
            LicenseClass: "PublicDomain"),

        new(FasterWhisper, AiCapability.Transcription, AiProviderFamily.OpenAiCompatibleAsr,
            "faster-whisper (local server)",
            "http://localhost:8000/v1",
            null,
            RunsLocally: true,
            "Several times faster than whisper.cpp on the same machine, for people already " +
            "running faster-whisper-server or Speaches. It implements the same route as the " +
            "hosted services, and serves whichever model it has loaded.",
            KeyUrl: null,
            LicenseClass: "PublicDomain"),

        new(GroqWhisper, AiCapability.Transcription, AiProviderFamily.OpenAiCompatibleAsr,
            "Groq Whisper",
            "https://api.groq.com/openai/v1",
            "whisper-large-v3-turbo",
            RunsLocally: false,
            "A free hosted recognizer, and far faster than transcribing on a machine with " +
            "no GPU. It needs its own copy of the Groq key: credentials are held per " +
            "provider id, and this is a separate id from the text provider on purpose, so " +
            "that turning one off does not turn off the other.",
            "https://console.groq.com/keys",
            DefaultDailyRequestLimit: 300),

        new(OpenAiAsr, AiCapability.Transcription, AiProviderFamily.OpenAiCompatibleAsr,
            "OpenAI-compatible transcription",
            null,
            "whisper-1",
            RunsLocally: false,
            "Any hosted service implementing /audio/transcriptions. Paid rather than free, " +
            "so it belongs last in the chain if it is configured at all.",
            KeyUrl: null)
    ];

    /// <summary>
    /// What a wire format can do. Needed for a provider this build has never heard of: an
    /// operator names a <c>Family</c> in configuration, and that is the only thing which
    /// says whether the id belongs in the Text chain or the Speech one.
    /// </summary>
    public static AiCapability CapabilityOf(AiProviderFamily family) => family switch
    {
        AiProviderFamily.OpenAiCompatibleText or AiProviderFamily.GeminiText => AiCapability.Text,

        AiProviderFamily.PollinationsImage
            or AiProviderFamily.CloudflareWorkersAiImage
            or AiProviderFamily.HuggingFaceImage
            or AiProviderFamily.ComfyUiImage => AiCapability.Image,

        AiProviderFamily.PiperSpeech
            or AiProviderFamily.OpenAiCompatibleTts
            or AiProviderFamily.GeminiTts => AiCapability.Speech,

        AiProviderFamily.WhisperCppTranscription
            or AiProviderFamily.OpenAiCompatibleAsr => AiCapability.Transcription,

        // A new family with no case here would otherwise silently land in whichever chain
        // was listed first, so it is refused until someone states the answer.
        _ => throw new ArgumentOutOfRangeException(nameof(family), family, "Unknown provider family.")
    };

    public static IReadOnlyList<AiProviderDescriptor> For(AiCapability capability) =>
        [.. All.Where(d => d.Capability == capability)];

    public static AiProviderDescriptor? Find(string? id) =>
        id is null ? null : All.FirstOrDefault(d => string.Equals(d.Id, id, StringComparison.OrdinalIgnoreCase));
}
