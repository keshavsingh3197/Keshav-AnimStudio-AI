import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  ContinueStoryBody,
  CreateStoryRunBody,
  EditStoryScriptBody,
  REVIEW_STEP,
  RedoLookBody,
  RedoMusicBody,
  RedoNarrationBody,
  StoryAgentOptions,
  StoryBudgetReport,
  StoryBuildOptionsBody,
  StoryCaptionsSent,
  StoryExportFile,
  StoryReviewStage,
  StoryRun,
  StoryRunSummary,
  StorySeries,
  StoryWriterMode,
} from '../models/story-agent.models';

/**
 * The Story Agent's API: a title in, a researched and narrated video and its YouTube details out.
 * A story belongs to whoever started it; the API answers a stranger's story as it does a missing one.
 */
@Injectable({ providedIn: 'root' })
export class StoryAgentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/story-agent`;

  options(): Observable<StoryAgentOptions> {
    return this.unwrap(this.http.get<ApiResponse<StoryAgentOptions>>(`${this.base}/options`));
  }

  list(): Observable<StoryRunSummary[]> {
    return this.unwrap(this.http.get<ApiResponse<StoryRunSummary[]>>(`${this.base}/runs`));
  }

  create(body: CreateStoryRunBody): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.base}/runs`, body));
  }

  /** One story in full. The page polls this while the story is being made. */
  get(id: string): Observable<StoryRun> {
    return this.unwrap(this.http.get<ApiResponse<StoryRun>>(this.run(id)));
  }

  /** The text to paste into any chat when the script is written by hand. */
  prompt(id: string): Observable<string> {
    return this.unwrap(this.http.get<ApiResponse<{ prompt: string }>>(`${this.run(id)}/prompt`)).pipe(map((r) => r.prompt));
  }

  /** Gives the story its script from the reply a chat wrote. */
  paste(id: string, reply: string): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/script/paste`, { reply }));
  }

  editScript(id: string, body: EditStoryScriptBody): Observable<StoryRun> {
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/script`, body));
  }

  /** "Go with this script." Nothing is made yet; changing the words later takes the approval back. */
  approve(id: string): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/script/approve`, {}));
  }

  /** @param textEngine the engine to write it with: undefined keeps the story's, '' hands it back to the chain. */
  rewrite(id: string, writer?: StoryWriterMode, textEngine?: string): Observable<StoryRun> {
    const body: { writer?: StoryWriterMode; textEngine?: string } = {};
    if (writer) body.writer = writer;
    if (textEngine !== undefined) body.textEngine = textEngine;
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/script/rewrite`, body));
  }

  /** The story as a file - brief, choices and script - to keep, or to start again from with {@link importStory}. */
  exportStory(id: string): Observable<StoryExportFile> {
    return this.unwrap(this.http.get<ApiResponse<StoryExportFile>>(`${this.run(id)}/export`));
  }

  /** Starts a new story from an exported story file. Its script is read and checked once the research is in. */
  importStory(file: StoryExportFile): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.base}/runs/import`, file));
  }

  attachImage(id: string, scene: number, file: File): Observable<StoryRun> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/image`, form));
  }

  removeImage(id: string, scene: number): Observable<StoryRun> {
    return this.unwrap(this.http.delete<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/image`));
  }

  /** One of a scene's further pictures: `picture` 2 is the first after the scene's own, and one past the last adds one. */
  attachShot(id: string, scene: number, picture: number, file: File): Observable<StoryRun> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/pictures/${picture}`, form));
  }

  removeShot(id: string, scene: number, picture: number): Observable<StoryRun> {
    return this.unwrap(this.http.delete<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/pictures/${picture}`));
  }

  attachThumbnail(id: string, file: File): Observable<StoryRun> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/thumbnail`, form));
  }

  removeThumbnail(id: string): Observable<StoryRun> {
    return this.unwrap(this.http.delete<ApiResponse<StoryRun>>(`${this.run(id)}/thumbnail`));
  }

  attachVideo(id: string, scene: number, file: File): Observable<StoryRun> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/video`, form));
  }

  removeVideo(id: string, scene: number): Observable<StoryRun> {
    return this.unwrap(this.http.delete<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/video`));
  }

  /** Fetched through HttpClient, not an <img src>, so the request carries the same identity as every other call. */
  sceneImage(id: string, scene: number): Observable<Blob> {
    return this.http.get(`${this.run(id)}/scenes/${scene}/image`, { responseType: 'blob' });
  }

  shotImage(id: string, scene: number, picture: number): Observable<Blob> {
    return this.http.get(`${this.run(id)}/scenes/${scene}/pictures/${picture}`, { responseType: 'blob' });
  }

  thumbnailImage(id: string): Observable<Blob> {
    return this.http.get(`${this.run(id)}/thumbnail`, { responseType: 'blob' });
  }

  /**
   * The finished video, fetched through HttpClient for the same reason. A <video> or a download link cannot send the
   * guest identity, so for someone who is not signed in it is the only way to get a render they own.
   */
  renderFile(jobId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/render-jobs/${encodeURIComponent(jobId)}/download`, { responseType: 'blob' });
  }

  /** One subtitle track as an SRT file (UTF-8). Fetched through HttpClient so it carries the caller's identity. */
  subtitleFile(id: string, language: string): Observable<Blob> {
    return this.http.get(`${this.run(id)}/subtitles/${encodeURIComponent(language)}`, { responseType: 'blob' });
  }

  /** Adds the story's subtitles to one of its YouTube videos; no languages means every one the story has. */
  sendSubtitles(id: string, videoId: string, languages?: string[]): Observable<StoryCaptionsSent> {
    return this.unwrap(this.http.post<ApiResponse<StoryCaptionsSent>>(`${this.run(id)}/subtitles/youtube`, { videoId, languages }));
  }

  /** Approves the script and starts making the video. Options sent here replace the ones the story started with. */
  build(id: string, options?: StoryBuildOptionsBody): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/build`, options ?? {}));
  }

  /** What a build with these options would use of today's paid Google limits. Starts nothing. */
  budget(id: string, options?: StoryBuildOptionsBody): Observable<StoryBudgetReport> {
    return this.unwrap(this.http.post<ApiResponse<StoryBudgetReport>>(`${this.run(id)}/budget`, options ?? {}));
  }

  /** "This is good, go on": approves the step the build is waiting on. The music's level can come with it. */
  approveReview(id: string, stage: StoryReviewStage, musicVolume?: number): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/review/${REVIEW_STEP[stage]}/approve`,
      musicVolume === undefined ? {} : { musicVolume }));
  }

  redoNarration(id: string, body: RedoNarrationBody): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/narration/redo`, body));
  }

  redoMusic(id: string, body: RedoMusicBody): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/music/redo`, body));
  }

  /** The person's own track (MP3 or WAV), made in Google's music tool from the brief shown, say. */
  attachMusic(id: string, file: File): Observable<StoryRun> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/music`, form));
  }

  redoLook(id: string, body: RedoLookBody): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/look/redo`, body));
  }

  /** Makes the video play at another speed: a copy of the render, with its subtitles and chapters retimed to it. */
  changeSpeed(id: string, speed: number): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/speed`, { speed }));
  }

  /** A scene's narration, through HttpClient like a picture, so it carries the caller's identity. */
  sceneAudio(id: string, scene: number): Observable<Blob> {
    return this.http.get(`${this.run(id)}/scenes/${scene}/audio`, { responseType: 'blob' });
  }

  musicFile(id: string): Observable<Blob> {
    return this.http.get(`${this.run(id)}/music`, { responseType: 'blob' });
  }

  /** Every story that was continued, as series with their parts in order. */
  series(): Observable<StorySeries[]> {
    return this.unwrap(this.http.get<ApiResponse<StorySeries[]>>(`${this.base}/series`));
  }

  oneSeries(id: string): Observable<StorySeries> {
    return this.unwrap(this.http.get<ApiResponse<StorySeries>>(`${this.base}/series/${encodeURIComponent(id)}`));
  }

  /** Ideas for the next part: the kept ones cost nothing; fresh asks the text model for new ones. */
  suggestNextParts(id: string, fresh = false): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/next-parts`, { fresh }));
  }

  /** Starts the next part of the story. The answer is the new part. */
  continueStory(id: string, body: ContinueStoryBody = {}): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/continue`, body));
  }

  /** How far the series goes on by itself from this part; null stops it. */
  setSeriesAuto(id: string, upTo: number | null): Observable<StoryRun> {
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/series/auto`, { upTo }));
  }

  retry(id: string): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/retry`, {}));
  }

  cancel(id: string): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/cancel`, {}));
  }

  delete(id: string): Observable<void> {
    return this.http.delete(this.run(id)).pipe(map(() => undefined));
  }

  private run(id: string): string {
    return `${this.base}/runs/${encodeURIComponent(id)}`;
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((response) => response.data as T));
  }
}
