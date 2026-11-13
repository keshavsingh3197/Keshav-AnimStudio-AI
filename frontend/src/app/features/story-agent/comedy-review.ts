import { StoryExportFile } from '../../core/models/story-agent.models';

export interface ComedyReviewScene {
  headline: string;
  dialogue: string;
  image: string;
  action: string;
}

export interface ComedyReview {
  title: string;
  targetSeconds: number | undefined;
  scenes: ComedyReviewScene[];
  warnings: string[];
  prompt: string;
}

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function reviewComedyStory(file: StoryExportFile): ComedyReview {
  const script = file.script;
  if (!script) throw new Error('The story has no script.');
  const cast = Array.isArray(script['cast']) ? script['cast'].map((person) => text(object(person)['name'])).filter(Boolean) : [];
  const warnings: string[] = [];
  if (script.scenes.length < 2 || script.scenes.length > 60) warnings.push('A story needs 2 to 60 scenes with spoken words.');
  const scenes = script.scenes.map((value, index) => {
    const scene = object(value);
    const lines = Array.isArray(scene['lines']) ? scene['lines'].map(object) : [];
    const narration = text(scene['narration']);
    const spoken = lines.map((line) => text(line['text'])).join(' ').trim();
    if (!narration) warnings.push(`Scene ${index + 1} needs spoken dialogue.`);
    if ((!lines.length && file.story.voicing === 'CharactersOnly') || (lines.length > 0 && spoken !== narration)) {
      warnings.push(`Scene ${index + 1}: lines must match narration exactly or a narrator may read it.`);
    }
    if (file.story.voicing === 'CharactersOnly' && lines.some((line) => !cast.includes(text(line['speaker'])))) {
      warnings.push(`Scene ${index + 1}: every speaker must be a named cast member for character-only dialogue.`);
    }
    return {
      headline: text(scene['headline']) || `Scene ${index + 1}`,
      dialogue: lines.length ? lines.map((line) => `${text(line['speaker']) || 'Unknown'}: ${text(line['text'])}`).join('\n') : narration,
      image: text(scene['imagePrompt']),
      action: text(scene['videoPrompt']),
    };
  });
  const title = text(file.story.title) || text(script.title) || 'Untitled story';
  const style = text(file.story.options?.artStyle);
  const targetSeconds = file.story.targetSeconds;
  const prompt = [
    `Create an original ${file.story.format === 'Wide' ? '16:9 horizontal' : '9:16 vertical'} acted comedy: ${title}.`,
    targetSeconds
      ? `Aim for approximately ${targetSeconds} seconds in total, including pauses and reactions; actual duration depends on the video tool.`
      : 'Choose an appropriate total duration, including pauses and reactions; actual duration depends on the video tool.',
    `Visual style: ${style || 'consistent cartoon'}. Keep characters and setting consistent between shots.`,
    ...(cast.length ? [`Characters: ${cast.join(', ')}.`] : []),
    'Use expressive character actions and reactions, a clear setup and a funny payoff. No third-party characters, logos or music.',
    file.story.voicing === 'CharactersOnly'
      ? 'Characters speak their own lines on screen. No narrator or descriptive voiceover. Match the spoken language and dialogue below.'
      : 'Use the dialogue and narration below as written.',
    'Make separate clips if the video tool has a shorter clip limit. Check voices, lip sync, timing and continuity; edit and combine clips as needed.',
    ...scenes.flatMap((scene, index) => [
      '',
      `Scene ${index + 1}: ${scene.headline}`,
      `Dialogue:\n${scene.dialogue || '[Add spoken dialogue]'}`,
      `Setting: ${scene.image || '[Add a visual description]'}`,
      `Action and camera: ${scene.action || '[Add the characters’ actions]'}`,
    ]),
  ].join('\n');
  return { title, targetSeconds, scenes, warnings, prompt };
}
