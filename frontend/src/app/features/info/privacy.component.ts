import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EcosystemConfigService } from '../../core/services/ecosystem-config.service';
import { INFO_PAGE_STYLES } from './info-page.styles';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  template: `
    <article class="info-page">
      <header class="page-head">
        <div>
          <h1>Privacy Policy</h1>
          <p class="muted">What personal data AnimStudio AI keeps, why, and what you can do about it.</p>
          <span class="info-updated">Last updated {{ updated() }}</span>
        </div>
      </header>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details</strong> - your name, email and role from the central keshavsingh.in sign-in.</li>
          <li><strong>Your content</strong> - projects, scripts, media and renders you create or upload.</li>
          <li><strong>Connected accounts</strong> - the access YouTube grants when you link a channel.</li>
          <li><strong>Security records</strong> - sign-in attempts and admin actions, kept to protect the service.</li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>
          Only to run the studio: signing you in, storing and rendering your work, publishing where you ask,
          enforcing quotas and keeping the service secure. We do not sell personal data or use it for advertising.
        </p>
      </section>

      <section>
        <h2>Sessions and storage</h2>
        <p>
          Sign-in uses a secure, HttpOnly session cookie shared across keshavsingh.in apps; access tokens stay in
          memory and are not written to your browser storage. The studio stores small preferences, such as your
          theme, locally in your browser.
        </p>
      </section>

      <section>
        <h2>Third parties</h2>
        <p>
          Content you choose to process with AI providers or publish to YouTube is sent to those services and
          handled under their own privacy policies.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can delete your projects and media at any time, disconnect linked channels, or ask for your account
          and its data to be removed by <a routerLink="/contact">contacting {{ creator().name }}</a>.
        </p>
      </section>

      <nav class="info-related" aria-label="Related pages">
        <a routerLink="/terms">Terms &amp; Conditions</a>
        <a routerLink="/contact">Contact us</a>
        <a routerLink="/projects">Back to the studio</a>
      </nav>
    </article>
  `,
  styles: [INFO_PAGE_STYLES],
})
export class PrivacyComponent {
  readonly ecosystem = inject(EcosystemConfigService);
  private readonly _eco = (() => { this.ecosystem.ensureLoaded(); return true; })();
  readonly creator = computed(() => ({
    name: this.ecosystem.creatorName() || 'Studio Administrator',
    portfolioUrl: this.ecosystem.creatorPortfolioUrl(),
  }));
  readonly updated = computed(() => this.ecosystem.legalUpdatedDate() || new Date().toLocaleDateString());
}
