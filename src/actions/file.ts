import { ipc } from "@/ipc/manager";
import type { Session, Recipient } from "@/types/recipient";

export function openCsv() {
  return ipc.client.file.openCsv();
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
