import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface ImportErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string | null;
  onTryAgain: () => void;
}

export function ImportErrorDialog({
  open,
  onOpenChange,
  error,
  onTryAgain,
}: ImportErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md overflow-hidden rounded-3xl p-0"
        showCloseButton={false}
        style={{ boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <DialogHeader className="border-b border-gray-100 px-8 pt-8 pb-6">
          <div className="flex items-center gap-4">
            <div
              className="flex size-14 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow:
                  "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)",
              }}
            >
              <AlertCircle className="size-6 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-text-heading text-2xl font-bold">
                Import Error
              </DialogTitle>
              <DialogDescription className="text-text-body text-sm">
                There was a problem importing your CSV file
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col gap-6 px-8 py-6">
          {/* Error message box */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-text-heading mb-2 text-sm font-semibold">
              Could not parse the CSV file.
            </p>
            {error && (
              <p className="mb-3 text-sm text-red-600">Error: {error}</p>
            )}
            <p className="text-text-body text-sm">
              Please check your file and try again. The CSV should have:
            </p>
            <ul className="text-text-body mt-2 list-inside list-disc space-y-1 text-sm">
              <li>Consistent columns on each row</li>
              <li>Headers in the first row</li>
              <li>At minimum: name and gift columns</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-gray-100 px-8 py-6">
          <Button
            onClick={onTryAgain}
            className="h-12 w-full gap-2 rounded-xl text-base font-semibold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ArrowLeft className="size-4" />
            Try Another File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
