/**
 * Unified .card file format encryption/decryption utility
 * Combines settings and session data into a single encrypted file
 * Uses AES-GCM for symmetric encryption
 */

import type { Session, Recipient } from "@/types/recipient";

// Hardcoded encryption key (32 bytes for AES-256)
// This provides basic obfuscation for shared card files
const ENCRYPTION_KEY = "WeddingThankYou2024SecureKey!@#$";
const CARD_FILE_VERSION = 1;
const CARD_FILE_MAGIC = "WTYC"; // Wedding Thank You Card

export interface CardFileData {
  version: number;
  magic: string;
  // Settings
  openRouterApiKey: string;
  model: string;
  googleMapsApiKey: string;
  systemPrompt: string;
  userPromptTemplate: string;
  // Session data
  recipients: Recipient[];
  // Metadata
  exportedAt: string;
  appVersion?: string;
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
 * Create card file data from current session and settings
 * @param includeRecipients - If false, recipients array will be empty (for settings-only export)
 */
export function createCardFileData(
  data: {
    // Settings
    openRouterApiKey: string;
    model: string;
    googleMapsApiKey: string;
    systemPrompt: string;
    userPromptTemplate: string;
    // Session (optional - for settings-only export)
    recipients?: Recipient[];
  },
  includeRecipients: boolean = true,
): CardFileData {
  return {
    version: CARD_FILE_VERSION,
    magic: CARD_FILE_MAGIC,
    openRouterApiKey: data.openRouterApiKey,
    model: data.model,
    googleMapsApiKey: data.googleMapsApiKey,
    systemPrompt: data.systemPrompt,
    userPromptTemplate: data.userPromptTemplate,
    recipients: includeRecipients ? data.recipients || [] : [],
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Check if card file contains recipients
 */
export function hasRecipients(data: CardFileData): boolean {
  return data.recipients && data.recipients.length > 0;
}

/**
 * Encrypt card file data to a base64 string
 */
export async function encryptCardFile(data: CardFileData): Promise<string> {
  const key = await getCryptoKey();
  const plaintext = JSON.stringify(data);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    stringToArrayBuffer(plaintext),
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt base64 string back to card file data
 */
export async function decryptCardFile(
  encryptedBase64: string,
): Promise<CardFileData> {
  const key = await getCryptoKey();
  const combined = new Uint8Array(base64ToArrayBuffer(encryptedBase64));

  // Extract IV (first 12 bytes) and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  );

  const plaintext = arrayBufferToString(decrypted);
  const data = JSON.parse(plaintext) as CardFileData;

  // Validate magic and version
  if (data.magic !== CARD_FILE_MAGIC) {
    throw new Error("Invalid card file format");
  }

  if (data.version !== CARD_FILE_VERSION) {
    throw new Error(
      `Unsupported card file version: ${data.version}. Expected: ${CARD_FILE_VERSION}`,
    );
  }

  return data;
}

/**
 * Extract settings from card file data
 */
export function extractSettings(data: CardFileData) {
  return {
    openRouterApiKey: data.openRouterApiKey,
    model: data.model,
    googleMapsApiKey: data.googleMapsApiKey,
    systemPrompt: data.systemPrompt,
    userPromptTemplate: data.userPromptTemplate,
  };
}

/**
 * Extract session from card file data
 */
export function extractSession(data: CardFileData): Omit<Session, "filePath"> {
  return {
    openRouterApiKey: data.openRouterApiKey,
    model: data.model,
    recipients: data.recipients,
  };
}
