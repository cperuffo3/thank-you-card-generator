import React, { useState, useEffect } from "react";
import DragWindowRegion from "@/components/drag-window-region";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faGear,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { ipc } from "@/ipc/manager";
import { useSession } from "@/context/session-context";
import { ApiConfigDialog } from "@/components/api-config-dialog";
import { Button } from "@/components/ui/button";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [version, setVersion] = useState<string>("");
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);

  const {
    apiKey,
    setApiKey,
    model,
    setModel,
    models,
    isLoadingModels,
    refreshModels,
    isApiConfigured,
  } = useSession();

  useEffect(() => {
    ipc.client.app.appVersion().then(setVersion);
  }, []);

  const handleSaveApiConfig = async () => {
    // Refresh models after saving
    await refreshModels();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion title="Thank You Card Generator" />
      <main className="min-h-0 flex-1">{children}</main>
      <footer
        className="border-border-light flex h-12 shrink-0 items-center justify-between border-t px-6 backdrop-blur"
        style={{ background: "rgba(255, 255, 255, 0.8)" }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsApiDialogOpen(true)}
          className={`flex items-center gap-2 text-xs transition-colors ${
            isApiConfigured
              ? "text-green-600 hover:text-green-700"
              : "text-amber-600 hover:text-amber-700"
          }`}
        >
          {isApiConfigured ? (
            <>
              <FontAwesomeIcon icon={faCheck} className="size-3" />
              <span>OpenRouter</span>
              <span className="text-green-500">•</span>
              <span className="max-w-64 truncate font-medium">
                {models.find((m) => m.id === model)?.name || model}
              </span>
              <FontAwesomeIcon icon={faGear} className="size-3 opacity-50" />
            </>
          ) : (
            <>
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="size-3"
              />
              <span>OpenRouter API not configured</span>
            </>
          )}
        </Button>
        <span className="text-text-muted text-xs">
          {version && `Version ${version}`}
        </span>
      </footer>

      <ApiConfigDialog
        open={isApiDialogOpen}
        onOpenChange={setIsApiDialogOpen}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        model={model}
        onModelChange={setModel}
        models={models}
        isLoadingModels={isLoadingModels}
        onSave={handleSaveApiConfig}
      />
    </div>
  );
}
