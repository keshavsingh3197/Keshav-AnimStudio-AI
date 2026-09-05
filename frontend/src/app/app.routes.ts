import { Routes } from '@angular/router';

import { ProjectStore } from './core/services/project-store';

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
    // Scoped here so the open project's state is created on entry and dropped on exit.
    providers: [ProjectStore],
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
        path: 'import',
        title: 'Import - AnimStudio AI',
        loadComponent: () =>
          import('./features/ingest/import.component').then((m) => m.ImportComponent),
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
    ],
  },

  { path: '**', redirectTo: 'projects' },
];
