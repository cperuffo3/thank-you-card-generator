/**
 * Settings encryption/decryption utility
 * Uses AES-GCM for symmetric encryption with a hardcoded key
 */

// Hardcoded encryption key (32 bytes for AES-256)
// This provides basic obfuscation for shared settings files
const ENCRYPTION_KEY = "WeddingThankYou2024SecureKey!@#$";
const SETTINGS_FILE_VERSION = 1;

export interface ExportedSettings {
  version: number;
  openRouterApiKey: string;
  model: string;
  googleMapsApiKey: string;
  systemPrompt: string;
  userPromptTemplate: string;
  exportedAt: string;
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Get crypto key from hardcoded string
async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = stringToArrayBuffer(ENCRYPTION_KEY);
  return crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypt settings object to a base64 string
 */
export async function encryptSettings(
  settings: ExportedSettings
): Promise<string> {
  const key = await getCryptoKey();
  const plaintext = JSON.stringify(settings);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    stringToArrayBuffer(plaintext)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt base64 string back to settings object
 */
export async function decryptSettings(
  encryptedBase64: string
): Promise<ExportedSettings> {
  const key = await getCryptoKey();
  const combined = new Uint8Array(base64ToArrayBuffer(encryptedBase64));

  // Extract IV (first 12 bytes) and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  const plaintext = arrayBufferToString(decrypted);
  const settings = JSON.parse(plaintext) as ExportedSettings;

  // Validate version
  if (settings.version !== SETTINGS_FILE_VERSION) {
    throw new Error(
      `Unsupported settings file version: ${settings.version}. Expected: ${SETTINGS_FILE_VERSION}`
    );
  }

  return settings;
}

/**
 * Create settings export object from current session values
 */
export function createExportSettings(data: {
  openRouterApiKey: string;
  model: string;
  googleMapsApiKey: string;
  systemPrompt: string;
  userPromptTemplate: string;
}): ExportedSettings {
  return {
    version: SETTINGS_FILE_VERSION,
    openRouterApiKey: data.openRouterApiKey,
    model: data.model,
    googleMapsApiKey: data.googleMapsApiKey,
    systemPrompt: data.systemPrompt,
    userPromptTemplate: data.userPromptTemplate,
    exportedAt: new Date().toISOString(),
  };
}
