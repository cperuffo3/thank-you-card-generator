import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { EditorSidebarCard } from "./editor-sidebar-card";
import { EditorSidebarFooter } from "./editor-sidebar-footer";
import type { Recipient } from "@/types/recipient";
import { Search } from "lucide-react";

interface EditorSidebarProps {
  recipients: Recipient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onExport: () => void;
  onSave: () => void;
  isExporting?: boolean;
  isSaving?: boolean;
}

function getSearchableText(recipient: Recipient): string {
  return [
    recipient.firstName,
    recipient.lastName,
    recipient.partnerFirst,
    recipient.partnerLast,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function EditorSidebar({
  recipients,
  selectedId,
  onSelect,
  onExport,
  onSave,
  isExporting = false,
  isSaving = false,
}: EditorSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) {
      return recipients;
    }
    const query = searchQuery.toLowerCase();
    return recipients.filter((recipient) =>
      getSearchableText(recipient).includes(query),
    );
  }, [recipients, searchQuery]);

  const approvedCount = recipients.filter((r) => r.isApproved).length;
  const totalCount = recipients.length;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Search Header */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Recipients
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search recipients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Recipient List - scrollable */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {filteredRecipients.map((recipient) => (
              <EditorSidebarCard
                key={recipient.id}
                recipient={recipient}
                isSelected={selectedId === recipient.id}
                onClick={() => onSelect(recipient.id)}
              />
            ))}
            {filteredRecipients.length === 0 && searchQuery && (
              <p className="px-3 py-4 text-center text-sm text-gray-500">
                No recipients found matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer - fixed at bottom */}
      <EditorSidebarFooter
        approvedCount={approvedCount}
        totalCount={totalCount}
        onExport={onExport}
        onSave={onSave}
        isExporting={isExporting}
        isSaving={isSaving}
      />
    </aside>
  );
}
