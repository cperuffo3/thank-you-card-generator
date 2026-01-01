import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EditorSidebar, EditorContent } from "@/components/editor";
import { ExportDialog } from "@/components/export-dialog";
import { exportCsv } from "@/actions/file";
import { generateMessage, regenerateMessage } from "@/services/openrouter";
import { useSession } from "@/context/session-context";
import type { Recipient } from "@/types/recipient";
import { toast } from "sonner";

function EditorPage() {
  const { recipients: recipientsParam } = Route.useSearch();
  const {
    apiKey,
    model,
    systemPrompt,
    userPromptTemplate,
    session,
    setSession,
    saveCurrentSession,
    cardFilePath,
  } = useSession();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [currentRecipientId, setCurrentRecipientId] = useState<string | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const hasInitializedRef = useRef(false);

  // Parse recipients from URL params or session context
  useEffect(() => {
    if (hasInitializedRef.current) return;

    // First try URL params
    if (recipientsParam) {
      try {
        const parsed = JSON.parse(recipientsParam) as Recipient[];
        setRecipients(parsed);
        if (parsed.length > 0) {
          setCurrentRecipientId(parsed[0].id);
        }
        hasInitializedRef.current = true;
        return;
      } catch {
        toast.error("Failed to parse recipient data");
      }
    }

    // Fall back to session context (for file open events)
    if (session?.recipients && session.recipients.length > 0) {
      setRecipients(session.recipients);
      setCurrentRecipientId(session.recipients[0].id);
      hasInitializedRef.current = true;
    }
  }, [recipientsParam, session]);

  const currentRecipient = recipients.find(
    (r) => r.id === currentRecipientId,
  );

  const currentIndex =
    recipients.findIndex((r) => r.id === currentRecipientId) ?? -1;

  const updateRecipient = useCallback(
    (updates: Partial<Recipient>) => {
      if (!currentRecipientId) return;

      setRecipients((prev) =>
        prev.map((r) =>
          r.id === currentRecipientId ? { ...r, ...updates } : r,
        ),
      );
    },
    [currentRecipientId],
  );

  const handleGenerate = async () => {
    if (!currentRecipient) return;

    setIsGenerating(true);

    try {
      const message = await generateMessage({
        apiKey,
        model,
        recipient: currentRecipient,
        systemPrompt,
        userPromptTemplate,
      });

      updateRecipient({
        generatedMessage: message,
        lastModified: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate message",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (modificationRequest: string) => {
    if (!currentRecipient || !currentRecipient.generatedMessage) return;

    setIsGenerating(true);

    try {
      const message = await regenerateMessage({
        apiKey,
        model,
        previousMessage: currentRecipient.generatedMessage,
        modificationRequest,
        recipient: currentRecipient,
        systemPrompt,
        userPromptTemplate,
      });

      updateRecipient({
        generatedMessage: message,
        lastModified: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to regenerate message",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenExportDialog = () => {
    setIsExportDialogOpen(true);
  };

  const handleExport = async (
    recipientsToExport: Recipient[],
    fields: (keyof Recipient)[],
    filename: string,
  ) => {
    if (recipientsToExport.length === 0) {
      toast.error("No recipients to export");
      return;
    }

    setIsExporting(true);
    try {
      await exportCsv(recipientsToExport, fields, filename);
      toast.success("CSV exported successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (recipients.length === 0) {
      toast.error("No recipients to save");
      return;
    }

    // Sync local recipients to session before saving
    setSession({
      openRouterApiKey: apiKey,
      model,
      recipients,
    });

    setIsSaving(true);

    try {
      const result = await saveCurrentSession(true); // saveAs = true to show dialog
      if (result.success) {
        toast.success("Session saved successfully");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToRecipient = (direction: "prev" | "next") => {
    if (recipients.length === 0 || currentIndex === -1) return;

    const newIndex =
      direction === "prev"
        ? Math.max(0, currentIndex - 1)
        : Math.min(recipients.length - 1, currentIndex + 1);

    setCurrentRecipientId(recipients[newIndex].id);
  };

  // Auto-save periodically (only if we have a file path already)
  useEffect(() => {
    const interval = setInterval(() => {
      if (recipients.length > 0 && cardFilePath) {
        // Sync local recipients to session
        setSession({
          openRouterApiKey: apiKey,
          model,
          recipients,
        });
        // Save without showing dialog
        saveCurrentSession(false).catch(() => {
          // Silent fail for auto-save
        });
      }
    }, 60000); // Auto-save every minute

    return () => clearInterval(interval);
  }, [recipients, cardFilePath, apiKey, model, setSession, saveCurrentSession]);

  if (recipients.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Loading recipients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar
          recipients={recipients}
          selectedId={currentRecipientId}
          onSelect={setCurrentRecipientId}
          onExport={handleOpenExportDialog}
          onSave={handleSave}
          isExporting={isExporting}
          isSaving={isSaving}
        />

        <ExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          recipients={recipients}
          onExport={handleExport}
        />

        {currentRecipient ? (
          <EditorContent
            recipient={currentRecipient}
            currentIndex={currentIndex}
            totalCount={recipients.length}
            isGenerating={isGenerating}
            onUpdateRecipient={updateRecipient}
            onGenerate={handleGenerate}
            onRegenerate={handleRegenerate}
            onNavigate={navigateToRecipient}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <p className="text-gray-500">
              Select a recipient from the sidebar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/editor")({
  component: EditorPage,
  validateSearch: (search: Record<string, unknown>) => ({
    recipients: (search.recipients as string) || "",
  }),
});
