import { OpenRouter } from "@openrouter/sdk";
import type { Recipient } from "@/types/recipient";

const DEFAULT_MODELS = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5" },
  { id: "openai/gpt-5.2", name: "GPT-5.2" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
];

export interface OpenRouterModelPricing {
  prompt: string; // Cost per token for prompts (as string from API)
  completion: string; // Cost per token for completions (as string from API)
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: OpenRouterModelPricing;
  contextLength?: number | null;
}

export interface GenerateMessageOptions {
  apiKey: string;
  model: string;
  recipient: Recipient;
  systemPrompt: string;
  userPromptTemplate: string;
}

export interface RegenerateMessageOptions {
  apiKey: string;
  model: string;
  previousMessage: string;
  modificationRequest: string;
  recipient: Recipient;
  systemPrompt: string;
  userPromptTemplate: string;
}

function createClient(apiKey: string): OpenRouter {
  return new OpenRouter({
    apiKey,
    httpReferer: "https://github.com/thank-you-card-generator",
    xTitle: "Thank You Card Generator",
  });
}

function buildRecipientContext(recipient: Recipient): string {
  const parts: string[] = [];

  // Build name string
  const primaryName = [recipient.title, recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(" ");
  const partnerName = [
    recipient.partnerTitle,
    recipient.partnerFirst,
    recipient.partnerLast,
  ]
    .filter(Boolean)
    .join(" ");

  if (primaryName && partnerName) {
    parts.push(`Recipients: ${primaryName} and ${partnerName}`);
  } else if (primaryName) {
    parts.push(`Recipient: ${primaryName}`);
  }

  if (recipient.gift) {
    parts.push(`Gift: ${recipient.gift}`);
  }

  if (recipient.giftValue) {
    parts.push(`Gift Value: ${recipient.giftValue}`);
  }

  return parts.join("\n");
}

export async function generateMessage(
  options: GenerateMessageOptions,
): Promise<string> {
  const { apiKey, model, recipient, systemPrompt, userPromptTemplate } =
    options;
  const client = createClient(apiKey);

  const recipientContext = buildRecipientContext(recipient);
  const fullRecipientContext = recipient.customPrompt
    ? `${recipientContext}\n\nAdditional context: ${recipient.customPrompt}`
    : recipientContext;

  // Replace placeholder in user prompt template
  const userPrompt = userPromptTemplate.replace(
    /\{\{recipientContext\}\}/g,
    fullRecipientContext,
  );

  const result = client.callModel({
    model,
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const text = await result.getText();
  return text.trim();
}

export async function regenerateMessage(
  options: RegenerateMessageOptions,
): Promise<string> {
  const {
    apiKey,
    model,
    previousMessage,
    modificationRequest,
    recipient,
    systemPrompt,
    userPromptTemplate,
  } = options;
  const client = createClient(apiKey);

  const recipientContext = buildRecipientContext(recipient);
  const fullRecipientContext = recipient.customPrompt
    ? `${recipientContext}\n\nAdditional context: ${recipient.customPrompt}`
    : recipientContext;

  // Replace placeholder in user prompt template
  const userPrompt = userPromptTemplate.replace(
    /\{\{recipientContext\}\}/g,
    fullRecipientContext,
  );

  const result = client.callModel({
    model,
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userPrompt,
      },
      { role: "assistant", content: previousMessage },
      {
        role: "user",
        content: `Please modify the message with these changes: ${modificationRequest}`,
      },
    ],
  });

  const text = await result.getText();
  return text.trim();
}

export async function fetchAvailableModels(
  apiKey: string,
): Promise<OpenRouterModel[]> {
  try {
    // Use the OpenRouter SDK to fetch models
    const client = new OpenRouter({
      apiKey,
    });

    const result = await client.models.list();

    if (!result.data || result.data.length === 0) {
      console.warn("No models returned from API, using defaults");
      return DEFAULT_MODELS;
    }

    // Return all models with pricing info, sorted by name
    const models = result.data
      .filter((m) => {
        // Filter out models that don't support text output
        const outputModalities = m.architecture?.outputModalities || [];
        return outputModalities.includes("text");
      })
      .map((m) => ({
        id: m.id,
        name: m.name,
        pricing: m.pricing
          ? {
              prompt: m.pricing.prompt,
              completion: m.pricing.completion,
            }
          : undefined,
        contextLength: m.contextLength,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return models.length > 0 ? models : DEFAULT_MODELS;
  } catch (error) {
    console.warn("Error fetching models:", error);
    return DEFAULT_MODELS;
  }
}

export function getDefaultModels(): OpenRouterModel[] {
  return DEFAULT_MODELS;
}

export async function testConnection(apiKey: string): Promise<boolean> {
  try {
    const client = createClient(apiKey);
    const result = client.callModel({
      model: "openai/gpt-4o-mini",
      input: 'Say "OK" and nothing else.',
    });

    const text = await result.getText();
    return text.toLowerCase().includes("ok");
  } catch {
    return false;
  }
}
