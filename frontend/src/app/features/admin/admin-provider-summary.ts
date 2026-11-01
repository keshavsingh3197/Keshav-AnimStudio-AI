import { AdminProvider, AdminProviders } from '../../core/models/api.models';

export const CAPABILITIES = ['Text', 'Image', 'Speech', 'Transcription'] as const;

export type Tone = 'ok' | 'warn' | 'err' | '';

export interface CapabilitySummary {
  capability: string;
  tone: Tone;
  headline: string;
  detail: string;
}

export function capabilityLabel(capability: string): string {
  switch (capability) {
    case 'Text': return 'Writing';
    case 'Image': return 'Pictures';
    case 'Speech': return 'Voices';
    case 'Transcription': return 'Listening';
    default: return capability;
  }
}

/** Can the studio do this kind of work right now, and through which provider? */
export function summariseCapability(data: AdminProviders, capability: string): CapabilitySummary {
  const chain = data.chains.find((c) => c.capability === capability);
  const label = capabilityLabel(capability).toLowerCase();

  if (!chain || chain.providerIds.length === 0) {
    return { capability, tone: '', headline: 'Off', detail: 'Nothing is listed, so this is switched off entirely.' };
  }

  const members = chain.providerIds
    .map((id) => data.providers.find((p) => p.id === id))
    .filter((p): p is AdminProvider => !!p);
  const index = members.findIndex((p) => p.enabled && p.ready);

  if (index < 0) {
    return { capability, tone: 'err', headline: 'Nothing ready', detail: `No provider in the ${label} order can answer right now.` };
  }
  if (index === 0) {
    return {
      capability, tone: 'ok', headline: members[0].displayName,
      detail: members.length > 1 ? `first of ${members.length}, others stand by` : 'the only one listed',
    };
  }
  return {
    capability, tone: 'warn', headline: members[index].displayName,
    detail: `${index} earlier ${index === 1 ? 'one is' : 'ones are'} being skipped`,
  };
}
