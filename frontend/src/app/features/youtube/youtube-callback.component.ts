import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { YouTubePublishService } from '../../core/services/youtube-publish.service';

/**
 * Where Google sends the browser after the user picks and approves a channel. Hands the
 * one-time code to the API (as an ordinary authenticated call), then goes back to the page
 * the connect started from - which reopens the publish dialog.
 */
@Component({
  selector: 'app-youtube-callback',
  imports: [RouterLink],
  template: `
    <div class="card" style="max-width: 560px; margin: 3rem auto; text-align: center">
      @if (error(); as e) {
        <h3>Couldn't connect {{ what() }}</h3>
        <p class="muted">{{ e }}</p>
        <a routerLink="/projects"><button type="button" class="secondary">Back to projects</button></a>
      } @else if (connected(); as name) {
        <h3>✓ Connected {{ name }}</h3>
        <p class="muted">Taking you back…</p>
      } @else {
        <h3>Connecting {{ what() }}…</h3>
      }
    </div>
  `,
})
export class YouTubeCallbackComponent implements OnInit {
  private readonly api = inject(YouTubePublishService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly connected = signal<string | null>(null);
  /** What is being connected, for the headings. */
  readonly what = signal('your YouTube channel');

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    const state = params.get('state');
    const googleError = params.get('error');
    if (state?.startsWith('drive.')) this.what.set('Google Drive');

    // The code is single-use; drop it from the address bar and history straight away.
    history.replaceState(history.state, '', '/youtube/callback');

    if (googleError) {
      this.error.set(googleError === 'access_denied'
        ? `Access was not granted. Connect again and allow AnimStudio to ${state?.startsWith('drive.') ? 'add files to Google Drive' : 'upload videos'}.`
        : 'Google did not complete the sign-in. Try connecting again.');
      return;
    }
    if (!code || !state) {
      this.error.set('This page needs to be opened by Google after signing in. Start from the Publish button.');
      return;
    }

    // The same Google return address serves both kinds of sign-in; the server marks Drive ones.
    if (state.startsWith('drive.')) {
      this.api.completeDriveConnect(code, state).subscribe({
        next: ({ drive, returnPath }) => {
          this.connected.set(drive.accountEmail ? `Google Drive (${drive.accountEmail})` : 'Google Drive');
          this.goBack(returnPath);
        },
        error: (e: Error) => this.error.set(e.message),
      });
      return;
    }

    this.api.completeConnect(code, state).subscribe({
      next: ({ connection, returnPath }) => {
        this.connected.set(connection.channelTitle);
        this.goBack(returnPath);
      },
      error: (e: Error) => this.error.set(e.message),
    });
  }

  private goBack(returnPath: string): void {
    // The API only returns in-app paths; navigateByUrl keeps it inside the router either way.
    void this.router.navigateByUrl(returnPath.startsWith('/') && !returnPath.startsWith('//') ? returnPath : '/');
  }
}
