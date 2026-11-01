import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  AdminMember, AdminSignupItem, AdminSignupSummary, SignupReceipt, SignupRequestPayload,
} from '../models/signup.models';

/**
 * Asking for access, and deciding on those requests.
 *
 * The public calls (`status`, `request`) need no sign-in. Everything under `admin` is behind the
 * administrator policy on the server, which also decides - not this class - which requests and
 * accounts an administrator may touch here.
 */
@Injectable({ providedIn: 'root' })
export class SignupService {
  private readonly http = inject(HttpClient);
  private readonly pub = `${environment.apiUrl}/api/auth/signup`;
  private readonly admin = `${environment.apiUrl}/api/admin`;

  // --- the public form

  /** Whether the dialog should offer "Request access". */
  status(): Observable<boolean> {
    return this.http.get<ApiResponse<{ open: boolean }>>(`${this.pub}/status`).pipe(map((r) => r.data?.open ?? false));
  }

  request(payload: SignupRequestPayload): Observable<SignupReceipt> {
    return this.http.post<ApiResponse<SignupReceipt>>(this.pub, payload).pipe(map((r) => r.data as SignupReceipt));
  }

  // --- administrators

  list(status: 'pending' | 'approved' | 'rejected' | 'all' = 'all'): Observable<AdminSignupItem[]> {
    return this.http
      .get<ApiResponse<AdminSignupItem[]>>(`${this.admin}/signups`, { params: { status } })
      .pipe(map((r) => r.data ?? []));
  }

  summary(): Observable<AdminSignupSummary> {
    return this.http.get<ApiResponse<AdminSignupSummary>>(`${this.admin}/signups/summary`).pipe(map((r) => r.data as AdminSignupSummary));
  }

  approve(id: string, note?: string): Observable<AdminSignupItem> {
    return this.http
      .post<ApiResponse<AdminSignupItem>>(`${this.admin}/signups/${encodeURIComponent(id)}/approve`, { note: note || null })
      .pipe(map((r) => r.data as AdminSignupItem));
  }

  reject(id: string, note?: string): Observable<AdminSignupItem> {
    return this.http
      .post<ApiResponse<AdminSignupItem>>(`${this.admin}/signups/${encodeURIComponent(id)}/reject`, { note: note || null })
      .pipe(map((r) => r.data as AdminSignupItem));
  }

  isOpen(): Observable<boolean> {
    return this.http.get<ApiResponse<{ enabled: boolean }>>(`${this.admin}/signups/settings`).pipe(map((r) => r.data?.enabled ?? false));
  }

  setOpen(enabled: boolean): Observable<boolean> {
    return this.http
      .put<ApiResponse<{ enabled: boolean }>>(`${this.admin}/signups/settings`, { enabled })
      .pipe(map((r) => r.data?.enabled ?? enabled));
  }

  members(): Observable<AdminMember[]> {
    return this.http.get<ApiResponse<AdminMember[]>>(`${this.admin}/members`).pipe(map((r) => r.data ?? []));
  }

  setMemberActive(id: string, active: boolean): Observable<AdminMember> {
    return this.http
      .put<ApiResponse<AdminMember>>(`${this.admin}/members/${encodeURIComponent(id)}/active`, { active })
      .pipe(map((r) => r.data as AdminMember));
  }
}
