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
