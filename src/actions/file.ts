import { ipc } from "@/ipc/manager";
import type { Session, Recipient } from "@/types/recipient";

export interface ColumnMapping {
  title: string;
  firstName: string;
  lastName: string;
  gift: string;
  giftValue?: string;
  partnerTitle?: string;
  partnerFirst?: string;
  partnerLast?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export function openCsv() {
  return ipc.client.file.openCsv();
}

export function parseCsvWithMapping(filePath: string, mapping: ColumnMapping) {
  return ipc.client.file.parseCsvWithMapping({ filePath, mapping });
}

export function saveSession(session: Session, saveAs?: boolean) {
  return ipc.client.file.saveSession({ session, saveAs });
}

export function loadSession() {
  return ipc.client.file.loadSession();
}

export function exportCsv(recipients: Recipient[]) {
  return ipc.client.file.exportCsv({ recipients });
}
