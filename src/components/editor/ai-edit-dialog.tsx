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
import { Wand2, Sparkles } from "lucide-react";

interface AIEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMessage: string;
  onGenerate: (modificationRequest: string) => void;
}

interface AIEditDialogContentProps {
  currentMessage: string;
  onGenerate: (modificationRequest: string) => void;
  onClose: () => void;
}

function AIEditDialogContent({
  currentMessage,
  onGenerate,
  onClose,
}: AIEditDialogContentProps) {
  const [modificationRequest, setModificationRequest] = useState("");

  const handleGenerate = () => {
    if (modificationRequest.trim()) {
      onGenerate(modificationRequest.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const isValid = modificationRequest.trim().length > 0;

  return (
    <>
      {/* Accessible title and description (visually hidden) */}
      <VisuallyHidden.Root>
        <DialogTitle>Edit with AI</DialogTitle>
        <DialogDescription>
          Provide additional context to modify the generated message
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
            <Wand2 className="size-6 text-white" />
          </div>
          {/* Title and description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-gray-900">Edit with AI</h2>
            <p className="text-sm text-gray-600">
              Describe how you'd like to modify the message
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* Current Message Display */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            Current Message
          </label>
          <div className="max-h-48 overflow-y-auto rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {currentMessage}
            </p>
          </div>
        </div>

        {/* Modification Request Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            How would you like to modify it?{" "}
            <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={modificationRequest}
            onChange={(e) => setModificationRequest(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Make it more formal, add a mention of the beautiful vase, make it shorter..."
            className="min-h-32 resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500/30"
            autoFocus
          />
          <p className="text-xs text-gray-500">
            Press{" "}
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              Enter
            </kbd>{" "}
            to generate
          </p>
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
          onClick={handleGenerate}
          disabled={!isValid}
          className="h-12 gap-2 rounded-xl px-8 text-base font-semibold text-white"
          style={{
            background: isValid
              ? "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"
              : undefined,
          }}
        >
          <Sparkles className="size-4" />
          Generate
        </Button>
      </div>
    </>
  );
}

export function AIEditDialog({
  open,
  onOpenChange,
  currentMessage,
  onGenerate,
}: AIEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-2xl max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-0 sm:max-w-2xl"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {open && (
          <AIEditDialogContent
            currentMessage={currentMessage}
            onGenerate={onGenerate}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
