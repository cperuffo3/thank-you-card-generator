import { ipc } from "@/ipc/manager";
import type { Recipient } from "@/types/recipient";

export interface ColumnMapping {
  title: string;
  firstName: string;
  lastName: string;
  gift: string;
  giftValue?: string;
  partnerTitle?: string;
  partnerFirst?: string;
  partnerLast?: string;
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

type ExportableField =
  | "title" | "firstName" | "lastName"
  | "partnerTitle" | "partnerFirst" | "partnerLast"
  | "addressTo" | "address1" | "address2"
  | "city" | "state" | "zip" | "country"
  | "gift" | "giftValue" | "generatedMessage";

export function exportCsv(recipients: Recipient[], fields?: (keyof Recipient)[], filename?: string) {
  return ipc.client.file.exportCsv({
    recipients,
    fields: fields as ExportableField[] | undefined,
    filename,
  });
}

// Card file operations (unified encrypted format)
export function saveCardFile(
  encryptedData: string,
  saveAs?: boolean,
  currentFilePath?: string
) {
  return ipc.client.file.saveCardFile({ encryptedData, saveAs, currentFilePath });
}

export function loadCardFile() {
  return ipc.client.file.loadCardFile();
}

export function loadCardFileFromPath(filePath: string) {
  return ipc.client.file.loadCardFileFromPath({ filePath });
}
