import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ServerLogEntry, ServerLogFileItem } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

@Component({
  selector: 'app-logs',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './app-logs.component.html',
  styles: [`
    .filter-chip {
      padding: 0.34rem 0.72rem;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      border-radius: 99px;
      background: var(--surface-2);
      color: var(--muted);
      border: 1px solid var(--border);
      box-shadow: none;
      transition: all 0.15s ease;
    }
    .filter-chip:hover:not(:disabled) {
      color: var(--text);
      border-color: var(--border-bright);
      background: var(--surface-3);
      transform: none;
      box-shadow: none;
    }
    .filter-chip.active {
      background: rgba(108, 140, 255, 0.16);
      color: var(--brand-bright);
      border-color: var(--brand);
      box-shadow: 0 0 12px rgba(108, 140, 255, 0.2);
    }
    .filter-chip[data-level="ERROR"].active {
      background: var(--err-dim);
      color: var(--err);
      border-color: color-mix(in oklab, var(--err) 55%, transparent);
      box-shadow: 0 0 12px rgba(244, 67, 80, 0.2);
    }
    .filter-chip[data-level="WARN"].active {
      background: var(--warn-dim);
      color: var(--warn);
      border-color: color-mix(in oklab, var(--warn) 55%, transparent);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
    }
    .filter-chip[data-level="INFO"].active {
      background: var(--ok-dim);
      color: var(--ok);
      border-color: color-mix(in oklab, var(--ok) 55%, transparent);
      box-shadow: 0 0 12px rgba(34, 211, 107, 0.2);
    }
    .logs-console-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      background: color-mix(in srgb, var(--surface-2) 85%, #000);
      border-bottom: 1px solid var(--border);
      font-size: 0.78rem;
    }
    .logs-dots {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .logs-dots i {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
      opacity: 0.75;
    }
  `],
})
export class AppLogsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly status = inject(StatusService);

  readonly activeTab = signal<'server' | 'client'>('server');

  // Server log state
  readonly loadingServer = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly files = signal<ServerLogFileItem[]>([]);
  readonly selectedFile = signal<string>('');
  readonly levelFilter = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly maxLines = signal<number>(250);
  readonly serverEntries = signal<ServerLogEntry[]>([]);

  readonly filteredClientLogs = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.status.logEntries();
    if (!q) return list;
    return list.filter((item) => item.message.toLowerCase().includes(q));
  });

  readonly serverStats = computed(() => {
    const entries = this.serverEntries();
    let errors = 0;
    let warnings = 0;
    let info = 0;
    for (const e of entries) {
      if (e.level === 'ERROR') errors++;
      else if (e.level === 'WARN') warnings++;
      else info++;
    }
    return { total: entries.length, errors, warnings, info };
  });

  ngOnInit(): void {
    this.loadServerLogs();
  }

  loadServerLogs(): void {
    this.loadingServer.set(true);
    this.serverError.set(null);

    const lvl = this.levelFilter() === 'ALL' ? undefined : this.levelFilter();
    const q = this.searchQuery().trim() || undefined;
    const file = this.selectedFile() || undefined;

    this.api
      .serverLogs({
        file,
        level: lvl,
        search: q,
        lines: this.maxLines(),
      })
      .subscribe({
        next: (res) => {
          this.loadingServer.set(false);
          this.files.set(res.files);
          if (res.activeFile && !this.selectedFile()) {
            this.selectedFile.set(res.activeFile);
          }
          this.serverEntries.set(res.entries);
        },
        error: (err) => {
          this.loadingServer.set(false);
          this.serverError.set(
            err?.error?.message ?? 'Could not load server rolling logs.'
          );
        },
      });
  }

  selectLevel(level: string): void {
    this.levelFilter.set(level);
    if (this.activeTab() === 'server') {
      this.loadServerLogs();
    }
  }

  onFileChange(fileName: string): void {
    this.selectedFile.set(fileName);
    this.loadServerLogs();
  }

  exportLogs(): void {
    if (this.activeTab() === 'server') {
      const lines = this.serverEntries().map(
        (e) => `${e.timestamp}\t[${e.level}]\t${e.category}\t${e.message}`
      );
      this.downloadText(
        lines.join('\n'),
        `animstudio-server-logs-${new Date().toISOString().slice(0, 10)}.log`
      );
    } else {
      const lines = this.filteredClientLogs().map(
        (e) => `${e.timestamp.toISOString()}\t${e.message}`
      );
      this.downloadText(
        lines.join('\n'),
        `animstudio-client-logs-${new Date().toISOString().slice(0, 10)}.log`
      );
    }
  }

  private downloadText(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
