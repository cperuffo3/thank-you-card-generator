import React, { useState, useEffect } from "react";
import DragWindowRegion from "@/components/drag-window-region";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faGear,
  faTriangleExclamation,
  faMapLocationDot,
  faHome,
  faFloppyDisk,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { ipc } from "@/ipc/manager";
import { useSession } from "@/context/session-context";
import { ApiConfigDialog } from "@/components/api-config-dialog";
import { GoogleMapsConfigDialog } from "@/components/google-maps-config-dialog";
import { SettingsExportDialog } from "@/components/settings-export-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [version, setVersion] = useState<string>("");
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isGoogleMapsDialogOpen, setIsGoogleMapsDialogOpen] = useState(false);
  const [isSettingsExportDialogOpen, setIsSettingsExportDialogOpen] =
    useState(false);

  const {
    apiKey,
    setApiKey,
    model,
    setModel,
    models,
    isLoadingModels,
    refreshModels,
    isApiConfigured,
    googleMapsApiKey,
    setGoogleMapsApiKey,
    isGoogleMapsConfigured,
    clearSession,
    systemPrompt,
    setSystemPrompt,
    userPromptTemplate,
    setUserPromptTemplate,
  } = useSession();

  const navigate = useNavigate();

  useEffect(() => {
    ipc.client.app.appVersion().then(setVersion);
  }, []);

  const handleSaveApiConfig = async () => {
    // Refresh models after saving
    await refreshModels();
  };

  const handleGoHome = () => {
    clearSession();
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion title="Thank You Card Generator" />
      <main className="min-h-0 flex-1">{children}</main>
      <footer
        className="border-border-light flex h-12 shrink-0 items-center justify-between border-t px-6 backdrop-blur"
        style={{ background: "rgba(255, 255, 255, 0.8)" }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsExportDialogOpen(true)}
            className={`flex items-center gap-1.5 text-xs ${
              isApiConfigured && isGoogleMapsConfigured
                ? "text-text-muted hover:text-foreground"
                : "text-amber-600 hover:text-amber-700"
            }`}
            title={
              isApiConfigured && isGoogleMapsConfigured
                ? "Export/Import Settings"
                : "Import Settings"
            }
          >
            <FontAwesomeIcon
              icon={
                isApiConfigured && isGoogleMapsConfigured
                  ? faFloppyDisk
                  : faDownload
              }
              className="size-3"
            />
          </Button>

          <div className="h-4 w-px bg-gray-300" />

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

          <div className="h-4 w-px bg-gray-300" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsGoogleMapsDialogOpen(true)}
            className={`flex items-center gap-2 text-xs transition-colors ${
              isGoogleMapsConfigured
                ? "text-green-600 hover:text-green-700"
                : "text-amber-600 hover:text-amber-700"
            }`}
          >
            {isGoogleMapsConfigured ? (
              <>
                <FontAwesomeIcon icon={faCheck} className="size-3" />
                <span>Address Validation</span>
                <FontAwesomeIcon
                  icon={faMapLocationDot}
                  className="size-3 opacity-50"
                />
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="size-3"
                />
                <span>Address Validation not configured</span>
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-xs">
            {version && `Version ${version}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoHome}
            className="text-text-muted hover:text-foreground flex items-center gap-1.5 text-xs"
            title="Return to home"
          >
            <FontAwesomeIcon icon={faHome} className="size-3" />
          </Button>
        </div>
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

      <GoogleMapsConfigDialog
        open={isGoogleMapsDialogOpen}
        onOpenChange={setIsGoogleMapsDialogOpen}
        apiKey={googleMapsApiKey}
        onApiKeyChange={setGoogleMapsApiKey}
        onSave={() => {}}
      />

      <SettingsExportDialog
        open={isSettingsExportDialogOpen}
        onOpenChange={setIsSettingsExportDialogOpen}
        openRouterApiKey={apiKey}
        model={model}
        googleMapsApiKey={googleMapsApiKey}
        systemPrompt={systemPrompt}
        userPromptTemplate={userPromptTemplate}
        onImport={(settings) => {
          setApiKey(settings.openRouterApiKey);
          setModel(settings.model);
          setGoogleMapsApiKey(settings.googleMapsApiKey);
          setSystemPrompt(settings.systemPrompt);
          setUserPromptTemplate(settings.userPromptTemplate);
          refreshModels();
        }}
      />
    </div>
  );
}
