import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";

interface EditorSidebarFooterProps {
  approvedCount: number;
  totalCount: number;
  onExport: () => void;
  onSave: () => void;
  isExporting?: boolean;
  isSaving?: boolean;
}

export function EditorSidebarFooter({
  approvedCount,
  totalCount,
  onExport,
  onSave,
  isExporting = false,
  isSaving = false,
}: EditorSidebarFooterProps) {
  const progressPercent =
    totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Progress</span>
          <span className="text-xs font-semibold text-gray-600">
            {approvedCount} of {totalCount} approved
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {Math.round(progressPercent)}% complete
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={isSaving}
          variant="outline"
          className="h-10 flex-1"
        >
          <Save className="mr-2 size-4" />
          Save
        </Button>
        <Button
          onClick={onExport}
          disabled={isExporting}
          className="bg-gradient-primary h-10 flex-1 text-white"
        >
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
