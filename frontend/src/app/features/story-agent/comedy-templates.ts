export type ComedyTemplateId = 'none' | 'levels' | 'challenge' | 'misunderstanding';

export const COMEDY_TEMPLATES: readonly { id: ComedyTemplateId; label: string; instruction: string }[] = [
  { id: 'none', label: 'No template', instruction: '' },
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

export function comedyNotes(template: ComedyTemplateId, count: number, notes: string): string {
  const choice = COMEDY_TEMPLATES.find((item) => item.id === template);
  if (!choice || choice.id === 'none') return notes.trim();
  const countInstruction = template === 'levels' ? ` Aim for ${count} distinct numbered situations.` : '';
  return [
    `${choice.instruction}${countInstruction} Use original characters and jokes, not copied footage, dialogue or music.`,
    notes.trim(),
  ].filter(Boolean).join('\n\n');
}
