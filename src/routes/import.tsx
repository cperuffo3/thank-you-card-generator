import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { openCsv } from "@/actions/file";
import type { Recipient } from "@/types/recipient";
import { FileSpreadsheet, Upload, ArrowRight, AlertCircle } from "lucide-react";

function ImportPage() {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSelectFile = async () => {
    try {
      setError(null);
      const result = await openCsv();
      if (result && "recipients" in result && result.recipients) {
        setRecipients(result.recipients);
        // Extract filename from filePath
        const pathParts = result.filePath.split(/[\\/]/);
        setFileName(pathParts[pathParts.length - 1] || "imported.csv");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open CSV file");
    }
  };

  const handleContinue = () => {
    if (recipients.length > 0) {
      navigate({
        to: "/configure",
        search: { recipients: JSON.stringify(recipients) },
      });
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Guest List</h1>
        <p className="text-muted-foreground mt-1">
          Select a CSV file containing your wedding guest information
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 gap-6">
        <Card className="flex w-80 flex-col">
          <CardHeader>
            <FileSpreadsheet className="text-primary mb-2 size-8" />
            <CardTitle>CSV File</CardTitle>
            <CardDescription>
              Your CSV should include columns for name, address, gift, and other details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <Button onClick={handleSelectFile} className="w-full">
              <Upload className="mr-2 size-4" />
              Select CSV File
            </Button>
            {fileName && (
              <p className="text-muted-foreground text-sm">
                Selected: <span className="text-foreground font-medium">{fileName}</span>
              </p>
            )}
            <div className="text-muted-foreground mt-auto text-xs">
              <p className="font-medium">Expected columns:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Title, First Name, Last Name</li>
                <li>Partner Title, Partner First, Partner Last</li>
                <li>Address fields (Address1, City, State, Zip)</li>
                <li>Gift, Gift Value</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {recipients.length > 0
                ? `${recipients.length} recipients found`
                : "Select a file to preview your guest list"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {recipients.length > 0 ? (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-2 text-left font-medium">Name</th>
                        <th className="pb-2 text-left font-medium">Gift</th>
                        <th className="pb-2 text-left font-medium">City</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.slice(0, 20).map((recipient, idx) => (
                        <tr key={recipient.id || idx} className="border-b last:border-0">
                          <td className="py-2">
                            {[recipient.title, recipient.firstName, recipient.lastName]
                              .filter(Boolean)
                              .join(" ") || "—"}
                            {recipient.partnerFirst && (
                              <span className="text-muted-foreground">
                                {" & "}
                                {[recipient.partnerTitle, recipient.partnerFirst, recipient.partnerLast]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>
                            )}
                          </td>
                          <td className="text-muted-foreground py-2">
                            {recipient.gift || "—"}
                          </td>
                          <td className="text-muted-foreground py-2">
                            {recipient.city || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recipients.length > 20 && (
                    <p className="text-muted-foreground mt-4 text-center text-sm">
                      ...and {recipients.length - 20} more recipients
                    </p>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-muted-foreground flex h-[400px] items-center justify-center rounded-md border border-dashed">
                <p>No file selected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={recipients.length === 0}>
          Continue
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/import")({
  component: ImportPage,
});
