import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecipientSidebar } from "@/components/recipient-sidebar";
import { RecipientCard } from "@/components/recipient-card";
import { MessageEditor } from "@/components/message-editor";
import { saveSession, exportCsv } from "@/actions/file";
import { generateMessage, regenerateMessage } from "@/services/openrouter";
import type { Recipient, Session } from "@/types/recipient";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  AlertCircle,
  Home,
} from "lucide-react";

function EditorPage() {
  const navigate = useNavigate();
  const { session: sessionParam } = Route.useSearch();

  const [session, setSession] = useState<Session | null>(null);
  const [currentRecipientId, setCurrentRecipientId] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Parse session from URL params
  useEffect(() => {
    if (sessionParam && !hasInitializedRef.current) {
      try {
        const parsed = JSON.parse(sessionParam) as Session;
        setSession(parsed);
        if (parsed.recipients.length > 0) {
          setCurrentRecipientId(parsed.recipients[0].id);
        }
        hasInitializedRef.current = true;
      } catch {
        setError("Failed to parse session data");
      }
    }
  }, [sessionParam]);

  const currentRecipient = session?.recipients.find(
    (r) => r.id === currentRecipientId,
  );

  const currentIndex =
    session?.recipients.findIndex((r) => r.id === currentRecipientId) ?? -1;

  const approvedCount =
    session?.recipients.filter((r) => r.isApproved).length ?? 0;
  const totalCount = session?.recipients.length ?? 0;
  const progressPercent =
    totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

  const updateRecipient = useCallback(
    (updates: Partial<Recipient>) => {
      if (!session || !currentRecipientId) return;

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recipients: prev.recipients.map((r) =>
            r.id === currentRecipientId ? { ...r, ...updates } : r,
          ),
        };
      });
    },
    [session, currentRecipientId],
  );

  const handleGenerate = async () => {
    if (!session || !currentRecipient) return;

    setIsGenerating(true);
    setError(null);

    try {
      const message = await generateMessage({
        apiKey: session.openRouterApiKey,
        model: session.model,
        recipient: currentRecipient,
      });

      updateRecipient({
        generatedMessage: message,
        lastModified: new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate message",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (modificationRequest: string) => {
    if (!session || !currentRecipient || !currentRecipient.generatedMessage)
      return;

    setIsGenerating(true);
    setError(null);

    try {
      const message = await regenerateMessage({
        apiKey: session.openRouterApiKey,
        model: session.model,
        previousMessage: currentRecipient.generatedMessage,
        modificationRequest,
        recipient: currentRecipient,
      });

      updateRecipient({
        generatedMessage: message,
        lastModified: new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to regenerate message",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (saveAs = false) => {
    if (!session) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveSession(session, saveAs);
      if (result?.filePath) {
        setSession((prev) =>
          prev ? { ...prev, filePath: result.filePath } : prev,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!session) return;

    const approvedRecipients = session.recipients.filter((r) => r.isApproved);
    if (approvedRecipients.length === 0) {
      setError("No approved recipients to export");
      return;
    }

    try {
      await exportCsv(approvedRecipients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export CSV");
    }
  };

  const navigateToRecipient = (direction: "prev" | "next") => {
    if (!session || currentIndex === -1) return;

    const newIndex =
      direction === "prev"
        ? Math.max(0, currentIndex - 1)
        : Math.min(session.recipients.length - 1, currentIndex + 1);

    setCurrentRecipientId(session.recipients[newIndex].id);
  };

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {error && (
        <Alert variant="destructive" className="m-4 mb-0">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 overflow-hidden">
        <RecipientSidebar
          recipients={session.recipients}
          selectedId={currentRecipientId}
          onSelect={setCurrentRecipientId}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {currentRecipient ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="mx-auto max-w-2xl space-y-6">
                <RecipientCard recipient={currentRecipient} />
                <MessageEditor
                  recipient={currentRecipient}
                  apiKey={session.openRouterApiKey}
                  model={session.model}
                  onUpdateRecipient={updateRecipient}
                  onGenerate={handleGenerate}
                  onRegenerate={handleRegenerate}
                  isGenerating={isGenerating}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">
                Select a recipient from the sidebar
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
          >
            <Home className="mr-2 size-4" />
            Home
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateToRecipient("prev")}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground min-w-[80px] text-center text-sm">
              {currentIndex + 1} of {totalCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateToRecipient("next")}
              disabled={currentIndex >= totalCount - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex w-48 items-center gap-2">
            <Progress value={progressPercent} className="flex-1" />
            <span className="text-muted-foreground text-xs">
              {approvedCount}/{totalCount}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              <Save className="mr-2 size-4" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={approvedCount === 0}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/editor")({
  component: EditorPage,
  validateSearch: (search: Record<string, unknown>) => ({
    session: (search.session as string) || "",
  }),
});
