import z from "zod";

const recipientSchema = z.object({
  id: z.string(),
  title: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  partnerTitle: z.string(),
  partnerFirst: z.string(),
  partnerLast: z.string(),
  company: z.string(),
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
  company: z.string().optional(),
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
