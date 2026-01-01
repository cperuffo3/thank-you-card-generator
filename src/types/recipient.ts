export interface Recipient {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  partnerTitle: string;
  partnerFirst: string;
  partnerLast: string;
  // Formal address line (e.g., "Drs. Michael and Emily Smith")
  addressTo: string;
  addressToOverridden: boolean; // If true, addressTo won't be recalculated when names change
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  gift: string;
  giftValue: string;
  customPrompt: string;
  generatedMessage: string;
  isApproved: boolean;
  lastModified: string;
  // Address validation
  addressValidated?: boolean; // true = valid, false = invalid, undefined = not validated
  addressValidationError?: string;
  formattedAddress?: string; // The corrected address from Google
}

export interface Session {
  openRouterApiKey: string;
  model: string;
  recipients: Recipient[];
  filePath?: string;
}
