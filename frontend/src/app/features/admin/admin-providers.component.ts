import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AdminChain, AdminProvider, AdminProviderBody, AdminProviders,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/** The editable copy of one provider, held while a card is open. */
interface Draft {
  enabled: boolean;
  model: string;
  baseUrl: string;
  dailyRequestLimit: number | null;
  monthlyRequestLimit: number | null;
  timeoutSeconds: number | null;
  key: string;
}

/**
 * Full control over the AI layer: which providers exist, whether each is on, what model and
 * address it uses, what it is allowed to spend, in what order they are tried, and whether
 * each one actually answers.
 *
 * Two things this screen will not do. It never shows a key - one can be installed, rotated
 * or removed, and what comes back is a mask. And it never edits an executable path or a
 * model folder for a provider that runs as a program here: those are shown, and changing
 * them needs access to the machine, because a web request that could set the program to run
 * is a web request that could run any program.
 */
@Component({
  selector: 'app-admin-providers',
  imports: [FormsModule],
  templateUrl: './admin-providers.component.html',
})
export class AdminProvidersComponent {
  private readonly api = inject(ApiService);

  readonly status = inject(StatusService);
  readonly data = signal<AdminProviders | null>(null);

  /** The provider whose card is expanded. One at a time keeps the page scannable. */
  readonly open = signal<string | null>(null);
  readonly draft = signal<Draft | null>(null);

  /** Provider id to the result of its last connection test. */
  readonly tested = signal<Record<string, string>>({});

  readonly capabilities = ['Text', 'Image', 'Speech', 'Transcription'];

  readonly anyReady = computed(() => (this.data()?.providers ?? []).some((p) => p.ready));

  constructor() {
    this.reload();
  }

  reload(): void {
    this.status.run(this.api.adminProviders(), (data) => this.data.set(data));
  }

  // --- grouping

  forCapability(capability: string): AdminProvider[] {
    return (this.data()?.providers ?? []).filter((p) => p.capability === capability);
  }

  chain(capability: string): AdminChain | undefined {
    return this.data()?.chains.find((c) => c.capability === capability);
  }

  /** Providers that could be added to a chain but are not in it yet. */
  spare(capability: string): string[] {
    const chain = this.chain(capability);
    return chain ? chain.candidates.filter((id) => !chain.providerIds.includes(id)) : [];
  }

  // --- one card

  toggleOpen(provider: AdminProvider): void {
    if (this.open() === provider.id) {
      this.open.set(null);
      this.draft.set(null);
      return;
    }

    this.open.set(provider.id);
    this.draft.set({
      enabled: provider.enabled,
      model: provider.model ?? '',
      baseUrl: provider.baseUrl ?? '',
      dailyRequestLimit: provider.dailyRequestLimit,
      monthlyRequestLimit: provider.monthlyRequestLimit,
      timeoutSeconds: provider.timeoutSeconds,
      key: '',
    });
  }

  /**
   * The switch saves on its own rather than waiting for the form, because turning a
   * provider off is the one action someone reaches for in a hurry.
   */
  toggleEnabled(provider: AdminProvider): void {
    this.save(provider, { ...this.bodyFrom(provider), enabled: !provider.enabled });
  }

  saveDraft(provider: AdminProvider): void {
    const draft = this.draft();
    if (!draft) return;

    this.save(provider, {
      enabled: draft.enabled,
      model: draft.model.trim() || null,
      baseUrl: draft.baseUrl.trim() || null,
      dailyRequestLimit: draft.dailyRequestLimit,
      monthlyRequestLimit: draft.monthlyRequestLimit,
      timeoutSeconds: draft.timeoutSeconds,
      supportsJsonMode: null,
    });
  }

  reset(provider: AdminProvider): void {
    this.status.run(this.api.resetProvider(provider.id), (data) => {
      this.data.set(data);
      this.open.set(null);
      this.draft.set(null);
    });
  }

  // --- keys

  saveKey(provider: AdminProvider): void {
    const key = this.draft()?.key.trim();
    if (!key) return;

    this.status.run(this.api.setProviderKey(provider.id, key), (data) => {
      this.data.set(data);
      // Cleared from memory the moment it has been sent. It is never coming back from the
      // server, and there is no reason for it to sit in a component.
      this.draft.update((current) => (current ? { ...current, key: '' } : current));
      this.status.notify([`Key saved for ${provider.displayName}. Test it to be sure.`]);
    });
  }

  removeKey(provider: AdminProvider): void {
    this.status.run(this.api.deleteProviderKey(provider.id), (data) => this.data.set(data));
  }

  test(provider: AdminProvider): void {
    this.status.run(this.api.testProvider(provider.id), (result) => {
      this.tested.update((all) => ({
        ...all,
        [provider.id]: result.healthy
          ? 'Answered. This one is working.'
          : result.reason ?? 'No answer.',
      }));
    });
  }

  // --- fallback order

  moveUp(capability: string, index: number): void {
    const order = [...(this.chain(capability)?.providerIds ?? [])];
    if (index <= 0) return;

    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    this.saveChain(capability, order);
  }

  moveDown(capability: string, index: number): void {
    const order = [...(this.chain(capability)?.providerIds ?? [])];
    if (index >= order.length - 1) return;

    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    this.saveChain(capability, order);
  }

  removeFromChain(capability: string, providerId: string): void {
    const order = (this.chain(capability)?.providerIds ?? []).filter((id) => id !== providerId);
    this.saveChain(capability, order);
  }

  addToChain(capability: string, providerId: string): void {
    if (!providerId) return;
    this.saveChain(capability, [...(this.chain(capability)?.providerIds ?? []), providerId]);
  }

  resetChain(capability: string): void {
    this.saveChain(capability, []);
  }

  // --- wording

  label(capability: string): string {
    switch (capability) {
      case 'Text': return 'Writing';
      case 'Image': return 'Pictures';
      case 'Speech': return 'Voices';
      case 'Transcription': return 'Listening';
      default: return capability;
    }
  }

  describe(capability: string): string {
    switch (capability) {
      case 'Text':
        return 'Inventing characters, scene descriptions and titles from a transcript.';
      case 'Image':
        return 'Drawing character sprites and scene backgrounds.';
      case 'Speech':
        return 'Reading dialogue aloud, one call per line.';
      case 'Transcription':
        return 'Turning audio into a transcript when a video has no captions.';
      default: return '';
    }
  }

  state(provider: AdminProvider): 'ok' | 'warn' | 'err' | '' {
    if (provider.ready) return 'ok';

    switch (provider.readyReason) {
      case 'Disabled': return '';
      case 'CircuitOpen': return 'err';
      default: return 'warn';
    }
  }

  /** The server's reason code turned into something worth acting on. */
  explain(provider: AdminProvider): string {
    if (provider.ready) {
      return provider.dailyRemaining === null
        ? 'Ready. No daily limit set.'
        : `Ready. ${provider.dailyRemaining} calls left today.`;
    }

    switch (provider.readyReason) {
      case 'Disabled':
        return 'Switched off.';
      case 'NotConfigured':
        return provider.needsExecutable
          ? 'Needs the program’s path setting in the server’s configuration file.'
          : provider.requiresApiKey
            ? 'Needs an API key.'
            : 'Needs an address.';
      case 'QuotaExhausted':
        return 'Today’s allowance is used up. It resets tomorrow.';
      case 'CircuitOpen':
        return 'Recent calls kept failing, so it is being skipped for a few minutes.';
      default:
        return provider.readyReason;
    }
  }

  private bodyFrom(provider: AdminProvider): AdminProviderBody {
    return {
      enabled: provider.enabled,
      model: provider.model,
      baseUrl: provider.baseUrl,
      dailyRequestLimit: provider.dailyRequestLimit,
      monthlyRequestLimit: provider.monthlyRequestLimit,
      timeoutSeconds: provider.timeoutSeconds,
      supportsJsonMode: null,
    };
  }

  private save(provider: AdminProvider, body: AdminProviderBody): void {
    this.status.run(this.api.saveProvider(provider.id, body), (data) => this.data.set(data));
  }

  private saveChain(capability: string, providerIds: string[]): void {
    this.status.run(this.api.saveChain(capability, providerIds), (data) => this.data.set(data));
  }
}
