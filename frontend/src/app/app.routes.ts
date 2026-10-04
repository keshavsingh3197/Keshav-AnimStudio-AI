import { Routes } from '@angular/router';

/**
 * Feature areas are lazy: the dashboard is the only thing most visits need, and the scene
 * editor is by far the largest screen.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'projects' },

  {
    path: 'projects',
    title: 'Projects - AnimStudio AI',
    loadComponent: () =>
      import('./features/projects/project-list.component').then((m) => m.ProjectListComponent),
  },

  {
    path: 'projects/:projectId',
    // ProjectStore is provided by ProjectEditorComponent, not here: a route-level injector
    // outlives navigation, so it kept the previous project's state alive into the next one.
    loadComponent: () =>
      import('./features/projects/project-editor.component').then((m) => m.ProjectEditorComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'scenes' },
      {
        path: 'scenes',
        title: 'Scenes - AnimStudio AI',
        loadComponent: () =>
          import('./features/scenes/scene-list.component').then((m) => m.SceneListComponent),
      },
      {
        path: 'scenes/:sceneId',
        title: 'Scene - AnimStudio AI',
        loadComponent: () =>
          import('./features/scenes/scene-editor.component').then((m) => m.SceneEditorComponent),
      },
      {
        path: 'characters',
        title: 'Characters - AnimStudio AI',
        loadComponent: () =>
          import('./features/characters/character-manager.component')
            .then((m) => m.CharacterManagerComponent),
      },
      {
        path: 'assets',
        title: 'Assets - AnimStudio AI',
        loadComponent: () =>
          import('./features/assets/asset-library.component').then((m) => m.AssetLibraryComponent),
      },
      {
        path: 'videos',
        title: 'Videos & Shorts - AnimStudio AI',
        loadComponent: () =>
          import('./features/videos/videos-page.component').then((m) => m.VideosPageComponent),
      },
      {
        path: 'clips',
        title: 'Video editor - AnimStudio AI',
        loadComponent: () =>
          import('./features/clips/clip-studio.component').then((m) => m.ClipStudioComponent),
      },
      {
        path: 'import',
        title: 'Import - AnimStudio AI',
        loadComponent: () =>
          import('./features/ingest/import.component').then((m) => m.ImportComponent),
      },
      {
        path: 'bundle',
        title: 'Bundle - AnimStudio AI',
        loadComponent: () =>
          import('./features/bundle/bundle-import.component')
            .then((m) => m.BundleImportComponent),
      },
      {
        path: 'render',
        title: 'Render - AnimStudio AI',
        loadComponent: () =>
          import('./features/rendering/render.component').then((m) => m.RenderComponent),
      },
      {
        path: 'settings',
        title: 'Settings - AnimStudio AI',
        loadComponent: () =>
          import('./features/settings/project-settings.component')
            .then((m) => m.ProjectSettingsComponent),
      },
      {
        path: 'media-tools',
        title: 'Media Tools & Chunker - AnimStudio AI',
        loadComponent: () =>
          import('./features/media-tools/media-tools.component')
            .then((m) => m.MediaToolsComponent),
      },
    ],
  },

  {
    path: 'tools',
    title: 'Media Tools & Chunker - AnimStudio AI',
    loadComponent: () =>
      import('./features/media-tools/media-tools.component')
        .then((m) => m.MediaToolsComponent),
  },

  {
    path: 'logs',
    title: 'Application Logs - AnimStudio AI',
    loadComponent: () =>
      import('./features/logs/app-logs.component').then((m) => m.AppLogsComponent),
  },

  {
    path: 'admin',
    title: 'Server settings - AnimStudio AI',
    loadComponent: () =>
      import('./features/admin/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'providers' },
      {
        path: 'providers',
        title: 'AI providers - AnimStudio AI',
        loadComponent: () =>
          import('./features/admin/admin-providers.component')
            .then((m) => m.AdminProvidersComponent),
      },
      {
        path: 'channels',
        title: 'Channels - AnimStudio AI',
        loadComponent: () =>
          import('./features/admin/admin-channels.component').then((m) => m.AdminChannelsComponent),
      },
      // One branding component, three pages: the route data says which section it shows.
      { path: 'branding', pathMatch: 'full', redirectTo: 'branding/watermark' },
      {
        path: 'branding/watermark',
        title: 'Watermark - AnimStudio AI',
        data: { section: 'watermark' },
        loadComponent: () =>
          import('./features/admin/admin-branding.component')
            .then((m) => m.AdminBrandingComponent),
      },
      {
        path: 'branding/end-card',
        title: 'End card - AnimStudio AI',
        data: { section: 'outro' },
        loadComponent: () =>
          import('./features/admin/admin-branding.component')
            .then((m) => m.AdminBrandingComponent),
      },
      {
        path: 'media/chunking',
        title: 'Video chunking - AnimStudio AI',
        data: { section: 'chunking' },
        loadComponent: () =>
          import('./features/admin/admin-branding.component')
            .then((m) => m.AdminBrandingComponent),
      },
      {
        path: 'storage',
        title: 'Storage - AnimStudio AI',
        loadComponent: () =>
          import('./features/admin/admin-storage.component').then((m) => m.AdminStorageComponent),
      },
      {
        path: 'usage',
        title: 'AI usage - AnimStudio AI',
        loadComponent: () =>
          import('./features/admin/admin-usage.component').then((m) => m.AdminUsageComponent),
      },
      {
        path: 'health',
        title: 'This machine - AnimStudio AI',
        loadComponent: () =>
          import('./features/admin/admin-health.component').then((m) => m.AdminHealthComponent),
      },
      {
        path: 'jobs',
        title: 'Renders - AnimStudio AI',
        loadComponent: () =>
          import('./features/admin/admin-jobs.component').then((m) => m.AdminJobsComponent),
      },
      {
        path: 'activity',
        title: 'Activity - AnimStudio AI',
        loadComponent: () =>
          import('./features/admin/admin-activity.component')
            .then((m) => m.AdminActivityComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'projects' },
];
