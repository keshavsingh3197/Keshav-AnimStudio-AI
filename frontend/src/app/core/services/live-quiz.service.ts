import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { silentHttpContext } from '../interceptors/loading.interceptor';
import { ApiResponse } from '../models/api.models';

export interface LiveQuizOption {
  key: 'A' | 'B' | 'C' | 'D' | string;
  text: string;
  textHi?: string | null;
}

export interface LiveQuizWinnerSummary {
  winnerId: string;
  winnerChannelId: string;
  winnerChannelTitle: string;
  winnerChannelHandle?: string | null;
  winnerThumbnailUrl?: string | null;
  source: string;
  prizeTitle: string;
  totalEntrants: number;
  eligibleEntrants: number;
  drawAlgorithm: string;
  selectedAtUtc: string;
}

export interface LiveQuizEntrantPreview {
  channelTitle: string;
  channelHandle?: string | null;
  thumbnailUrl?: string | null;
  answerOption: string;
  source: string;
  isCorrect: boolean;
  submittedAtUtc: string;
}

export interface LiveQuizPublicView {
  id: string;
  streamTitle: string;
  streamChannelHandle: string;
  broadcastId?: string | null;
  question: string;
  questionHi?: string | null;
  options: LiveQuizOption[];
  revealedCorrectOptionKey?: string | null;
  prizeTitle: string;
  language: 'hi' | 'en' | string;
  status: 'Open' | 'Closed' | 'Drawn' | string;
  totalEntrants: number;
  eligibleEntrants: number;
  chatEntrantCount: number;
  webEntrantCount: number;
  createdAtUtc: string;
  closedAtUtc?: string | null;
  drawnAtUtc?: string | null;
  winner?: LiveQuizWinnerSummary | null;
  recentEntrants: LiveQuizEntrantPreview[];
}

export interface LiveQuizChatPollResult {
  session: LiveQuizPublicView;
  messagesScanned: number;
  newEntriesAdded: number;
  pollingIntervalMillis: number;
}

export interface PlaybookSegment {
  order: number;
  timeRange: string;
  durationMinutes: number;
  channel: string;
  title: string;
  titleHi: string;
  actionCue: string;
  actionCueHi: string;
  triggersQuizRound: boolean;
}

export interface StarterQuizQuestion {
  id: string;
  question: string;
  questionHi: string;
  options: LiveQuizOption[];
  correctOptionKey: string;
  prizeTitle: string;
}

export interface FirstLivePlaybook {
  planTitle: string;
  planTitleHi: string;
  totalMinutes: number;
  suggestedBroadcastTitle: string;
  suggestedBroadcastTitleHi: string;
  suggestedDescription: string;
  suggestedTags: string[];
  pratiyogitaWinnersUrl: string;
  segments: PlaybookSegment[];
  starterQuestions: StarterQuizQuestion[];
  preFlightChecklist: string[];
}

export interface CreateLiveQuizRequest {
  question: string;
  questionHi?: string | null;
  options: LiveQuizOption[];
  correctOptionKey: string;
  prizeTitle?: string;
  streamTitle?: string;
  streamChannelHandle?: string;
  broadcastId?: string | null;
  youTubeConnectionChannelId?: string | null;
  language?: string;
  closePreviousOpen?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LiveQuizService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/live-quiz`;

  getPlaybook(): Observable<FirstLivePlaybook> {
    return this.http.get<ApiResponse<FirstLivePlaybook>>(`${this.base}/playbook`).pipe(map((r) => r.data!));
  }

  getActive(sessionId?: string | null, silent = true): Observable<LiveQuizPublicView | null> {
    const context: HttpContext | undefined = silent ? silentHttpContext() : undefined;
    const url = sessionId ? `${this.base}/active?sessionId=${encodeURIComponent(sessionId)}` : `${this.base}/active`;
    return this.http.get<ApiResponse<LiveQuizPublicView | null>>(url, { context }).pipe(map((r) => r.data ?? null));
  }

  listSessions(): Observable<LiveQuizPublicView[]> {
    return this.http.get<ApiResponse<LiveQuizPublicView[]>>(this.base).pipe(map((r) => r.data ?? []));
  }

  create(req: CreateLiveQuizRequest): Observable<LiveQuizPublicView> {
    return this.http.post<ApiResponse<LiveQuizPublicView>>(this.base, req).pipe(map((r) => r.data!));
  }

  pollChat(id: string, broadcastId?: string | null, youTubeChannelId?: string | null): Observable<LiveQuizChatPollResult> {
    return this.http
      .post<ApiResponse<LiveQuizChatPollResult>>(`${this.base}/${encodeURIComponent(id)}/poll-chat`, {
        broadcastId,
        youTubeChannelId,
      })
      .pipe(map((r) => r.data!));
  }

  addRehearsalEntrant(
    id: string,
    payload: { channelTitle: string; channelHandle?: string; youTubeChannelId?: string; answerOption: string }
  ): Observable<LiveQuizPublicView> {
    return this.http
      .post<ApiResponse<LiveQuizPublicView>>(`${this.base}/${encodeURIComponent(id)}/entrants`, {
        ...payload,
        source: 'rehearsal',
      })
      .pipe(map((r) => r.data!));
  }

  close(id: string): Observable<LiveQuizPublicView> {
    return this.http
      .post<ApiResponse<LiveQuizPublicView>>(`${this.base}/${encodeURIComponent(id)}/close`, {})
      .pipe(map((r) => r.data!));
  }

  drawWinner(id: string): Observable<LiveQuizPublicView> {
    return this.http
      .post<ApiResponse<LiveQuizPublicView>>(`${this.base}/${encodeURIComponent(id)}/draw-winner`, {})
      .pipe(map((r) => r.data!));
  }
}
