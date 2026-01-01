"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import ExternalLink from "@/components/external-link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faEye,
  faEyeSlash,
  faPaste,
  faXmark,
  faCircleInfo,
  faLightbulb,
  faChartColumn,
  faArrowRight,
  faChevronDown,
  faCheck,
  faSpinner,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/utils/tailwind";
import { VisuallyHidden } from "radix-ui";
import type { OpenRouterModel } from "@/services/openrouter";
import { fetchAvailableModels } from "@/services/openrouter";

// Recommended models to highlight in the comparison section
const RECOMMENDED_MODELS = [
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    color: "#22c55e", // green
    recommended: true,
    description: "Fast & Affordable",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    color: "#3b82f6", // blue
    recommended: false,
    description: "Balanced Performance",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    color: "#a855f7", // purple
    recommended: false,
    description: "High Quality",
  },
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    color: "#f97316", // orange
    recommended: false,
    description: "Latest GPT",
  },
];

interface ApiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  models: OpenRouterModel[];
  isLoadingModels: boolean;
  onSave: () => void;
}

interface ApiConfigDialogContentProps {
  initialApiKey: string;
  initialModel: string;
  onApiKeyChange: (key: string) => void;
  onModelChange: (model: string) => void;
  models: OpenRouterModel[];
  isLoadingModels: boolean;
  onSave: () => void;
  onClose: () => void;
}

type ApiKeyStatus = "idle" | "verifying" | "valid" | "invalid";

function ApiConfigDialogContent({
  initialApiKey,
  initialModel,
  onApiKeyChange,
  onModelChange,
  models: externalModels,
  isLoadingModels: externalIsLoading,
  onSave,
  onClose,
}: ApiConfigDialogContentProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(initialApiKey);
  const [localModel, setLocalModel] = useState(initialModel);
  const [modelSearchOpen, setModelSearchOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>(
    initialApiKey ? "valid" : "idle",
  );
  const [localModels, setLocalModels] =
    useState<OpenRouterModel[]>(externalModels);
  const [isVerifying, setIsVerifying] = useState(false);

  // Use local models if we've verified, otherwise use external
  const models = apiKeyStatus === "valid" ? localModels : externalModels;
  const isLoadingModels = isVerifying || externalIsLoading;

  const verifyApiKey = useCallback(async (key: string, retryCount = 0) => {
    if (!key || !key.startsWith("sk-or-")) {
      setApiKeyStatus("idle");
      return;
    }

    setApiKeyStatus("verifying");
    setIsVerifying(true);

    try {
      const fetchedModels = await fetchAvailableModels(key);
      if (fetchedModels.length > 0) {
        // Check if recommended models have pricing
        const recommendedWithPricing = RECOMMENDED_MODELS.filter((rec) => {
          const model = fetchedModels.find((m) => m.id === rec.id);
          return model?.pricing;
        });

        // If no recommended models have pricing and we haven't retried too many times, retry
        if (recommendedWithPricing.length === 0 && retryCount < 2) {
          // Wait a bit and retry
          setTimeout(() => verifyApiKey(key, retryCount + 1), 1000);
          return;
        }

        setApiKeyStatus("valid");
        setLocalModels(fetchedModels);
      } else {
        setApiKeyStatus("invalid");
      }
    } catch {
      setApiKeyStatus("invalid");
    } finally {
      if (retryCount === 0 || retryCount >= 2) {
        setIsVerifying(false);
      }
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
    setLocalModels(externalModels);
    setModelSearchQuery("");
    // Also clear from app memory/localStorage
    onApiKeyChange("");
  };

  const handleApiKeyChange = (value: string) => {
    setLocalApiKey(value);
    // Auto-verify when it looks like a complete key
    if (value.startsWith("sk-or-") && value.length > 20) {
      verifyApiKey(value);
    } else {
      setApiKeyStatus("idle");
    }
  };

  const handleSave = () => {
    onApiKeyChange(localApiKey);
    onModelChange(localModel);
    onSave();
    onClose();
  };

  const handleSelectRecommendedModel = (modelId: string) => {
    setLocalModel(modelId);
  };

  // Limit displayed models for performance - show more when searching
  const displayedModels = useMemo(() => {
    const MAX_INITIAL_MODELS = 50;
    const query = modelSearchQuery.toLowerCase().trim();

    if (query) {
      // When searching, filter and show all matches (cmdk handles the filtering too)
      return models.filter(
        (m) =>
          m.id.toLowerCase().includes(query) ||
          m.name.toLowerCase().includes(query),
      );
    }

    // When not searching, show limited models but prioritize:
    // 1. Currently selected model
    // 2. Recommended models
    // 3. First N models alphabetically
    const recommendedIds = new Set(RECOMMENDED_MODELS.map((r) => r.id));
    const priorityModels: OpenRouterModel[] = [];
    const otherModels: OpenRouterModel[] = [];

    for (const m of models) {
      if (m.id === localModel || recommendedIds.has(m.id)) {
        priorityModels.push(m);
      } else {
        otherModels.push(m);
      }
    }

    const result = [
      ...priorityModels,
      ...otherModels.slice(0, MAX_INITIAL_MODELS - priorityModels.length),
    ];

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [models, modelSearchQuery, localModel]);

  // Get the currently selected model details
  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === localModel);
  }, [models, localModel]);

  // Get the display name for the selected model
  const selectedModelDisplay = useMemo(() => {
    if (selectedModel) {
      // Check if it's a recommended model
      const recommended = RECOMMENDED_MODELS.find((m) => m.id === localModel);
      if (recommended?.recommended) {
        return `${selectedModel.name} (Recommended - ${recommended.description})`;
      }
      return selectedModel.name;
    }
    // If model not found, show the ID
    return localModel || "Select a model...";
  }, [selectedModel, localModel]);

  // Format pricing as cost per 1M tokens (average of prompt and completion)
  const formatModelPricing = (modelId: string): string => {
    const modelData = models.find((m) => m.id === modelId);
    if (!modelData?.pricing) return "N/A";

    // Pricing is per token, convert to per 1M tokens
    const promptPrice = parseFloat(modelData.pricing.prompt) || 0;
    const completionPrice = parseFloat(modelData.pricing.completion) || 0;

    // Calculate average cost per 1M tokens (prompt + completion averaged)
    const avgPricePerMillion =
      ((promptPrice + completionPrice) / 2) * 1_000_000;

    if (avgPricePerMillion < 0.01) {
      return `$${avgPricePerMillion.toFixed(4)} / 1M tokens`;
    } else if (avgPricePerMillion < 1) {
      return `$${avgPricePerMillion.toFixed(2)} / 1M tokens`;
    } else {
      return `$${avgPricePerMillion.toFixed(2)} / 1M tokens`;
    }
  };

  const isApiKeyVerified = apiKeyStatus === "valid";
  const isValid = isApiKeyVerified && localModel.trim().length > 0;

  return (
    <>
      {/* Accessible title and description (visually hidden) */}
      <VisuallyHidden.Root>
        <DialogTitle>API Configuration</DialogTitle>
        <DialogDescription>
          Configure your OpenRouter API settings to start generating messages
        </DialogDescription>
      </VisuallyHidden.Root>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 px-8 pt-8 pb-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <FontAwesomeIcon
              icon={faGear}
              className="text-white"
              style={{ fontSize: "24px" }}
            />
          </div>
          {/* Title and description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-gray-900">
              API Configuration
            </h2>
            <p className="text-sm text-gray-600">
              Configure your OpenRouter API settings to start generating
              messages
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* API Key Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            OpenRouter API Key <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              value={localApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxx"
              className={cn(
                "h-12 rounded-xl border-2 bg-white px-5 pr-28 font-mono text-base placeholder:text-gray-400",
                apiKeyStatus === "valid" && "border-green-500",
                apiKeyStatus === "invalid" && "border-red-500",
                apiKeyStatus === "idle" && "border-gray-200",
                apiKeyStatus === "verifying" && "border-indigo-500",
              )}
            />
            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
              {/* Status indicator */}
              {apiKeyStatus === "verifying" && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="size-4 animate-spin text-indigo-500"
                />
              )}
              {apiKeyStatus === "valid" && (
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="size-4 text-green-500"
                />
              )}
              {apiKeyStatus === "invalid" && (
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
          <div className="flex items-center gap-2">
            {apiKeyStatus === "invalid" ? (
              <>
                <FontAwesomeIcon
                  icon={faCircleXmark}
                  className="text-red-500"
                  style={{ fontSize: "14px" }}
                />
                <span className="text-sm text-red-600">
                  Invalid API key. Please check and try again.
                </span>
              </>
            ) : apiKeyStatus === "valid" ? (
              <>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-green-500"
                  style={{ fontSize: "14px" }}
                />
                <span className="text-sm text-green-600">
                  API key verified successfully!
                </span>
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className="text-indigo-500"
                  style={{ fontSize: "14px" }}
                />
                <span className="text-sm text-gray-600">
                  Get your API key at{" "}
                </span>
                <ExternalLink
                  href="https://openrouter.ai/keys"
                  className="text-sm font-semibold text-indigo-500 no-underline hover:text-indigo-600"
                >
                  openrouter.ai/keys
                </ExternalLink>
              </>
            )}
          </div>
        </div>

        {/* Model section - only show when API key is verified */}
        {isApiKeyVerified && (
          <>
            {/* Model Selector */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-900">
                AI Model <span className="text-red-500">*</span>
              </label>
              <Popover open={modelSearchOpen} onOpenChange={setModelSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelSearchOpen}
                    className="h-12 w-full justify-between rounded-xl border-2 border-gray-200 bg-white px-5 text-base font-normal hover:bg-white"
                  >
                    <span className={cn(!localModel && "text-gray-400")}>
                      {selectedModelDisplay}
                    </span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="text-gray-400"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-152 p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search models..."
                      value={modelSearchQuery}
                      onValueChange={setModelSearchQuery}
                    />
                    <CommandList className="max-h-75">
                      <CommandEmpty>
                        {isLoadingModels
                          ? "Loading models..."
                          : "No models found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {displayedModels.map((m) => (
                          <CommandItem
                            key={m.id}
                            value={`${m.id} ${m.name}`}
                            onSelect={() => {
                              setLocalModel(m.id);
                              setModelSearchOpen(false);
                              setModelSearchQuery("");
                            }}
                            data-checked={localModel === m.id}
                          >
                            <span className="flex-1">{m.name}</span>
                            {localModel === m.id && (
                              <FontAwesomeIcon
                                icon={faCheck}
                                className="text-indigo-500"
                              />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Model Comparison Section */}
            <div
              className="flex flex-col gap-4 rounded-2xl p-6"
              style={{
                background:
                  "linear-gradient(149deg, rgba(250, 245, 255, 1) 0%, rgba(239, 246, 255, 1) 100%)",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faChartColumn}
                  className="text-gray-900"
                  style={{ fontSize: "14px" }}
                />
                <span className="text-sm font-semibold text-gray-900">
                  Model Comparison
                </span>
              </div>

              {/* Model cards */}
              <div className="flex flex-col gap-3">
                {RECOMMENDED_MODELS.map((recModel) => (
                  <button
                    key={recModel.id}
                    type="button"
                    onClick={() => handleSelectRecommendedModel(recModel.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm transition-all hover:shadow-md",
                      localModel === recModel.id && "ring-2 ring-indigo-500",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-2 rounded-full"
                        style={{ backgroundColor: recModel.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {recModel.name}
                      </span>
                      {recModel.recommended && (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Recommended
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatModelPricing(recModel.id)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Info text */}
              <div className="flex items-start gap-2 border-t border-gray-200 pt-4">
                <FontAwesomeIcon
                  icon={faLightbulb}
                  className="mt-0.5 text-amber-500"
                  style={{ fontSize: "14px" }}
                />
                <p className="text-xs leading-5 text-gray-600">
                  For typical thank you cards (100-200 tokens each), Gemini 3
                  Flash Preview offers the best balance of quality and cost.
                  Expect to spend approximately $0.01-0.02 for 50 cards.
                </p>
              </div>
            </div>
          </>
        )}
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
              ? "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"
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

export function ApiConfigDialog({
  open,
  onOpenChange,
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
  models,
  isLoadingModels,
  onSave,
}: ApiConfigDialogProps) {
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
          <ApiConfigDialogContent
            initialApiKey={apiKey}
            initialModel={model}
            onApiKeyChange={onApiKeyChange}
            onModelChange={onModelChange}
            models={models}
            isLoadingModels={isLoadingModels}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
