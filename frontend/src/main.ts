import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection,
} from '@angular/core';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiErrorInterceptor } from './app/core/interceptors/api-error.interceptor';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { MediaTicketService } from './app/core/services/media-ticket.service';
import { ProjectRouteReuseStrategy } from './app/core/services/project-route-reuse.strategy';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, apiErrorInterceptor])),
    // Route parameters arrive as component inputs, so a screen declares what it needs.
    provideRouter(routes, withComponentInputBinding()),
    // A different project is a different screen: nothing per-project survives the switch.
    { provide: RouteReuseStrategy, useClass: ProjectRouteReuseStrategy },
    // Media elements cannot send the bearer header, so their URLs carry a media ticket.
    // Fetched before the first screen renders (capped, so a slow API never blocks start-up).
    provideAppInitializer(() => {
      const ticket = firstValueFrom(inject(MediaTicketService).ensure());
      return Promise.race([ticket, new Promise((resolve) => setTimeout(resolve, 4000))]).then(() => undefined);
    }),
  ],
}).catch((err) => console.error(err));
