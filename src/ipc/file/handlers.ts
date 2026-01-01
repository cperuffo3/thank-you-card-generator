import { os } from "@orpc/server";
import { dialog } from "electron";
import { readFile, writeFile } from "fs/promises";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import {
  exportCsvInputSchema,
  parseCsvWithMappingInputSchema,
  saveCardFileInputSchema,
  loadCardFileFromPathInputSchema,
} from "./schemas";
import type { Recipient } from "@/types/recipient";
import { generateAddressTo } from "@/utils/address-to";

// Parse name that may have "UNMATCHED:" prefix and split into first/last name
function parseNameField(value: string): {
  firstName: string;
  lastName: string;
} {
  if (!value) return { firstName: "", lastName: "" };

  // Remove "UNMATCHED:" prefix (case-insensitive)
  const name = value.replace(/^UNMATCHED:\s*/i, "").trim();

  if (!name) return { firstName: "", lastName: "" };

  // Split into parts
  const parts = name.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  // Last part is last name, everything else is first name
  const lastName = parts.pop() || "";
  const firstName = parts.join(" ");

  return { firstName, lastName };
}

// Open CSV and return raw data with headers for column mapping
export const openCsv = os.handler(async () => {
  const result = await dialog.showOpenDialog({
    title: "Select CSV File",
    filters: [{ name: "CSV Files", extensions: ["csv"] }],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false as const, canceled: true };
  }

  const filePath = result.filePaths[0];
  const content = await readFile(filePath, "utf-8");

  try {
    const records = parseCsv(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    // Get column headers from first record
    const headers = records.length > 0 ? Object.keys(records[0]) : [];

    // Return raw data for column mapping UI
    return {
      success: true as const,
      filePath,
      fileName: filePath.split(/[\\/]/).pop() || "file.csv",
      headers,
      rowCount: records.length,
      previewRows: records.slice(0, 5), // First 5 rows for preview
      rawRecords: records, // Full data for parsing
    };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to parse CSV file",
    };
  }
});

// Parse CSV with user-provided column mapping
export const parseCsvWithMapping = os
  .input(parseCsvWithMappingInputSchema)
  .handler(async ({ input }) => {
    const { filePath, mapping } = input;
    const content = await readFile(filePath, "utf-8");

    try {
      const records = parseCsv(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      const recipients: Recipient[] = records.map((row) => {
        // Get raw first and last name values
        let firstName = row[mapping.firstName] || "";
        let lastName = row[mapping.lastName] || "";

        // Check if firstName contains "UNMATCHED:" prefix (combined name field)
        if (firstName.toUpperCase().startsWith("UNMATCHED:")) {
          const parsed = parseNameField(firstName);
          firstName = parsed.firstName;
          // Only override lastName if it wasn't explicitly mapped or is empty
          if (!lastName) {
            lastName = parsed.lastName;
          }
        }

        const title = row[mapping.title] || "";
        const partnerTitle = mapping.partnerTitle
          ? row[mapping.partnerTitle] || ""
          : "";
        const partnerFirst = mapping.partnerFirst
          ? row[mapping.partnerFirst] || ""
          : "";
        const partnerLast = mapping.partnerLast
          ? row[mapping.partnerLast] || ""
          : "";

        // Generate formal address line
        const addressTo = generateAddressTo({
          title,
          firstName,
          lastName,
          partnerTitle,
          partnerFirst,
          partnerLast,
        });

        return {
          id: crypto.randomUUID(),
          title,
          firstName,
          lastName,
          partnerTitle,
          partnerFirst,
          partnerLast,
          addressTo,
          addressToOverridden: false,
          address1: mapping.address1 ? row[mapping.address1] || "" : "",
          address2: mapping.address2 ? row[mapping.address2] || "" : "",
          city: mapping.city ? row[mapping.city] || "" : "",
          state: mapping.state ? row[mapping.state] || "" : "",
          zip: mapping.zip ? row[mapping.zip] || "" : "",
          country: mapping.country ? row[mapping.country] || "" : "",
          gift: row[mapping.gift] || "",
          giftValue: mapping.giftValue ? row[mapping.giftValue] || "" : "",
          customPrompt: "",
          generatedMessage: "",
          isApproved: false,
          lastModified: new Date().toISOString(),
        };
      });

      return { success: true as const, recipients };
    } catch (error) {
      return {
        success: false as const,
        error:
          error instanceof Error ? error.message : "Failed to parse CSV file",
      };
    }
  });

// Old saveSession and loadSession handlers removed - use card file handlers instead

// Field label mapping for CSV headers
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  firstName: "First Name",
  lastName: "Last Name",
  partnerTitle: "Partner Title",
  partnerFirst: "Partner First",
  partnerLast: "Partner Last",
  addressTo: "Address To",
  address1: "Address 1",
  address2: "Address 2",
  city: "City",
  state: "State",
  zip: "Zip",
  country: "Country",
  gift: "Gift",
  giftValue: "Gift Value",
  generatedMessage: "Message",
};

// Default fields if none specified (all fields)
const DEFAULT_EXPORT_FIELDS = [
  "addressTo",
  "title",
  "firstName",
  "lastName",
  "partnerTitle",
  "partnerFirst",
  "partnerLast",
  "address1",
  "address2",
  "city",
  "state",
  "zip",
  "country",
  "gift",
  "giftValue",
  "generatedMessage",
] as const;

export const exportCsv = os
  .input(exportCsvInputSchema)
  .handler(async ({ input }) => {
    const { recipients, fields, filename } = input;
    const exportFields = fields || DEFAULT_EXPORT_FIELDS;

    const result = await dialog.showSaveDialog({
      title: "Export CSV",
      defaultPath: filename || "Thank You Cards.csv",
      filters: [{ name: "CSV Files", extensions: ["csv"] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false as const, canceled: true };
    }

    // Build rows with only the selected fields
    const rows = recipients.map((r) => {
      const row: Record<string, string> = {};
      exportFields.forEach((field) => {
        const label = FIELD_LABELS[field] || field;
        row[label] = r[field as keyof Recipient] as string;
      });
      return row;
    });

    const csvContent = stringifyCsv(rows, { header: true });
    await writeFile(result.filePath, csvContent, "utf-8");

    return { success: true as const, filePath: result.filePath };
  });

// Old saveEncryptedSettings and loadEncryptedSettings handlers removed - use card file handlers instead

// ========== Card File Handlers (Unified Format) ==========

export const saveCardFile = os
  .input(saveCardFileInputSchema)
  .handler(async ({ input }) => {
    const { encryptedData, saveAs, currentFilePath } = input;

    let filePath = currentFilePath;

    if (!filePath || saveAs) {
      const result = await dialog.showSaveDialog({
        title: "Save Card File",
        defaultPath: "Thank You Cards.card",
        filters: [{ name: "Wedding Card Files", extensions: ["card"] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false as const, canceled: true };
      }

      filePath = result.filePath;
    }

    await writeFile(filePath, encryptedData, "utf-8");

    return { success: true as const, filePath };
  });

export const loadCardFile = os.handler(async () => {
  const result = await dialog.showOpenDialog({
    title: "Open Card File",
    filters: [{ name: "Wedding Card Files", extensions: ["card"] }],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false as const, canceled: true };
  }

  const filePath = result.filePaths[0];
  const content = await readFile(filePath, "utf-8");

  return { success: true as const, encryptedData: content, filePath };
});

export const loadCardFileFromPath = os
  .input(loadCardFileFromPathInputSchema)
  .handler(async ({ input }) => {
    const { filePath } = input;

    try {
      const content = await readFile(filePath, "utf-8");
      return { success: true as const, encryptedData: content, filePath };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : "Failed to load file",
      };
    }
  });
