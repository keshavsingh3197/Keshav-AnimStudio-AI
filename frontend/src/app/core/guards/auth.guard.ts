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
  const status = inject(StatusService);

  if (auth.isAuthenticated()) {
    return true;
  }

  auth.openAuthModal();
  status.showNotice('Please sign in to access this feature.');
  return false;
};

