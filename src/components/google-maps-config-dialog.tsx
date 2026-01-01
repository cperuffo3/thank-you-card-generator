"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ExternalLink from "@/components/external-link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapLocationDot,
  faEye,
  faEyeSlash,
  faPaste,
  faXmark,
  faCircleInfo,
  faLightbulb,
  faArrowRight,
  faSpinner,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/utils/tailwind";
import { VisuallyHidden } from "radix-ui";
import {
  verifyGoogleMapsApiKeyDetailed,
  type ApiKeyValidationResult,
} from "@/services/address-validation";

interface GoogleMapsConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onSave: () => void;
}

interface GoogleMapsConfigDialogContentProps {
  initialApiKey: string;
  onApiKeyChange: (key: string) => void;
  onSave: () => void;
  onClose: () => void;
}

type ApiKeyStatus = "idle" | "verifying" | "valid" | "partial" | "invalid";

function GoogleMapsConfigDialogContent({
  initialApiKey,
  onApiKeyChange,
  onSave,
  onClose,
}: GoogleMapsConfigDialogContentProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(initialApiKey);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>(
    initialApiKey ? "valid" : "idle"
  );
  const [validationResult, setValidationResult] =
    useState<ApiKeyValidationResult | null>(null);

  const verifyApiKey = useCallback(async (key: string) => {
    if (!key || key.length < 30) {
      setApiKeyStatus("idle");
      setValidationResult(null);
      return;
    }

    setApiKeyStatus("verifying");
    setValidationResult(null);

    try {
      const result = await verifyGoogleMapsApiKeyDetailed(key);
      setValidationResult(result);

      if (result.isValid) {
        setApiKeyStatus("valid");
      } else if (
        result.addressValidationApi.enabled ||
        result.placesApi.enabled
      ) {
        // At least one API works
        setApiKeyStatus("partial");
      } else {
        setApiKeyStatus("invalid");
      }
    } catch {
      setApiKeyStatus("invalid");
      setValidationResult(null);
    }
  }, []);

  const handlePasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLocalApiKey(text);
      verifyApiKey(text);
    } catch {
      // Clipboard access denied
    }
  };

  const handleClearApiKey = () => {
    setLocalApiKey("");
    setApiKeyStatus("idle");
    setValidationResult(null);
    onApiKeyChange("");
  };

  const handleApiKeyChange = (value: string) => {
    setLocalApiKey(value);
    // Auto-verify when it looks like a complete key
    if (value.startsWith("AIza") && value.length >= 39) {
      verifyApiKey(value);
    } else {
      setApiKeyStatus("idle");
    }
  };

  const handleSave = () => {
    onApiKeyChange(localApiKey);
    onSave();
    onClose();
  };

  const isApiKeyVerified = apiKeyStatus === "valid";
  const isValid = isApiKeyVerified;

  return (
    <>
      {/* Accessible title and description (visually hidden) */}
      <VisuallyHidden.Root>
        <DialogTitle>Google Maps Configuration</DialogTitle>
        <DialogDescription>
          Configure your Google Maps API key for address validation
        </DialogDescription>
      </VisuallyHidden.Root>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 px-8 pt-8 pb-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <FontAwesomeIcon
              icon={faMapLocationDot}
              className="text-white"
              style={{ fontSize: "24px" }}
            />
          </div>
          {/* Title and description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-gray-900">
              Address Validation
            </h2>
            <p className="text-sm text-gray-600">
              Configure Google Maps API for address validation
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* API Key Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            Google Maps API Key <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              value={localApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="AIzaSy..."
              className={cn(
                "h-12 rounded-xl border-2 bg-white px-5 pr-28 font-mono text-base placeholder:text-gray-400",
                apiKeyStatus === "valid" && "border-green-500",
                (apiKeyStatus === "invalid" || apiKeyStatus === "partial") &&
                  "border-red-500",
                apiKeyStatus === "idle" && "border-gray-200",
                apiKeyStatus === "verifying" && "border-blue-500"
              )}
            />
            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
              {/* Status indicator */}
              {apiKeyStatus === "verifying" && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="size-4 animate-spin text-blue-500"
                />
              )}
              {apiKeyStatus === "valid" && (
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="size-4 text-green-500"
                />
              )}
              {(apiKeyStatus === "invalid" || apiKeyStatus === "partial") && (
                <FontAwesomeIcon
                  icon={faCircleXmark}
                  className="size-4 text-red-500"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
                className="size-10 rounded-lg"
              >
                <FontAwesomeIcon
                  icon={showApiKey ? faEyeSlash : faEye}
                  className="text-gray-500"
                />
              </Button>
              {localApiKey ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearApiKey}
                  className="size-10 rounded-lg"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-gray-500" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePasteApiKey}
                  className="size-10 rounded-lg"
                >
                  <FontAwesomeIcon icon={faPaste} className="text-gray-500" />
                </Button>
              )}
            </div>
          </div>
          {/* Help text / Status message */}
          <div className="flex flex-col gap-2">
            {apiKeyStatus === "invalid" || apiKeyStatus === "partial" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faCircleXmark}
                    className="text-red-500"
                    style={{ fontSize: "14px" }}
                  />
                  <span className="text-sm font-medium text-red-600">
                    {apiKeyStatus === "partial"
                      ? "Some required APIs are not enabled"
                      : "API key validation failed"}
                  </span>
                </div>
                {/* Per-API status */}
                {validationResult && (
                  <div className="ml-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={
                          validationResult.addressValidationApi.enabled
                            ? faCircleCheck
                            : faCircleXmark
                        }
                        className={
                          validationResult.addressValidationApi.enabled
                            ? "text-green-500"
                            : "text-red-500"
                        }
                        style={{ fontSize: "12px" }}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          validationResult.addressValidationApi.enabled
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        Address Validation API
                        {!validationResult.addressValidationApi.enabled &&
                          validationResult.addressValidationApi.error &&
                          `: ${validationResult.addressValidationApi.error}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={
                          validationResult.placesApi.enabled
                            ? faCircleCheck
                            : faCircleXmark
                        }
                        className={
                          validationResult.placesApi.enabled
                            ? "text-green-500"
                            : "text-red-500"
                        }
                        style={{ fontSize: "12px" }}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          validationResult.placesApi.enabled
                            ? "text-green-600"
                            : "text-red-600"
                        )}
                      >
                        Places API (New)
                        {!validationResult.placesApi.enabled &&
                          validationResult.placesApi.error &&
                          `: ${validationResult.placesApi.error}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : apiKeyStatus === "valid" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="text-green-500"
                    style={{ fontSize: "14px" }}
                  />
                  <span className="text-sm font-medium text-green-600">
                    API key verified successfully!
                  </span>
                </div>
                {/* Per-API status */}
                <div className="ml-5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="text-green-500"
                      style={{ fontSize: "12px" }}
                    />
                    <span className="text-xs text-green-600">
                      Address Validation API
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="text-green-500"
                      style={{ fontSize: "12px" }}
                    />
                    <span className="text-xs text-green-600">
                      Places API (New)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className="text-blue-500"
                  style={{ fontSize: "14px" }}
                />
                <span className="text-sm text-gray-600">Get your API key at </span>
                <ExternalLink
                  href="https://console.cloud.google.com/apis/credentials"
                  className="text-sm font-semibold text-blue-500 no-underline hover:text-blue-600"
                >
                  Google Cloud Console
                </ExternalLink>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div
          className="flex flex-col gap-4 rounded-2xl p-6"
          style={{
            background:
              "linear-gradient(149deg, rgba(239, 246, 255, 1) 0%, rgba(243, 250, 247, 1) 100%)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faLightbulb}
              className="text-amber-500"
              style={{ fontSize: "14px" }}
            />
            <span className="text-sm font-semibold text-gray-900">
              Setup Instructions
            </span>
          </div>

          {/* Instructions */}
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600">
            <li>
              Go to the{" "}
              <ExternalLink
                href="https://console.cloud.google.com/apis/credentials"
                className="font-medium text-blue-500 hover:text-blue-600"
              >
                Google Cloud Console
              </ExternalLink>
            </li>
            <li>Create a new project or select an existing one</li>
            <li>
              Enable the following APIs:
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>
                  <ExternalLink
                    href="https://console.cloud.google.com/apis/library/addressvalidation.googleapis.com"
                    className="font-medium text-blue-500 hover:text-blue-600"
                  >
                    Address Validation API
                  </ExternalLink>{" "}
                  (for validating addresses)
                </li>
                <li>
                  <ExternalLink
                    href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
                    className="font-medium text-blue-500 hover:text-blue-600"
                  >
                    Places API (New)
                  </ExternalLink>{" "}
                  (for address autocomplete)
                </li>
              </ul>
            </li>
            <li>Create an API key and paste it above</li>
          </ol>

          {/* Pricing note */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs leading-5 text-gray-500">
              <strong>Pricing:</strong> Address Validation API costs $0.017 per
              validation (first $200/month free). For 50 recipients, expect ~$0.85.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-8 py-6">
        <DialogClose asChild>
          <Button
            variant="ghost"
            className="h-12 px-6 text-base font-semibold text-gray-700"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          onClick={handleSave}
          disabled={!isValid}
          className="h-12 gap-2 rounded-xl px-8 text-base font-semibold text-white"
          style={{
            background: isValid
              ? "linear-gradient(90deg, #4285F4 0%, #34A853 100%)"
              : undefined,
          }}
        >
          Save & Continue
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </div>
    </>
  );
}

export function GoogleMapsConfigDialog({
  open,
  onOpenChange,
  apiKey,
  onApiKeyChange,
  onSave,
}: GoogleMapsConfigDialogProps) {
  // Prevent auto-focus when API key is already present
  const handleOpenAutoFocus = (e: Event) => {
    if (apiKey) {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-2xl max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-0 sm:max-w-2xl"
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        {open && (
          <GoogleMapsConfigDialogContent
            initialApiKey={apiKey}
            onApiKeyChange={onApiKeyChange}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
