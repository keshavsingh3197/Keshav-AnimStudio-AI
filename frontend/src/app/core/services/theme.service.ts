import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type ThemeName = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'animstudio.theme';
const THEME_COLORS: Record<ThemeName, string> = { dark: '#07090e', light: '#f2f5fb' };

/**
 * The app theme. Dark is the default; the choice is remembered in this browser and kept in
 * step across open tabs. The colours themselves live in styles.css as tokens keyed on
 * `data-theme`, so applying a theme is just setting that attribute on <html>.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<ThemeName>(this.read());

  constructor() {
    effect(() => this.apply(this.theme()));

    this.document.defaultView?.addEventListener('storage', (event) => {
      if (event.key === THEME_STORAGE_KEY) this.theme.set(this.read());
    });
  }

  set(theme: ThemeName): void {
    this.theme.set(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Private mode or blocked storage: the theme still applies for this visit.
    }
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private read(): ThemeName {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }

  private apply(theme: ThemeName): void {
    const root = this.document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }
}
