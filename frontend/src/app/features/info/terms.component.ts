import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CREATOR, LEGAL_UPDATED } from '../../core/site-links';
import { INFO_PAGE_STYLES } from './info-page.styles';

@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  template: `
    <article class="info-page">
      <header class="page-head">
        <div>
          <h1>Terms &amp; Conditions</h1>
          <p class="muted">The rules for using AnimStudio AI. By using the studio you agree to them.</p>
          <span class="info-updated">Last updated {{ updated }}</span>
        </div>
      </header>

      <section>
        <h2>1. The service</h2>
        <p>
          AnimStudio AI is a creative studio for scripting, animating, editing, publishing and streaming video,
          created and operated by {{ creator.name }}. Features may change, be limited or be withdrawn at any time,
          and guest access is subject to usage quotas.
        </p>
      </section>

      <section>
        <h2>2. Accounts</h2>
        <p>
          Accounts are issued through the central keshavsingh.in sign-in. You are responsible for activity on your
          account and for keeping your credentials private. We may suspend accounts that break these terms.
        </p>
      </section>

      <section>
        <h2>3. Your content</h2>
        <p>
          You keep ownership of the scripts, media and videos you create or upload. You give the studio the
          permission it needs to store, process and render that content for you, and to publish it to services
          such as YouTube when you ask it to.
        </p>
        <p>You confirm you have the rights to everything you upload, import or download through the studio.</p>
      </section>

      <section>
        <h2>4. Acceptable use</h2>
        <ul>
          <li>No unlawful, hateful, harassing or sexually explicit content involving minors.</li>
          <li>No content that infringes copyright, trademarks or anyone's privacy.</li>
          <li>No attempts to break, overload, scrape or bypass the security of the service.</li>
          <li>Follow the terms of any third-party platform you connect, including YouTube.</li>
        </ul>
      </section>

      <section>
        <h2>5. AI-generated output</h2>
        <p>
          Scripts, metadata, voices and visuals produced with AI may be inaccurate or resemble existing work.
          Review everything before you publish it - you are responsible for what you publish.
        </p>
      </section>

      <section>
        <h2>6. Third-party services</h2>
        <p>
          Connected services (for example YouTube and AI providers) are governed by their own terms. We are not
          responsible for their availability or decisions, such as a rejected upload.
        </p>
      </section>

      <section>
        <h2>7. No warranty and liability</h2>
        <p>
          The studio is provided "as is", without warranties of any kind. Keep your own copies of important
          work. To the extent the law allows, we are not liable for lost data, lost revenue or indirect damages.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          We may update these terms; the date above shows the latest version. Continuing to use the studio
          after a change means you accept it.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>Questions about these terms? <a routerLink="/contact">Contact us</a>.</p>
      </section>

      <nav class="info-related" aria-label="Related pages">
        <a routerLink="/privacy">Privacy Policy</a>
        <a routerLink="/contact">Contact us</a>
        <a routerLink="/projects">Back to the studio</a>
      </nav>
    </article>
  `,
  styles: [INFO_PAGE_STYLES],
})
export class TermsComponent {
  readonly creator = CREATOR;
  readonly updated = LEGAL_UPDATED;
}
