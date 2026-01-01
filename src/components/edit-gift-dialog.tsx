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
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faArrowRight,
  faDollarSign,
} from "@fortawesome/free-solid-svg-icons";
import { VisuallyHidden } from "radix-ui";

interface EditGiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gift: string;
  giftValue: string;
  onSave: (gift: string, giftValue: string) => void;
}

interface EditGiftDialogContentProps {
  initialGift: string;
  initialGiftValue: string;
  onSave: (gift: string, giftValue: string) => void;
  onClose: () => void;
}

function EditGiftDialogContent({
  initialGift,
  initialGiftValue,
  onSave,
  onClose,
}: EditGiftDialogContentProps) {
  const [localGift, setLocalGift] = useState(initialGift);
  const [localGiftValue, setLocalGiftValue] = useState(
    initialGiftValue.replace(/^\$/, ""),
  );

  const handleSave = () => {
    onSave(localGift, localGiftValue);
    onClose();
  };

  const isValid = localGift.trim().length > 0;

  return (
    <>
      {/* Accessible title and description (visually hidden) */}
      <VisuallyHidden.Root>
        <DialogTitle>Edit Gift</DialogTitle>
        <DialogDescription>
          Edit the gift details for this recipient
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
              icon={faGift}
              className="text-white"
              style={{ fontSize: "24px" }}
            />
          </div>
          {/* Title and description */}
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold text-gray-900">Edit Gift</h2>
            <p className="text-sm text-gray-600">
              Update the gift details for this recipient
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* Gift Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            Gift Description <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={localGift}
            onChange={(e) => setLocalGift(e.target.value)}
            placeholder="e.g., Kitchen Aid Stand Mixer, Gift Card, Cash"
            className="h-12 rounded-xl border-2 border-gray-200 bg-white px-5 text-base placeholder:text-gray-400 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500">
            Describe what the recipient gave you
          </p>
        </div>

        {/* Gift Value Field */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-900">
            Gift Value{" "}
            <span className="text-sm font-normal text-gray-500">
              (optional)
            </span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
              <FontAwesomeIcon
                icon={faDollarSign}
                className="text-gray-400"
                style={{ fontSize: "14px" }}
              />
            </div>
            <Input
              type="text"
              value={localGiftValue}
              onChange={(e) => {
                // Only allow numbers and decimal point
                const value = e.target.value.replace(/[^0-9.]/g, "");
                setLocalGiftValue(value);
              }}
              placeholder="0.00"
              className="h-12 rounded-xl border-2 border-gray-200 bg-white pr-5 pl-10 text-base placeholder:text-gray-400 focus:border-indigo-500"
            />
          </div>
          <p className="text-xs text-gray-500">
            The monetary value of the gift (if known)
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
          onClick={handleSave}
          disabled={!isValid}
          className="h-12 gap-2 rounded-xl px-8 text-base font-semibold text-white"
          style={{
            background: isValid
              ? "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"
              : undefined,
          }}
        >
          Save Changes
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </div>
    </>
  );
}

export function EditGiftDialog({
  open,
  onOpenChange,
  gift,
  giftValue,
  onSave,
}: EditGiftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-lg max-w-[calc(100%-2rem)] overflow-y-auto rounded-3xl p-0 sm:max-w-lg"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {open && (
          <EditGiftDialogContent
            initialGift={gift}
            initialGiftValue={giftValue}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
