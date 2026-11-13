import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EcosystemConfigService } from '../../core/services/ecosystem-config.service';
import { SocialIconComponent } from '../../shared/social-icon.component';
import { INFO_PAGE_STYLES } from './info-page.styles';

/** Where to reach the people behind the studio. Every channel here is a public profile. */
@Component({
  selector: 'app-contact',
  imports: [RouterLink, SocialIconComponent],
  template: `
    <article class="info-page">
      <header class="page-head">
        <div>
          <h1>Contact us</h1>
          <p class="muted">
            Questions, bug reports, feature ideas or collaboration - AnimStudio AI is built and run by
            {{ creator().name }}. Pick whichever channel suits you.
          </p>
        </div>
      </header>

      <div class="contact-grid">
        @for (link of links(); track link.key) {
          <a class="card contact-card" [href]="link.url" target="_blank" rel="noopener noreferrer">
            <span class="contact-icon"><app-social-icon [id]="link.id" [size]="20" /></span>
            <span class="contact-body">
              <strong>{{ link.label }}</strong>
              <span class="contact-handle">{{ link.handle }}</span>
              <span class="contact-desc">{{ link.description }}</span>
            </span>
          </a>
        }
      </div>

      <section class="card">
        <h2>Reporting a problem</h2>
        <p>To help us fix it quickly, include:</p>
        <ul>
          <li>the page you were on and what you clicked;</li>
          <li>what you expected and what happened instead;</li>
          <li>your browser and device.</li>
        </ul>
        <p>Please don't send passwords, access tokens or anyone's personal data - we will never ask for them.</p>
      </section>

      <nav class="info-related" aria-label="Related pages">
        <a routerLink="/terms">Terms &amp; Conditions</a>
        <a routerLink="/privacy">Privacy Policy</a>
        <a routerLink="/projects">Back to the studio</a>
      </nav>
    </article>
  `,
  styles: [INFO_PAGE_STYLES, `
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: .9rem;
      margin-bottom: 1.1rem;
    }

    .contact-card {
      display: flex;
      gap: .85rem;
      align-items: flex-start;
      margin-bottom: 0;
      text-decoration: none;
      color: var(--text);
      transition: border-color .15s ease, transform .15s ease;
    }

    .contact-card:hover {
      border-color: color-mix(in srgb, var(--brand) 55%, var(--border));
      transform: translateY(-1px);
    }

    .contact-icon {
      display: inline-flex;
      padding: .55rem;
      border-radius: 10px;
      background: rgba(108, 140, 255, 0.12);
      color: var(--brand-bright);
    }

    .contact-body {
      display: flex;
      flex-direction: column;
      gap: .15rem;
      min-width: 0;
    }

    .contact-handle {
      color: var(--brand-bright);
      font-size: .82rem;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .contact-desc {
      color: var(--muted);
      font-size: .82rem;
      line-height: 1.5;
    }
  `],
})
export class ContactComponent {
  readonly ecosystem = inject(EcosystemConfigService);
  private readonly _eco = (() => { this.ecosystem.ensureLoaded(); return true; })();
  readonly creator = computed(() => ({
    name: this.ecosystem.creatorName() || 'Studio Team',
    role: 'Creator & lead contributor',
    portfolioUrl: this.ecosystem.creatorPortfolioUrl(),
  }));
  readonly links = computed(() => {
    const items = this.ecosystem.socialLinks().map((s) => ({
      key: s.key || s.url,
      id: s.platform.toLowerCase(),
      label: s.platform === 'YouTube' ? s.name : s.platform,
      handle: s.handle || s.url,
      url: s.url,
      description: s.description || s.platform,
    }));
    const portfolioUrl = this.ecosystem.creatorPortfolioUrl();
    if (portfolioUrl && !items.some((i) => i.url === portfolioUrl)) {
      items.unshift({
        key: 'portfolio',
        id: 'portfolio',
        label: 'Portfolio',
        handle: portfolioUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
        url: portfolioUrl,
        description: 'Projects, background and direct links across the ecosystem.',
      });
    }
    return items;
  });
}
