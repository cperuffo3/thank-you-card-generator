"use client";

import { useState, useEffect } from "react";
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
import { Copy, Check, ClipboardList } from "lucide-react";
import { useSession, DEFAULT_SIGNOFF_MESSAGE } from "@/context/session-context";

interface CopyFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressTo: string;
  address: string;
  thankYouMessage: string;
}

interface CopyFieldsDialogContentProps {
  addressTo: string;
  address: string;
  thankYouMessage: string;
}

type CopiedField = "addressTo" | "thankYouMessage" | "signoffMessage" | null;

function CopyFieldsDialogContent({
  addressTo,
  address,
  thankYouMessage,
}: CopyFieldsDialogContentProps) {
  const { signoffMessage, setSignoffMessage } = useSession();
  const [localSignoff, setLocalSignoff] = useState(signoffMessage);
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  // Sync local state when signoff message changes externally
  useEffect(() => {
    setLocalSignoff(signoffMessage);
  }, [signoffMessage]);

  const handleCopy = async (field: CopiedField, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSignoffChange = (value: string) => {
    setLocalSignoff(value);
    setSignoffMessage(value);
  };

  const handleResetSignoff = () => {
    setLocalSignoff(DEFAULT_SIGNOFF_MESSAGE);
    setSignoffMessage(DEFAULT_SIGNOFF_MESSAGE);
  };

  return (
    <>
      {/* Accessible title and description (visually hidden) */}
      <VisuallyHidden.Root>
        <DialogTitle>Copy Message Fields</DialogTitle>
        <DialogDescription>
          Copy individual fields for your thank you card
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
            <ClipboardList className="size-6 text-white" />
          </div>
          {/* Title and description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-gray-900">
              Copy Message Fields
            </h2>
            <p className="text-sm text-gray-600">
              Copy each field individually for your card software
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* Address To Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            Address To
          </label>
          <div className="flex items-stretch gap-2">
            <div className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-700">{addressTo || "—"}</p>
            </div>
            <Button
              onClick={() => handleCopy("addressTo", addressTo)}
              disabled={!addressTo}
              className={`h-auto shrink-0 rounded-xl px-4 ${
                copiedField === "addressTo"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {copiedField === "addressTo" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Address Field (display only, for validation) */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            Address
          </label>
          <div className="flex items-stretch gap-2">
            <div className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm whitespace-pre-wrap text-gray-700">
                {address || "—"}
              </p>
            </div>
            {/* Invisible placeholder to match button width */}
            <div className="w-13 shrink-0" />
          </div>
        </div>

        {/* Thank You Message Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            Thank You Message
          </label>
          <div className="flex items-stretch gap-2">
            <div className="max-h-48 flex-1 overflow-y-auto rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                {thankYouMessage || "—"}
              </p>
            </div>
            <Button
              onClick={() => handleCopy("thankYouMessage", "\n" + thankYouMessage)}
              disabled={!thankYouMessage}
              className={`h-auto shrink-0 rounded-xl px-4 ${
                copiedField === "thankYouMessage"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {copiedField === "thankYouMessage" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Signoff Message Field */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-900">
              Signoff Message
            </label>
            {localSignoff !== DEFAULT_SIGNOFF_MESSAGE && (
              <button
                onClick={handleResetSignoff}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Reset to default
              </button>
            )}
          </div>
          <div className="flex items-stretch gap-2">
            <Textarea
              value={localSignoff}
              onChange={(e) => handleSignoffChange(e.target.value)}
              placeholder="e.g., With love and gratitude, John & Jane"
              className="min-h-20 flex-1 resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500/30"
            />
            <Button
              onClick={() => handleCopy("signoffMessage", localSignoff)}
              disabled={!localSignoff}
              className={`h-auto shrink-0 rounded-xl px-4 ${
                copiedField === "signoffMessage"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {copiedField === "signoffMessage" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            This signoff is shared across all letters. Edit here to change it
            for all recipients.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-gray-100 px-8 py-6">
        <DialogClose asChild>
          <Button
            variant="ghost"
            className="h-12 px-6 text-base font-semibold text-gray-700"
          >
            Close
          </Button>
        </DialogClose>
      </div>
    </>
  );
}

export function CopyFieldsDialog({
  open,
  onOpenChange,
  addressTo,
  address,
  thankYouMessage,
}: CopyFieldsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-2xl max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-0 sm:max-w-2xl"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {open && (
          <CopyFieldsDialogContent
            addressTo={addressTo}
            address={address}
            thankYouMessage={thankYouMessage}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
