using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>A small, realistic Hindi script and the research behind it, shared by the Story Agent tests.</summary>
internal static class StorySamples
{
    public static readonly DateTime Now = new(2026, 11, 2, 12, 0, 0, DateTimeKind.Utc);

    public static StoryBrief Brief(string language = "hi", int seconds = 60) => new()
    {
        Title = "दीपावली क्यों मनाई जाती है?",
        Language = language,
        TargetSeconds = seconds
    };

    public static StoryResearch Research() => new()
    {
        Topics =
        [
            new StoryTopicMatch
            {
                TopicId = "diwali",
                Name = "Diwali (Deepavali)",
                Summary = "The festival of lights.",
                Sources = [new StorySourceRef { TextId = "bhagavata-purana", TextName = "Bhagavata Purana", Ref = "8.8", Note = "Dhanvantari and Lakshmi emerge" }]
            }
        ],
        Passages =
        [
            new ScripturePassage
            {
                TextId = "bhagavata-purana", TextName = "Bhagavata Purana", Ref = "8.8", Language = "sa", Direct = true,
                Title = "श्रीमद्भागवतपुराणम्/स्कन्धः ८/अध्यायः ८", Url = "https://sa.wikisource.org/wiki/x", Excerpt = "श्रीशुक उवाच। पीते गरे वृषाङ्केण प्रीतास्तेऽमरदानवाः।"
            }
        ],
        RetrievedAtUtc = Now
    };

    /// <summary>The reply a model would give: JSON, as the prompt asks.</summary>
    public const string ReplyJson = """
        {
          "title": "दीपावली: क्यों मनाते हैं?",
          "titleEnglish": "Diwali: why we celebrate it",
          "summary": "दीपावली की कथाएँ ग्रंथों से।",
          "musicQuery": "sitar flute devotional",
          "reviewNotes": ["Check the Yama Dwitiya story against your edition."],
          "scenes": [
            {
              "headline": "एक दीप",
              "narration": "अंधकार चाहे कितना भी गहरा हो, एक छोटा-सा दीपक उसे मिटा देता है।",
              "english": "However deep the darkness, one small lamp dispels it.",
              "basis": "reflection",
              "imagePrompt": "A woman lighting clay lamps at a river ghat at dusk",
              "imageKeywords": ["lamps", "ghat", "dusk"],
              "mood": "devotional"
            },
            {
              "headline": "समुद्र मंथन",
              "narration": "भागवत पुराण के अनुसार, मंथन से भगवान धन्वंतरि अमृत कलश लेकर प्रकट हुए।",
              "english": "According to the Bhagavata Purana, Lord Dhanvantari emerged with the pot of nectar.",
              "basis": "text",
              "sources": [ { "text": "Srimad Bhagavatam", "ref": "8.8", "note": "Dhanvantari appears" } ],
              "imagePrompt": "Lord Dhanvantari rising from the ocean with an amrit kalash",
              "mood": "epic"
            },
            {
              "headline": "नरकासुर",
              "narration": "श्रीकृष्ण ने नरकासुर का वध किया और सबको मुक्त कराया।",
              "english": "Sri Krishna slew Narakasura and freed them all.",
              "basis": "text",
              "sources": [ { "text": "bhagavata-purana", "ref": "10.59" }, { "text": "Bhagavata Purana", "ref": "13.2" } ],
              "imagePrompt": "Krishna and Satyabhama on Garuda"
            },
            {
              "headline": "राम की वापसी",
              "narration": "मान्यता है कि अयोध्यावासियों ने घर-घर दीप जलाए।",
              "english": "It is believed the people of Ayodhya lit lamps at every home.",
              "basis": "tradition",
              "imagePrompt": "Ayodhya lit by thousands of diyas"
            },
            {
              "headline": "गोवर्धन",
              "narration": "श्रीकृष्ण ने गोवर्धन पर्वत उठाकर सबकी रक्षा की।",
              "english": "Krishna lifted Mount Govardhan and protected everyone.",
              "basis": "text",
              "sources": [ { "text": "Bhagavata Purana", "ref": "10.24-25" } ]
            },
            {
              "headline": "शुभ दीपावली",
              "narration": "आप सभी को दीपावली की हार्दिक शुभकामनाएँ।",
              "english": "Warm Deepavali wishes to you all.",
              "basis": "reflection"
            }
          ]
        }
        """;

    /// <summary>A parsed, normalised script from <see cref="ReplyJson"/>.</summary>
    public static StoryScript Script()
    {
        var result = StoryScriptParser.Parse(ReplyJson, Brief(), Research(), "test", Now, tolerant: false);
        return result.Script;
    }
}
