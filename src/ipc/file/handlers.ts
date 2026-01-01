import { os } from "@orpc/server";
import { dialog } from "electron";
import { readFile, writeFile } from "fs/promises";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import {
  saveSessionInputSchema,
  exportCsvInputSchema,
  sessionSchema,
  parseCsvWithMappingInputSchema,
} from "./schemas";
import type { Recipient, Session } from "@/types/recipient";

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

        return {
          id: crypto.randomUUID(),
          title: row[mapping.title] || "",
          firstName,
          lastName,
          partnerTitle: mapping.partnerTitle
            ? row[mapping.partnerTitle] || ""
            : "",
          partnerFirst: mapping.partnerFirst
            ? row[mapping.partnerFirst] || ""
            : "",
          partnerLast: mapping.partnerLast
            ? row[mapping.partnerLast] || ""
            : "",
          company: mapping.company ? row[mapping.company] || "" : "",
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

export const saveSession = os
  .input(saveSessionInputSchema)
  .handler(async ({ input }) => {
    const { session, saveAs } = input;

    let filePath = session.filePath;

    if (!filePath || saveAs) {
      const result = await dialog.showSaveDialog({
        title: "Save Session",
        defaultPath: "wedding-thank-you-session.json",
        filters: [{ name: "JSON Files", extensions: ["json"] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false as const, canceled: true };
      }

      filePath = result.filePath;
    }

    const sessionToSave: Session = {
      ...session,
      filePath,
    };

    await writeFile(filePath, JSON.stringify(sessionToSave, null, 2), "utf-8");

    return { success: true as const, filePath };
  });

export const loadSession = os.handler(async () => {
  const result = await dialog.showOpenDialog({
    title: "Load Session",
    filters: [{ name: "JSON Files", extensions: ["json"] }],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false as const, canceled: true };
  }

  const filePath = result.filePaths[0];
  const content = await readFile(filePath, "utf-8");
  const data = JSON.parse(content);

  const session = sessionSchema.parse(data);
  session.filePath = filePath;

  return { success: true as const, session };
});

export const exportCsv = os
  .input(exportCsvInputSchema)
  .handler(async ({ input }) => {
    const { recipients } = input;

    const result = await dialog.showSaveDialog({
      title: "Export CSV",
      defaultPath: "thank-you-cards.csv",
      filters: [{ name: "CSV Files", extensions: ["csv"] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false as const, canceled: true };
    }

    const rows = recipients.map((r) => ({
      Title: r.title,
      "First Name": r.firstName,
      "Last Name": r.lastName,
      "Partner Title": r.partnerTitle,
      "Partner First": r.partnerFirst,
      "Partner Last": r.partnerLast,
      Company: r.company,
      "Address 1": r.address1,
      "Address 2": r.address2,
      City: r.city,
      State: r.state,
      Zip: r.zip,
      Country: r.country,
      Gift: r.gift,
      "Gift Value": r.giftValue,
      Message: r.generatedMessage,
    }));

    const csvContent = stringifyCsv(rows, { header: true });
    await writeFile(result.filePath, csvContent, "utf-8");

    return { success: true as const, filePath: result.filePath };
  });
