import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils/tailwind";
import type { Recipient } from "@/types/recipient";
import { AlertCircle, Check, Circle } from "lucide-react";

interface RecipientSidebarProps {
  recipients: Recipient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getRecipientDisplayName(recipient: Recipient): string {
  const primaryName = [recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(" ");
  const partnerName = [recipient.partnerFirst, recipient.partnerLast]
    .filter(Boolean)
    .join(" ");

  if (primaryName && partnerName) {
    return `${primaryName} & ${partnerName}`;
  }
  return primaryName || "Unnamed";
}

function getStatusIcon(recipient: Recipient) {
  if (recipient.isApproved) {
    return <Check className="size-4 text-green-500" />;
  }
  if (recipient.generatedMessage) {
    return <Circle className="size-4 fill-blue-500 text-blue-500" />;
  }
  return <AlertCircle className="text-muted-foreground size-4" />;
}

export function RecipientSidebar({
  recipients,
  selectedId,
  onSelect,
}: RecipientSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r">
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">Recipients</h2>
        <p className="text-muted-foreground text-xs">
          {recipients.filter((r) => r.isApproved).length} of {recipients.length} approved
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {recipients.map((recipient) => (
            <button
              key={recipient.id}
              onClick={() => onSelect(recipient.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                selectedId === recipient.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              )}
            >
              {getStatusIcon(recipient)}
              <span className="flex-1 truncate">
                {getRecipientDisplayName(recipient)}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
