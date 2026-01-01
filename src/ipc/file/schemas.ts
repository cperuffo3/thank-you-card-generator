import z from "zod";

const recipientSchema = z.object({
  id: z.string(),
  title: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  partnerTitle: z.string(),
  partnerFirst: z.string(),
  partnerLast: z.string(),
  addressTo: z.string(),
  addressToOverridden: z.boolean(),
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
  gift: z.string(),
  giftValue: z.string(),
  customPrompt: z.string(),
  generatedMessage: z.string(),
  isApproved: z.boolean(),
  lastModified: z.string(),
  // Address validation fields
  addressValidated: z.boolean().optional(),
  addressValidationError: z.string().optional(),
  formattedAddress: z.string().optional(),
});

export const sessionSchema = z.object({
  openRouterApiKey: z.string(),
  model: z.string(),
  recipients: z.array(recipientSchema),
  filePath: z.string().optional(),
});

export const saveSessionInputSchema = z.object({
  session: sessionSchema,
  saveAs: z.boolean().optional(),
});

export const exportCsvInputSchema = z.object({
  recipients: z.array(recipientSchema),
  fields: z
    .array(
      z.enum([
        "title",
        "firstName",
        "lastName",
        "partnerTitle",
        "partnerFirst",
        "partnerLast",
        "addressTo",
        "address1",
        "address2",
        "city",
        "state",
        "zip",
        "country",
        "gift",
        "giftValue",
        "generatedMessage",
      ]),
    )
    .optional(),
});

export const columnMappingSchema = z.object({
  title: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gift: z.string(),
  giftValue: z.string().optional(),
  partnerTitle: z.string().optional(),
  partnerFirst: z.string().optional(),
  partnerLast: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export const parseCsvWithMappingInputSchema = z.object({
  filePath: z.string(),
  mapping: columnMappingSchema,
});

export const exportedSettingsSchema = z.object({
  version: z.number(),
  openRouterApiKey: z.string(),
  model: z.string(),
  googleMapsApiKey: z.string(),
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  exportedAt: z.string(),
});

export const saveEncryptedSettingsInputSchema = z.object({
  encryptedData: z.string(),
});

// Card file schemas (unified format)
export const cardFileDataSchema = z.object({
  version: z.number(),
  magic: z.string(),
  openRouterApiKey: z.string(),
  model: z.string(),
  googleMapsApiKey: z.string(),
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  recipients: z.array(recipientSchema),
  exportedAt: z.string(),
  appVersion: z.string().optional(),
});

export const saveCardFileInputSchema = z.object({
  encryptedData: z.string(),
  saveAs: z.boolean().optional(),
  currentFilePath: z.string().optional(),
});

export const loadCardFileFromPathInputSchema = z.object({
  filePath: z.string(),
});
