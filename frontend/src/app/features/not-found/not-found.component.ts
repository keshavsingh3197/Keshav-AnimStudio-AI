import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="nf-container">
      <div class="nf-card">
        <div class="nf-badge">
          <span>404</span>
          <span class="sep">&bull;</span>
          <span>Not Found</span>
        </div>

        <div class="nf-icon-wrap" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 class="nf-title">Page Not Found</h1>
        <p class="nf-desc">
          The page you requested does not exist, has been moved, or requires authorization to view.
        </p>

        <div class="nf-actions">
          <a routerLink="/projects" class="btn btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>Back to Projects</span>
          </a>

          @if (!auth.isAuthenticated()) {
            <button type="button" class="btn btn-secondary" (click)="auth.openAuthModal()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>Sign In</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nf-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 12rem);
      padding: 2rem 1.5rem;
      box-sizing: border-box;
    }

    .nf-card {
      background: linear-gradient(180deg, rgba(20, 26, 42, 0.9) 0%, rgba(13, 17, 28, 0.95) 100%);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 16px;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .nf-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #93c5fd;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.28);
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 1.5rem;
    }

    .nf-badge .sep {
      color: rgba(147, 197, 253, 0.5);
    }

    .nf-icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.02) 70%);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      margin-bottom: 1.5rem;
      box-shadow: 0 0 24px rgba(99, 102, 241, 0.15);
    }

    .nf-title {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin: 0 0 0.65rem;
      color: #f1f5f9;
    }

    .nf-desc {
      font-size: 0.92rem;
      line-height: 1.55;
      color: #94a3b8;
      margin: 0 0 2rem;
    }

    .nf-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      flex-wrap: wrap;
      width: 100%;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0.65rem 1.25rem;
      border-radius: 9px;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.16s ease;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: #4f46e5;
      color: #fff;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    }
    .btn-primary:hover {
      background: #4338ca;
      box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
  `],
})
export class NotFoundComponent {
  readonly auth = inject(AuthService);
}

