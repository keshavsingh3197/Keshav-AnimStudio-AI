import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  CreateStoryRunBody,
  EditStoryScriptBody,
  REVIEW_STEP,
  RedoLookBody,
  RedoMusicBody,
  RedoNarrationBody,
  StoryAgentOptions,
  StoryBuildOptionsBody,
  StoryCaptionsSent,
  StoryReviewStage,
  StoryRun,
  StoryRunSummary,
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

  rewrite(id: string, writer?: StoryWriterMode): Observable<StoryRun> {
    return this.unwrap(this.http.post<ApiResponse<StoryRun>>(`${this.run(id)}/script/rewrite`, writer ? { writer } : {}));
  }

  attachImage(id: string, scene: number, file: File): Observable<StoryRun> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.unwrap(this.http.put<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/image`, form));
  }

  removeImage(id: string, scene: number): Observable<StoryRun> {
    return this.unwrap(this.http.delete<ApiResponse<StoryRun>>(`${this.run(id)}/scenes/${scene}/image`));
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

  /** A scene's narration, through HttpClient like a picture, so it carries the caller's identity. */
  sceneAudio(id: string, scene: number): Observable<Blob> {
    return this.http.get(`${this.run(id)}/scenes/${scene}/audio`, { responseType: 'blob' });
  }

  musicFile(id: string): Observable<Blob> {
    return this.http.get(`${this.run(id)}/music`, { responseType: 'blob' });
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
