import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Session, Recipient } from "@/types/recipient";
import { saveSession } from "@/actions/file";
import type { OpenRouterModel } from "@/services/openrouter";
import { getDefaultModels, fetchAvailableModels } from "@/services/openrouter";

// Local storage keys
const API_KEY_STORAGE_KEY = "openrouter-api-key";
const MODEL_STORAGE_KEY = "openrouter-model";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

interface SessionContextValue {
  session: Session | null;
  setSession: (session: Session | null) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  currentRecipientId: string | null;
  setCurrentRecipientId: (id: string | null) => void;
  saveCurrentSession: (saveAs?: boolean) => Promise<void>;
  isDirty: boolean;
  // API Configuration
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  models: OpenRouterModel[];
  isLoadingModels: boolean;
  refreshModels: () => Promise<void>;
  isApiConfigured: boolean;
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
    async (saveAs?: boolean) => {
      if (!session) return;

      const result = await saveSession(session, saveAs);
      if (result.success && result.filePath) {
        setSessionState((prev) =>
          prev ? { ...prev, filePath: result.filePath } : prev,
        );
        setIsDirty(false);
      }
    },
    [session],
  );

  const value: SessionContextValue = {
    session,
    setSession,
    updateRecipient,
    currentRecipientId,
    setCurrentRecipientId,
    saveCurrentSession,
    isDirty,
    // API Configuration
    apiKey,
    setApiKey,
    model,
    setModel,
    models,
    isLoadingModels,
    refreshModels,
    isApiConfigured,
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
