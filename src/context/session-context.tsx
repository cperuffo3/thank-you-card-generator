import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, Recipient } from "@/types/recipient";
import { saveSession } from "@/actions/file";

interface SessionContextValue {
  session: Session | null;
  setSession: (session: Session | null) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  currentRecipientId: string | null;
  setCurrentRecipientId: (id: string | null) => void;
  saveCurrentSession: (saveAs?: boolean) => Promise<void>;
  isDirty: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [currentRecipientId, setCurrentRecipientId] = useState<string | null>(
    null
  );
  const [isDirty, setIsDirty] = useState(false);

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
            : r
        );

        return {
          ...prev,
          recipients: updatedRecipients,
        };
      });
      setIsDirty(true);
    },
    []
  );

  const saveCurrentSession = useCallback(
    async (saveAs?: boolean) => {
      if (!session) return;

      const result = await saveSession(session, saveAs);
      if (result.success && result.filePath) {
        setSessionState((prev) =>
          prev ? { ...prev, filePath: result.filePath } : prev
        );
        setIsDirty(false);
      }
    },
    [session]
  );

  const value: SessionContextValue = {
    session,
    setSession,
    updateRecipient,
    currentRecipientId,
    setCurrentRecipientId,
    saveCurrentSession,
    isDirty,
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
