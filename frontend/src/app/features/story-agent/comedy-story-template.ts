import { StoryExportFile } from '../../core/models/story-agent.models';

/** An editable example using the same file format as Story Agent exports. */
export function comedyStoryTemplate(
  language: 'hi' | 'en', style: '2D' | '3D', targetSeconds: number, voicing: 'CharactersOnly' | 'Narrated',
): StoryExportFile {
  const hindi = language === 'hi';
  const title = hindi ? 'उदाहरण: मज़ेदार चाय की दुकान' : 'EXAMPLE: The surprising tea stall';
  const lines = hindi
    ? ['मेरी चाय कहाँ है?', 'कप तो आपकी जेब में है।']
    : ['Where is my tea?', 'The cup is in your pocket.'];
  return {
    kind: 'animstudio-story',
    version: 1,
    exportedAtUtc: new Date().toISOString(),
    story: {
      title,
      notes: 'Replace this example with your own story.',
      language,
      targetSeconds,
      format: 'Vertical',
      writer: 'Manual',
      voicing,
      genreId: 'funny',
      options: {
        artStyle: style === '2D' ? 'Cartoon' : 'Cartoon3D',
        narration: 'Stock',
        matchClipDuration: true,
        keepClipAudio: false,
        castVoices: true,
        visuals: 'UploadsOnly',
        music: false,
        renderWhenReady: false,
        autoApprove: false,
      },
    },
    script: {
      title,
      titleEnglish: 'EXAMPLE: The surprising tea stall',
      summary: 'Replace both example scenes with your own comedy.',
      musicQuery: 'playful comedy',
      reviewNotes: ['Replace the example dialogue and visual prompts before building.'],
      cast: [
        { name: 'Customer', gender: 'male', age: 'adult' },
        { name: 'Vendor', gender: 'female', age: 'adult' },
      ],
      scenes: lines.map((text, index) => ({
        number: index + 1,
        headline: index === 0 ? 'Missing tea' : 'Found it',
        narration: text,
        lines: [{ speaker: index === 0 ? 'Customer' : 'Vendor', text, emotion: index === 0 ? 'confused' : 'happy' }],
        english: index === 0 ? 'Where is my tea?' : 'The cup is in your pocket.',
        basis: 'reflection',
        sources: [],
        imagePrompt: index === 0
          ? 'A puzzled customer searches for tea at a colourful cartoon tea stall, vertical frame, no text.'
          : 'A smiling tea vendor points to a cup in the customer’s pocket, vertical frame, no text.',
        videoPrompt: index === 0
          ? 'The customer checks the table, looks around, and shrugs; the camera slowly pushes in.'
          : 'The vendor points at the pocket; the customer looks down and reacts with surprise.',
        imageKeywords: ['tea', 'cartoon', 'comedy'],
        mood: 'playful',
        moreImagePrompts: [],
      })),
    },
  };
}
