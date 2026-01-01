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
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "radix-ui";
import { Cog, RotateCcw, Save } from "lucide-react";
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_USER_PROMPT_TEMPLATE,
} from "@/context/session-context";

interface AIPromptSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemPrompt: string;
  userPromptTemplate: string;
  onSave: (systemPrompt: string, userPromptTemplate: string) => void;
}

interface AIPromptSettingsDialogContentProps {
  systemPrompt: string;
  userPromptTemplate: string;
  onSave: (systemPrompt: string, userPromptTemplate: string) => void;
  onClose: () => void;
}

function AIPromptSettingsDialogContent({
  systemPrompt,
  userPromptTemplate,
  onSave,
  onClose,
}: AIPromptSettingsDialogContentProps) {
  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt);
  const [localUserPromptTemplate, setLocalUserPromptTemplate] =
    useState(userPromptTemplate);

  const handleSave = () => {
    onSave(localSystemPrompt, localUserPromptTemplate);
    onClose();
  };

  const handleReset = () => {
    setLocalSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setLocalUserPromptTemplate(DEFAULT_USER_PROMPT_TEMPLATE);
  };

  const hasChanges =
    localSystemPrompt !== systemPrompt ||
    localUserPromptTemplate !== userPromptTemplate;

  const isDefault =
    localSystemPrompt === DEFAULT_SYSTEM_PROMPT &&
    localUserPromptTemplate === DEFAULT_USER_PROMPT_TEMPLATE;

  return (
    <>
      {/* Accessible title and description (visually hidden) */}
      <VisuallyHidden.Root>
        <DialogTitle>AI Prompt Settings</DialogTitle>
        <DialogDescription>
          Customize the prompts used by the AI to generate thank you messages
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
            <Cog className="size-6 text-white" />
          </div>
          {/* Title and description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-gray-900">
              AI Prompt Settings
            </h2>
            <p className="text-sm text-gray-600">
              Customize how the AI generates thank you messages
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* System Prompt Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            System Prompt
          </label>
          <p className="text-xs text-gray-500">
            Instructions that define the AI's behavior and writing style
          </p>
          <Textarea
            value={localSystemPrompt}
            onChange={(e) => setLocalSystemPrompt(e.target.value)}
            placeholder="Enter the system prompt..."
            className="h-40 resize-none overflow-y-auto rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500/30"
          />
        </div>

        {/* User Prompt Template Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            User Prompt Template
          </label>
          <p className="text-xs text-gray-500">
            Template for each generation request. Use{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              {"{{recipientContext}}"}
            </code>{" "}
            as a placeholder for recipient details.
          </p>
          <Textarea
            value={localUserPromptTemplate}
            onChange={(e) => setLocalUserPromptTemplate(e.target.value)}
            placeholder="Enter the user prompt template..."
            className="min-h-24 resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500/30"
          />
        </div>

        {/* Info Box */}
        <div
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{
            background:
              "linear-gradient(149deg, rgba(238, 242, 255, 1) 0%, rgba(245, 243, 255, 1) 100%)",
          }}
        >
          <p className="text-sm font-semibold text-gray-900">
            Available Placeholders
          </p>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <code className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-xs">
                {"{{recipientContext}}"}
              </code>
              <span>
                Recipient info (name, gift) and any additional context
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            These settings apply globally to all future message generations.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-8 py-6">
        <div className="flex items-center gap-2">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="h-12 px-6 text-base font-semibold text-gray-700"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isDefault}
            className="h-12 gap-2 px-6 text-base font-semibold"
          >
            <RotateCcw className="size-4" />
            Reset to Defaults
          </Button>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="h-12 gap-2 rounded-xl px-8 text-base font-semibold text-white"
          style={{
            background: hasChanges
              ? "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"
              : undefined,
          }}
        >
          <Save className="size-4" />
          Save Changes
        </Button>
      </div>
    </>
  );
}

export function AIPromptSettingsDialog({
  open,
  onOpenChange,
  systemPrompt,
  userPromptTemplate,
  onSave,
}: AIPromptSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-2xl max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-0 sm:max-w-2xl"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {open && (
          <AIPromptSettingsDialogContent
            systemPrompt={systemPrompt}
            userPromptTemplate={userPromptTemplate}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
