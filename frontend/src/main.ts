import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiErrorInterceptor } from './app/core/interceptors/api-error.interceptor';
import { ProjectRouteReuseStrategy } from './app/core/services/project-route-reuse.strategy';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([apiErrorInterceptor])),
    // Route parameters arrive as component inputs, so a screen declares what it needs.
    provideRouter(routes, withComponentInputBinding()),
    // A different project is a different screen: nothing per-project survives the switch.
    { provide: RouteReuseStrategy, useClass: ProjectRouteReuseStrategy },
  ],
}).catch((err) => console.error(err));
