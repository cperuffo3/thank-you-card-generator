import { cn } from "@/utils/tailwind";
import type { Recipient } from "@/types/recipient";
import { AlertTriangle, FileText, Check, Gift, Home } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorSidebarCardProps {
  recipient: Recipient;
  isSelected: boolean;
  onClick: () => void;
}

function getRecipientDisplayName(recipient: Recipient): string {
  const lastName = recipient.lastName || recipient.partnerLast;
  const firstName = recipient.firstName || recipient.partnerFirst;

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }
  return lastName || firstName || "Unnamed";
}

type RecipientStatus = "approved" | "draft" | "none";

function getRecipientStatus(recipient: Recipient): RecipientStatus {
  if (recipient.isApproved) {
    return "approved";
  }
  if (recipient.generatedMessage) {
    return "draft";
  }
  return "none";
}

function getStatusText(status: RecipientStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "draft":
      return "Draft pending approval";
    case "none":
      return "No message generated";
  }
}

function StatusIcon({ status }: { status: RecipientStatus }) {
  switch (status) {
    case "approved":
      return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50">
          <Check className="size-3.5 text-green-600" />
        </div>
      );
    case "draft":
      return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <FileText className="size-3 text-blue-600" />
        </div>
      );
    case "none":
      return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="size-3.5 text-amber-600" />
        </div>
      );
  }
}

function hasGiftInfo(recipient: Recipient): boolean {
  return Boolean(recipient.gift?.trim());
}

function hasAddressInfo(recipient: Recipient): boolean {
  return Boolean(
    recipient.address1?.trim() &&
    recipient.city?.trim() &&
    recipient.state?.trim() &&
    recipient.zip?.trim(),
  );
}

function hasInvalidAddress(recipient: Recipient): boolean {
  return recipient.addressValidated === false;
}

function WarningIcons({ recipient }: { recipient: Recipient }) {
  const missingGift = !hasGiftInfo(recipient);
  const missingAddress = !hasAddressInfo(recipient);
  const invalidAddress = hasInvalidAddress(recipient);

  if (!missingGift && !missingAddress && !invalidAddress) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-row items-center gap-1.5">
      {missingGift && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Gift className="size-4 text-amber-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>No gift information</TooltipContent>
        </Tooltip>
      )}
      {invalidAddress ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Home className="size-4 text-amber-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Invalid address - verification failed</TooltipContent>
        </Tooltip>
      ) : missingAddress ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Home className="size-4 text-red-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>No address information</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function EditorSidebarCard({
  recipient,
  isSelected,
  onClick,
}: EditorSidebarCardProps) {
  const status = getRecipientStatus(recipient);
  const displayName = getRecipientDisplayName(recipient);
  const statusText = getStatusText(status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors",
        isSelected
          ? "border-l-4 border-indigo-500 bg-indigo-500/5 pl-4"
          : "hover:bg-gray-50",
      )}
    >
      <StatusIcon status={status} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            isSelected
              ? "font-semibold text-gray-900"
              : "font-medium text-gray-900",
          )}
        >
          {displayName}
        </p>
        <p
          className={cn(
            "text-xs",
            status === "approved"
              ? "font-medium text-green-600"
              : "text-gray-500",
          )}
        >
          {statusText}
        </p>
      </div>
      <WarningIcons recipient={recipient} />
    </button>
  );
}
