import { os } from "@orpc/server";
import { dialog } from "electron";
import { readFile, writeFile } from "fs/promises";
import { parse as parseCsv } from "csv-parse/sync";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import {
  saveSessionInputSchema,
  exportCsvInputSchema,
  sessionSchema,
} from "./schemas";
import type { Recipient, Session } from "@/types/recipient";

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

  const records = parseCsv(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const recipients: Recipient[] = records.map((row) => ({
    id: crypto.randomUUID(),
    title: row["Title"] || row["title"] || "",
    firstName: row["First Name"] || row["firstName"] || row["first_name"] || "",
    lastName: row["Last Name"] || row["lastName"] || row["last_name"] || "",
    partnerTitle: row["Partner Title"] || row["partnerTitle"] || "",
    partnerFirst:
      row["Partner First"] || row["partnerFirst"] || row["partner_first"] || "",
    partnerLast:
      row["Partner Last"] || row["partnerLast"] || row["partner_last"] || "",
    company: row["Company"] || row["company"] || "",
    address1: row["Address 1"] || row["address1"] || row["address"] || "",
    address2: row["Address 2"] || row["address2"] || "",
    city: row["City"] || row["city"] || "",
    state: row["State"] || row["state"] || "",
    zip: row["Zip"] || row["zip"] || row["ZIP"] || row["postal_code"] || "",
    country: row["Country"] || row["country"] || "",
    gift: row["Gift"] || row["gift"] || "",
    giftValue: row["Gift Value"] || row["giftValue"] || row["gift_value"] || "",
    customPrompt: "",
    generatedMessage: "",
    isApproved: false,
    lastModified: new Date().toISOString(),
  }));

  return { success: true as const, recipients, filePath };
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
