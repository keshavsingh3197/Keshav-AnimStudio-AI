export type ComedyTemplateId =
  | 'none'
  | 'tu-tadak-roast'
  | 'khadi-bhasha-tapri'
  | 'viral-skit-hook'
  | 'levels'
  | 'challenge'
  | 'misunderstanding';

export type ComedyToneStyle =
  | 'Auto'
  | 'KhadiBhasha'
  | 'TuTadak'
  | 'RoastAndTwist'
  | 'FamilyClean'
  | 'GlobalSlapstick'
  | 'TankSeries'
  | 'DesiKhadiSitcom';

export const COMEDY_TONE_OPTIONS: readonly { id: ComedyToneStyle; label: string; hint: string }[] = [
  { id: 'Auto', label: 'YouTube Auto (Khadi Bhasha + Tu Tadak)', hint: 'Best Hindi retention blend: desi tapri banter, casual तू-तड़ाक teasing & fast punches' },
  { id: 'GlobalSlapstick', label: '🌍 Global Slapstick Loop (International)', hint: 'Zero-dialogue 3D physical comedy, doorway peek-a-boos & Sky Gauntlet gags for worldwide viewers' },
  { id: 'TankSeries', label: '🛡️ Cartoon Tank Series (| EP XX)', hint: 'Expressive googly-eyed 3D tank battles & tiny cannon twist episodes' },
  { id: 'DesiKhadiSitcom', label: '🇮🇳 Desi Khadi Sitcom (MJO / HardToonz)', hint: '0:02 mid-shout cold open, wide-angle close-ups, Khadi Bhasha roasts & 1-3 word thumbnail hook' },
  { id: 'KhadiBhasha', label: 'Khadi Bhasha / Desi Tapri', hint: 'Earthy Haryana-UP street flavour ("अरे बावले", "इब देख तमाशा", "टैम")' },
  { id: 'TuTadak', label: 'Tu Tadak Buddy Banter', hint: 'Raw close-friend roasting ("अबे सुन", "तू रहने दे", "दिमाग़ घुटनों में है क्या")' },
  { id: 'RoastAndTwist', label: 'Deadpan Roast + Twist', hint: 'Fake confidence -> savage 6-word comeback -> upside-down climax reversal' },
  { id: 'FamilyClean', label: 'Family Clean Slapstick', hint: 'Clean all-ages situational chaos with playful expressions' },
];

export const COMEDY_TEMPLATES: readonly { id: ComedyTemplateId; label: string; instruction: string }[] = [
  { id: 'none', label: 'No template (Auto YouTube Hook)', instruction: '' },
  {
    id: 'tu-tadak-roast',
    label: 'Tu-Tadak Dost Roast (2-sec Hook)',
    instruction: 'Start in the first 2 seconds with one buddy making a shameless claim while the other roasts them in casual Tu-Tadak banter. Escalate in three quick comebacks and end with a tables-turned punchline.',
  },
  {
    id: 'khadi-bhasha-tapri',
    label: 'Khadi Bhasha Chai Tapri Skit',
    instruction: 'Set an everyday situation at an Indian chai tapri or neighborhood corner with earthy Khadi Bhasha expressions ("अरे बावले", "इब के करैगो"), a stubborn bystander, and a sudden bill/excuse twist.',
  },
  {
    id: 'viral-skit-hook',
    label: 'YouTube Shorts Rule-of-3 Skit',
    instruction: 'Follow the YouTube comedy rhythm: instant conflict cold-open -> small exaggeration -> bigger bluff (mid-video reaction meme pause) -> total disaster reveal.',
  },
  {
    id: 'levels',
    label: 'Funny levels',
    instruction: 'Create a compilation of separate funny situations, escalating toward the funniest one. Label the situations as levels.',
  },
  {
    id: 'challenge',
    label: 'Comedy challenge',
    instruction: 'Give an original character a simple challenge and show increasingly funny attempts, ending with an unexpected payoff.',
  },
  {
    id: 'misunderstanding',
    label: 'Funny misunderstanding',
    instruction: 'Build a short comedy around a misunderstanding, escalating it through character reactions and ending with a clear punchline.',
  },
];

export function comedyNotes(
  template: ComedyTemplateId,
  count: number,
  notes: string,
  tone: ComedyToneStyle = 'Auto',
  autoInsertMemes = false,
): string {
  const choice = COMEDY_TEMPLATES.find((item) => item.id === template);
  const parts: string[] = [];
  if (choice && choice.id !== 'none') {
    const countInstruction = template === 'levels' ? ` Aim for ${count} distinct numbered situations.` : '';
    parts.push(`${choice.instruction}${countInstruction} Use original characters and jokes, not copied footage, dialogue or music.`);
  }
  const toneOption = COMEDY_TONE_OPTIONS.find((item) => item.id === tone);
  if (toneOption && tone !== 'Auto') {
    parts.push(`Spoken style (${toneOption.label}): ${toneOption.hint}`);
  }
  if (autoInsertMemes) {
    parts.push('Place reaction meme beats ("funnyEnding") right in the middle buildup scene and the final payoff.');
  }
  if (notes.trim()) parts.push(notes.trim());
  return parts.join('\n\n');
}
