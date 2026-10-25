import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { StatusService } from '../services/status.service';

/**
 * Protects admin-only routes (e.g. /admin, /admin/settings, /admin/channels).
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const status = inject(StatusService);

  if (auth.isAdmin()) {
    return true;
  }

  status.showError('Access restricted: Administrator role required.');
  return router.parseUrl('/projects');
};

/**
 * Protects member-only features (e.g. YouTube publish, live broadcast, cloud save).
 * If the user is unauthenticated, prompts sign-in and stays on or redirects to projects.
 */
export const memberGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const status = inject(StatusService);

  if (auth.isAuthenticated()) {
    return true;
  }

  auth.openAuthModal();
  status.showNotice('Please sign in to access this feature.');
  return router.parseUrl('/projects');
};

/**
 * Protects sensitive cloud integration routes (e.g. YouTube hub, Music Release publishing, Go Live).
 * If the user is anonymous, alerts the user and redirects to /projects while prompting sign-in.
 */
export const sensitiveFeatureGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const status = inject(StatusService);

  if (auth.isAuthenticated()) {
    return true;
  }

  auth.openAuthModal();
  status.showNotice('Sensitive feature: YouTube and Google Drive integrations require signing in to AnimStudio.');
  return router.parseUrl('/projects');
};
