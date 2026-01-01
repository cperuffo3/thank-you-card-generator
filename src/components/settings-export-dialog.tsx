"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk,
  faFileExport,
  faFileImport,
  faArrowRight,
  faCircleCheck,
  faCircleXmark,
  faShieldHalved,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { VisuallyHidden } from "radix-ui";
import { saveCardFile, loadCardFile } from "@/actions/file";
import {
  createCardFileData,
  encryptCardFile,
  decryptCardFile,
  extractSettings,
} from "@/utils/card-crypto";

interface SettingsExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Current settings to export
  openRouterApiKey: string;
  model: string;
  googleMapsApiKey: string;
  systemPrompt: string;
  userPromptTemplate: string;
  // Callbacks for importing
  onImport: (settings: {
    openRouterApiKey: string;
    model: string;
    googleMapsApiKey: string;
    systemPrompt: string;
    userPromptTemplate: string;
  }) => void;
}

type Status = "idle" | "exporting" | "exported" | "importing" | "imported" | "error";

interface SettingsExportDialogContentProps {
  openRouterApiKey: string;
  model: string;
  googleMapsApiKey: string;
  systemPrompt: string;
  userPromptTemplate: string;
  onImport: SettingsExportDialogProps["onImport"];
  onClose: () => void;
}

function SettingsExportDialogContent({
  openRouterApiKey,
  model,
  googleMapsApiKey,
  systemPrompt,
  userPromptTemplate,
  onImport,
  onClose,
}: SettingsExportDialogContentProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const handleExport = async () => {
    try {
      setStatus("exporting");
      setMessage("");

      // Create card file data with settings only (no recipients)
      const cardData = createCardFileData({
        openRouterApiKey,
        model,
        googleMapsApiKey,
        systemPrompt,
        userPromptTemplate,
      }, false); // false = don't include recipients

      const encryptedData = await encryptCardFile(cardData);
      const result = await saveCardFile(encryptedData, true); // Always show save dialog

      if (result.success) {
        setStatus("exported");
        setMessage(`Settings exported to ${result.filePath}`);
      } else if ("canceled" in result && result.canceled) {
        setStatus("idle");
      } else {
        setStatus("error");
        setMessage("Failed to export settings");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Export failed");
    }
  };

  const handleImport = async () => {
    try {
      setStatus("importing");
      setMessage("");

      const result = await loadCardFile();

      if (result.success && result.encryptedData) {
        const cardData = await decryptCardFile(result.encryptedData);
        const settings = extractSettings(cardData);

        onImport({
          openRouterApiKey: settings.openRouterApiKey,
          model: settings.model,
          googleMapsApiKey: settings.googleMapsApiKey,
          systemPrompt: settings.systemPrompt,
          userPromptTemplate: settings.userPromptTemplate,
        });

        setStatus("imported");
        setMessage("Settings imported successfully!");
      } else if ("canceled" in result && result.canceled) {
        setStatus("idle");
      } else {
        setStatus("error");
        setMessage("Failed to load settings file");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Import failed");
    }
  };

  const canExport =
    openRouterApiKey.length > 0 || googleMapsApiKey.length > 0;

  return (
    <>
      {/* Accessible title and description (visually hidden) */}
      <VisuallyHidden.Root>
        <DialogTitle>Export/Import Settings</DialogTitle>
        <DialogDescription>
          Export or import your application settings
        </DialogDescription>
      </VisuallyHidden.Root>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 px-8 pt-8 pb-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <FontAwesomeIcon
              icon={faFloppyDisk}
              className="text-white"
              style={{ fontSize: "24px" }}
            />
          </div>
          {/* Title and description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-gray-900">
              Export / Import Settings
            </h2>
            <p className="text-sm text-gray-600">
              Share your API keys and prompts with others
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* Status message */}
        {message && (
          <div
            className={`flex items-center gap-3 rounded-xl p-4 ${
              status === "error"
                ? "bg-red-50 text-red-700"
                : status === "exported" || status === "imported"
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-700"
            }`}
          >
            <FontAwesomeIcon
              icon={
                status === "error"
                  ? faCircleXmark
                  : status === "exported" || status === "imported"
                    ? faCircleCheck
                    : faInfoCircle
              }
              className="size-4"
            />
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Export Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Export Settings
          </h3>
          <p className="text-sm text-gray-600">
            Save your current settings to an encrypted file that can be shared
            with others.
          </p>
          <Button
            onClick={handleExport}
            disabled={!canExport || status === "exporting"}
            className="h-12 gap-2 rounded-xl text-base font-semibold"
            style={{
              background: canExport
                ? "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"
                : undefined,
            }}
          >
            <FontAwesomeIcon icon={faFileExport} />
            {status === "exporting" ? "Exporting..." : "Export Settings"}
          </Button>
          {!canExport && (
            <p className="text-xs text-amber-600">
              No API keys configured to export
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Import Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Import Settings
          </h3>
          <p className="text-sm text-gray-600">
            Load settings from an encrypted file shared by someone else.
          </p>
          <Button
            onClick={handleImport}
            disabled={status === "importing"}
            variant="outline"
            className="h-12 gap-2 rounded-xl border-2 text-base font-semibold"
          >
            <FontAwesomeIcon icon={faFileImport} />
            {status === "importing" ? "Importing..." : "Import Settings"}
          </Button>
        </div>

        {/* Security Note */}
        <div
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{
            background:
              "linear-gradient(149deg, rgba(250, 245, 255, 1) 0%, rgba(239, 246, 255, 1) 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faShieldHalved}
              className="text-indigo-600"
              style={{ fontSize: "14px" }}
            />
            <span className="text-sm font-semibold text-gray-900">
              Security Note
            </span>
          </div>
          <p className="text-xs leading-5 text-gray-600">
            Settings files are encrypted for basic protection. However, only
            share them with trusted individuals as they contain your API keys.
            Anyone with the file can access the stored credentials.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-gray-100 px-8 py-6">
        <DialogClose asChild>
          <Button
            onClick={onClose}
            className="h-12 gap-2 rounded-xl px-8 text-base font-semibold"
          >
            Done
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </DialogClose>
      </div>
    </>
  );
}

export function SettingsExportDialog({
  open,
  onOpenChange,
  openRouterApiKey,
  model,
  googleMapsApiKey,
  systemPrompt,
  userPromptTemplate,
  onImport,
}: SettingsExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-2xl max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-0 sm:max-w-2xl"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {open && (
          <SettingsExportDialogContent
            openRouterApiKey={openRouterApiKey}
            model={model}
            googleMapsApiKey={googleMapsApiKey}
            systemPrompt={systemPrompt}
            userPromptTemplate={userPromptTemplate}
            onImport={onImport}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
