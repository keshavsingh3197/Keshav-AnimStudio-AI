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
  { id: 'DesiKhadiSitcom', label: '🔥 MJO Angry Sitcom & Khadi Banter (Recommended)', hint: 'Explosive @MakeJokeOf angry shouting, 0.05s interruption cut-offs, distinct character pitch & clean closeup punchlines' },
  { id: 'Auto', label: 'YouTube Auto (Angry Banter + Tu Tadak)', hint: 'High-retention comedy blend: rapid-fire buddy roasting, angry bursts & contrast character voices' },
  { id: 'GlobalSlapstick', label: '🌍 Global Slapstick Loop (International)', hint: 'Expressive 3D physical comedy, doorway peek-a-boos & Sky Gauntlet gags for worldwide viewers' },
  { id: 'TankSeries', label: '🛡️ Cartoon Tank Series (| EP XX)', hint: 'Expressive googly-eyed 3D tank battles & tiny cannon twist episodes' },
  { id: 'KhadiBhasha', label: 'Khadi Bhasha / Desi Tapri', hint: 'Earthy Haryana-UP street flavour ("अरे बावले", "इब देख तमाशा", "टैम") with loud comic comebacks' },
  { id: 'TuTadak', label: 'Tu Tadak Buddy Banter', hint: 'Raw close-friend roasting ("अबे सुन", "तू रहने दे", "दिमाग़ घुटनों में है क्या")' },
  { id: 'RoastAndTwist', label: 'Deadpan Roast + Twist', hint: 'Fake confidence -> deadpan silent beat -> savage 6-word comeback & reversal' },
  { id: 'FamilyClean', label: 'Family Clean Slapstick', hint: 'Warm all-ages situational chaos with playful expressions' },
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
