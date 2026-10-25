/**
 * WebAuthn browser helpers for passkey ceremonies.
 *
 * The FIDO2 server speaks JSON in which every binary field — the challenge,
 * credential ids and the authenticator's response buffers — is base64url. The browser's
 * `navigator.credentials` API speaks ArrayBuffers instead. These helpers translate between the
 * two, with zero third-party dependencies.
 */

function base64urlToBuffer(value: string): ArrayBuffer {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface ServerCredentialOptions {
  challenge: string;
  user?: { id: string; name: string; displayName: string };
  allowCredentials?: Array<{ type: string; id: string; transports?: string[] }>;
  excludeCredentials?: Array<{ type: string; id: string; transports?: string[] }>;
  [key: string]: unknown;
}

/** True when the browser supports WebAuthn / Passkeys. */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    !!navigator.credentials
  );
}

function mapDescriptors(
  list?: Array<{ type: string; id: string; transports?: string[] }>
): PublicKeyCredentialDescriptor[] | undefined {
  return list?.map((d) => ({
    type: d.type as PublicKeyCredentialType,
    id: base64urlToBuffer(d.id),
    transports: d.transports as AuthenticatorTransport[] | undefined,
  }));
}

/** Runs an assertion (sign-in) ceremony and returns the JSON body the server expects. */
export async function getPasskeyAssertion(options: ServerCredentialOptions): Promise<unknown> {
  const publicKey: PublicKeyCredentialRequestOptions = {
    ...(options as unknown as PublicKeyCredentialRequestOptions),
    challenge: base64urlToBuffer(options.challenge),
    allowCredentials: mapDescriptors(options.allowCredentials),
  };

  const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  if (!credential) throw new Error('Passkey sign-in was cancelled.');
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

/** Turns a WebAuthn ceremony failure into a short, user-safe message. */
export function createPasskeyErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'AbortError') return 'Passkey prompt was dismissed.';
    if (err.name === 'InvalidStateError') return 'This device already has a passkey for your account.';
    if (err.name === 'SecurityError') return 'Passkeys are not available on this page’s address.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

