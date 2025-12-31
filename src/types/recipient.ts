export interface Recipient {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  partnerTitle: string;
  partnerFirst: string;
  partnerLast: string;
  company: string;
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
}

export interface Session {
  openRouterApiKey: string;
  model: string;
  recipients: Recipient[];
  filePath?: string;
}
