import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Session, Recipient } from "@/types/recipient";
import {
  saveCardFile as saveCardFileAction,
  loadCardFile as loadCardFileAction,
  loadCardFileFromPath,
} from "@/actions/file";
import type { OpenRouterModel } from "@/services/openrouter";
import { getDefaultModels, fetchAvailableModels } from "@/services/openrouter";
import {
  createCardFileData,
  encryptCardFile,
  decryptCardFile,
  extractSettings,
} from "@/utils/card-crypto";

// Local storage keys
const API_KEY_STORAGE_KEY = "openrouter-api-key";
const MODEL_STORAGE_KEY = "openrouter-model";
const GOOGLE_MAPS_API_KEY_STORAGE_KEY = "google-maps-api-key";
const SYSTEM_PROMPT_STORAGE_KEY = "ai-system-prompt";
const USER_PROMPT_TEMPLATE_STORAGE_KEY = "ai-user-prompt-template";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

// Default prompts
export const DEFAULT_SYSTEM_PROMPT = `You are an expert at writing heartfelt, personalized wedding thank you card messages.

Guidelines:
- Keep messages warm, sincere, and personal
- Reference the specific gift when provided
- Keep messages concise (2-4 sentences ideal for a card)
- Match the formality to the relationship (more formal for business contacts, warmer for family/friends)
- Do not include a greeting or sign-off - just the body of the thank you message
- Avoid generic phrases like "it means so much" - be specific and genuine`;

export const DEFAULT_USER_PROMPT_TEMPLATE = `Write a thank you message for this wedding gift:

{{recipientContext}}`;

interface SessionContextValue {
  session: Session | null;
  setSession: (session: Session | null) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  currentRecipientId: string | null;
  setCurrentRecipientId: (id: string | null) => void;
  saveCurrentSession: (
    saveAs?: boolean,
  ) => Promise<{ success: boolean; filePath?: string }>;
  loadSessionFromFile: () => Promise<{
    success: boolean;
    hasRecipients: boolean;
  }>;
  loadSessionFromPath: (
    filePath: string,
  ) => Promise<{ success: boolean; hasRecipients: boolean }>;
  clearSession: () => void;
  isDirty: boolean;
  cardFilePath: string | null;
  // OpenRouter API Configuration
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  models: OpenRouterModel[];
  isLoadingModels: boolean;
  refreshModels: () => Promise<void>;
  isApiConfigured: boolean;
  // Google Maps API Configuration
  googleMapsApiKey: string;
  setGoogleMapsApiKey: (key: string) => void;
  isGoogleMapsConfigured: boolean;
  // AI Prompt Configuration
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  userPromptTemplate: string;
  setUserPromptTemplate: (template: string) => void;
  resetPromptsToDefaults: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [currentRecipientId, setCurrentRecipientId] = useState<string | null>(
    null,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [cardFilePath, setCardFilePath] = useState<string | null>(null);

  // API Configuration state
  const [apiKey, setApiKeyState] = useState<string>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== "undefined") {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
    }
    return "";
  });
  const [model, setModelState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
    }
    return DEFAULT_MODEL;
  });
  const [models, setModels] = useState<OpenRouterModel[]>(getDefaultModels());
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Google Maps API key state
  const [googleMapsApiKey, setGoogleMapsApiKeyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(GOOGLE_MAPS_API_KEY_STORAGE_KEY) || "";
    }
    return "";
  });

  // AI Prompt state
  const [systemPrompt, setSystemPromptState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(SYSTEM_PROMPT_STORAGE_KEY) || DEFAULT_SYSTEM_PROMPT
      );
    }
    return DEFAULT_SYSTEM_PROMPT;
  });
  const [userPromptTemplate, setUserPromptTemplateState] = useState<string>(
    () => {
      if (typeof window !== "undefined") {
        return (
          localStorage.getItem(USER_PROMPT_TEMPLATE_STORAGE_KEY) ||
          DEFAULT_USER_PROMPT_TEMPLATE
        );
      }
      return DEFAULT_USER_PROMPT_TEMPLATE;
    },
  );

  // Persist API key to localStorage
  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    }
  }, []);

  // Persist model to localStorage
  const setModel = useCallback((newModel: string) => {
    setModelState(newModel);
    if (typeof window !== "undefined") {
      localStorage.setItem(MODEL_STORAGE_KEY, newModel);
    }
  }, []);

  // Persist Google Maps API key to localStorage
  const setGoogleMapsApiKey = useCallback((key: string) => {
    setGoogleMapsApiKeyState(key);
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.setItem(GOOGLE_MAPS_API_KEY_STORAGE_KEY, key);
      } else {
        localStorage.removeItem(GOOGLE_MAPS_API_KEY_STORAGE_KEY);
      }
    }
  }, []);

  // Persist system prompt to localStorage
  const setSystemPrompt = useCallback((prompt: string) => {
    setSystemPromptState(prompt);
    if (typeof window !== "undefined") {
      localStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, prompt);
    }
  }, []);

  // Persist user prompt template to localStorage
  const setUserPromptTemplate = useCallback((template: string) => {
    setUserPromptTemplateState(template);
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_PROMPT_TEMPLATE_STORAGE_KEY, template);
    }
  }, []);

  // Reset prompts to defaults
  const resetPromptsToDefaults = useCallback(() => {
    setSystemPromptState(DEFAULT_SYSTEM_PROMPT);
    setUserPromptTemplateState(DEFAULT_USER_PROMPT_TEMPLATE);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SYSTEM_PROMPT_STORAGE_KEY);
      localStorage.removeItem(USER_PROMPT_TEMPLATE_STORAGE_KEY);
    }
  }, []);

  // Fetch models when API key changes
  const refreshModels = useCallback(async () => {
    if (!apiKey) {
      setModels(getDefaultModels());
      return;
    }

    setIsLoadingModels(true);
    try {
      const fetchedModels = await fetchAvailableModels(apiKey);
      setModels(fetchedModels);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setModels(getDefaultModels());
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiKey]);

  // Fetch models on initial load if API key exists
  useEffect(() => {
    if (apiKey) {
      refreshModels();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isApiConfigured = apiKey.trim().length > 0;
  const isGoogleMapsConfigured = googleMapsApiKey.trim().length > 0;

  const setSession = useCallback((newSession: Session | null) => {
    setSessionState(newSession);
    setIsDirty(false);
    // Reset current recipient when session changes
    if (newSession && newSession.recipients.length > 0) {
      setCurrentRecipientId(newSession.recipients[0].id);
    } else {
      setCurrentRecipientId(null);
    }
  }, []);

  const updateRecipient = useCallback(
    (id: string, updates: Partial<Recipient>) => {
      setSessionState((prev) => {
        if (!prev) return prev;

        const updatedRecipients = prev.recipients.map((r) =>
          r.id === id
            ? { ...r, ...updates, lastModified: new Date().toISOString() }
            : r,
        );

        return {
          ...prev,
          recipients: updatedRecipients,
        };
      });
      setIsDirty(true);
    },
    [],
  );

  const saveCurrentSession = useCallback(
    async (
      saveAs?: boolean,
    ): Promise<{ success: boolean; filePath?: string }> => {
      if (!session) return { success: false };

      // Create the unified card file data
      const cardData = createCardFileData({
        openRouterApiKey: apiKey,
        model,
        googleMapsApiKey,
        systemPrompt,
        userPromptTemplate,
        recipients: session.recipients,
      });

      const encryptedData = await encryptCardFile(cardData);
      const result = await saveCardFileAction(
        encryptedData,
        saveAs,
        cardFilePath || undefined,
      );

      if (result.success && result.filePath) {
        setCardFilePath(result.filePath);
        setIsDirty(false);
        return { success: true, filePath: result.filePath };
      }

      return { success: false };
    },
    [
      session,
      apiKey,
      model,
      googleMapsApiKey,
      systemPrompt,
      userPromptTemplate,
      cardFilePath,
    ],
  );

  const loadSessionFromFile = useCallback(async (): Promise<{
    success: boolean;
    hasRecipients: boolean;
  }> => {
    const result = await loadCardFileAction();

    if (result.success && result.encryptedData) {
      try {
        const cardData = await decryptCardFile(result.encryptedData);
        const settings = extractSettings(cardData);
        const hasRecipients =
          cardData.recipients && cardData.recipients.length > 0;

        // Update settings
        setApiKey(settings.openRouterApiKey);
        setModel(settings.model);
        setGoogleMapsApiKey(settings.googleMapsApiKey);
        setSystemPrompt(settings.systemPrompt);
        setUserPromptTemplate(settings.userPromptTemplate);

        // Only update session if there are recipients
        if (hasRecipients) {
          const newSession: Session = {
            openRouterApiKey: settings.openRouterApiKey,
            model: settings.model,
            recipients: cardData.recipients,
            filePath: result.filePath,
          };
          setSessionState(newSession);
          setCardFilePath(result.filePath || null);
          setCurrentRecipientId(cardData.recipients[0].id);
        }
        setIsDirty(false);

        return { success: true, hasRecipients };
      } catch (error) {
        console.error("Failed to decrypt card file:", error);
        return { success: false, hasRecipients: false };
      }
    }

    return { success: false, hasRecipients: false };
  }, [
    setApiKey,
    setModel,
    setGoogleMapsApiKey,
    setSystemPrompt,
    setUserPromptTemplate,
  ]);

  const loadSessionFromPath = useCallback(
    async (
      filePath: string,
    ): Promise<{ success: boolean; hasRecipients: boolean }> => {
      const result = await loadCardFileFromPath(filePath);

      if (result.success && result.encryptedData) {
        try {
          const cardData = await decryptCardFile(result.encryptedData);
          const settings = extractSettings(cardData);
          const hasRecipients =
            cardData.recipients && cardData.recipients.length > 0;

          // Update settings
          setApiKey(settings.openRouterApiKey);
          setModel(settings.model);
          setGoogleMapsApiKey(settings.googleMapsApiKey);
          setSystemPrompt(settings.systemPrompt);
          setUserPromptTemplate(settings.userPromptTemplate);

          // Only update session if there are recipients
          if (hasRecipients) {
            const newSession: Session = {
              openRouterApiKey: settings.openRouterApiKey,
              model: settings.model,
              recipients: cardData.recipients,
              filePath: result.filePath,
            };
            setSessionState(newSession);
            setCardFilePath(result.filePath || null);
            setCurrentRecipientId(cardData.recipients[0].id);
          }
          setIsDirty(false);

          return { success: true, hasRecipients };
        } catch (error) {
          console.error("Failed to decrypt card file:", error);
          return { success: false, hasRecipients: false };
        }
      }

      return { success: false, hasRecipients: false };
    },
    [
      setApiKey,
      setModel,
      setGoogleMapsApiKey,
      setSystemPrompt,
      setUserPromptTemplate,
    ],
  );

  const clearSession = useCallback(() => {
    setSessionState(null);
    setCurrentRecipientId(null);
    setCardFilePath(null);
    setIsDirty(false);
  }, []);

  const value: SessionContextValue = {
    session,
    setSession,
    updateRecipient,
    currentRecipientId,
    setCurrentRecipientId,
    saveCurrentSession,
    loadSessionFromFile,
    loadSessionFromPath,
    clearSession,
    isDirty,
    cardFilePath,
    // OpenRouter API Configuration
    apiKey,
    setApiKey,
    model,
    setModel,
    models,
    isLoadingModels,
    refreshModels,
    isApiConfigured,
    // Google Maps API Configuration
    googleMapsApiKey,
    setGoogleMapsApiKey,
    isGoogleMapsConfigured,
    // AI Prompt Configuration
    systemPrompt,
    setSystemPrompt,
    userPromptTemplate,
    setUserPromptTemplate,
    resetPromptsToDefaults,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
