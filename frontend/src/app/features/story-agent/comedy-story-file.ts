import { StoryExportFile } from '../../core/models/story-agent.models';
import { readStoryFile, STORY_FILE_MAX_BYTES } from './story-agent.utils';

export async function parseComedyStory(text: string, name = 'comedy.story.json'): Promise<StoryExportFile> {
  const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!json) throw new Error('Paste the complete JSON response first.');
  return readStoryFile(new File([json], name, { type: 'application/json' }));
}

export async function readComedyStoryUpload(file: File): Promise<{ story: StoryExportFile; text: string }> {
  if (file.size > STORY_FILE_MAX_BYTES) throw new Error(`"${file.name}" is too big to be a story file.`);
  const text = await file.text();
  return { story: await parseComedyStory(text, file.name), text };
}
