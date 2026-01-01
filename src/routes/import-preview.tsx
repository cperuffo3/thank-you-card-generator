import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseCsvWithMapping, type ColumnMapping } from "@/actions/file";
import type { Recipient } from "@/types/recipient";
import {
  ArrowLeft,
  Check,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  Gift,
  MapPin,
} from "lucide-react";

function ImportPreviewPage() {
  const navigate = useNavigate();
  const {
    filePath,
    fileName,
    headers,
    rowCount,
    mapping: mappingParam,
  } = Route.useSearch();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse mapping from URL params
  const mapping = useMemo(() => {
    try {
      return JSON.parse(mappingParam) as ColumnMapping;
    } catch {
      return null;
    }
  }, [mappingParam]);

  // Parse CSV with mapping on mount
  useEffect(() => {
    async function parseData() {
      if (!filePath || !mapping) {
        setError("Missing file path or column mapping");
        setLoading(false);
        return;
      }

      try {
        const result = await parseCsvWithMapping(filePath, mapping);

        if ("error" in result && result.error) {
          setError(result.error);
        } else if ("recipients" in result && result.recipients) {
          setRecipients(result.recipients);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
      } finally {
        setLoading(false);
      }
    }

    parseData();
  }, [filePath, mapping]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = recipients.length;
    const withAddress = recipients.filter(
      (r) => r.address1 && r.city && r.state && r.zip,
    ).length;
    const missingAddress = total - withAddress;
    const withGiftValue = recipients.filter((r) => r.giftValue).length;
    const missingGiftValue = total - withGiftValue;

    return {
      total,
      withAddress,
      missingAddress,
      withGiftValue,
      missingGiftValue,
    };
  }, [recipients]);

  // Format display name
  const formatName = (r: Recipient) => {
    const parts = [r.title, r.firstName, r.lastName].filter(Boolean);
    let name = parts.join(" ");
    if (r.partnerFirst) {
      const partnerParts = [
        r.partnerTitle,
        r.partnerFirst,
        r.partnerLast,
      ].filter(Boolean);
      name += ` & ${partnerParts.join(" ")}`;
    }
    return name || "Unknown";
  };

  // Format address line 2 (city, state, zip)
  const formatAddressLine2 = (r: Recipient) => {
    const parts = [r.city, r.state, r.zip].filter(Boolean);
    return parts.join(", ");
  };

  // Check if address is complete
  const hasCompleteAddress = (r: Recipient) => {
    return !!(r.address1 && r.city && r.state && r.zip);
  };

  // Format currency
  const formatValue = (value: string) => {
    if (!value) return "";
    const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return value;
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Navigate back to mapping
  const handleBack = () => {
    navigate({
      to: "/import",
      search: {
        filePath,
        fileName,
        headers,
        rowCount,
        mapping: mappingParam,
      },
    });
  };

  // Confirm import and go to configure
  const handleConfirm = () => {
    navigate({
      to: "/configure",
      search: { recipients: JSON.stringify(recipients) },
    });
  };

  // Cancel and go to home
  const handleCancel = () => {
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center"
        style={{ background: "var(--gradient-page)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-text-body">Processing CSV file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center"
        style={{ background: "var(--gradient-page)" }}
      >
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <AlertTriangle className="size-12 text-red-500" />
          <h1 className="text-text-heading text-xl font-bold">Import Error</h1>
          <p className="text-text-body">{error}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{ background: "var(--gradient-page)" }}
    >
      <main className="flex min-h-0 flex-1 flex-col overflow-auto px-24 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          {/* Back button */}
          <Button variant="textBack" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Back to Mapping
          </Button>

          {/* Header */}
          <div className="flex items-center gap-4">
            <div
              className="flex size-12 items-center justify-center rounded-xl"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Eye className="size-5 text-white" />
            </div>
            <h1 className="text-text-heading text-3xl font-bold">
              Preview Import
            </h1>
          </div>

          {/* Success banner */}
          <div className="flex items-center gap-3 rounded-xl bg-green-50 px-5 py-4">
            <CheckCircle className="size-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">
                {stats.total} recipients ready to import
              </p>
              <p className="text-sm text-green-700">
                Review the data below before confirming
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-5 py-4">
            <Info className="mt-0.5 size-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">
                Showing {stats.total} recipients
              </p>
              <p className="text-sm text-blue-700">
                Verify that names, addresses, and gifts are imported correctly.
                You can edit individual messages after import.
              </p>
            </div>
          </div>

          {/* Data table */}
          <div
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
          >
            <ScrollArea className="h-100">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-text-muted w-10 py-3 pr-1 pl-4 text-left text-xs font-semibold tracking-wide uppercase">
                      #
                    </th>
                    <th className="text-text-muted w-1/3 min-w-50 py-3 pr-4 pl-2 text-left text-xs font-semibold tracking-wide uppercase">
                      Name
                    </th>
                    <th className="text-text-muted w-1/4 min-w-62.5 px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                      Address
                    </th>
                    <th className="text-text-muted w-32 px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                      Gift
                    </th>
                    <th className="text-text-muted w-24 px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient, idx) => (
                    <tr
                      key={recipient.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="text-text-muted py-4 pr-1 pl-4 text-sm">
                        {idx + 1}
                      </td>
                      <td className="py-4 pr-4 pl-2">
                        <p className="text-text-heading font-semibold">
                          {formatName(recipient)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {hasCompleteAddress(recipient) ? (
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-700">
                              {recipient.address1}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatAddressLine2(recipient)}
                            </p>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-amber-600">
                            <AlertTriangle className="size-3" />
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="text-text-body px-4 py-4 text-sm">
                        {recipient.gift || "—"}
                      </td>
                      <td className="text-text-heading px-4 py-4 text-right text-sm font-medium">
                        {formatValue(recipient.giftValue) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            {/* Table footer */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-text-muted text-sm">
                Showing {stats.total} of {stats.total} recipients
              </span>
            </div>
          </div>

          {/* Import Summary */}
          <div
            className="rounded-xl border border-gray-200 bg-white px-6 py-5"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
          >
            <h2 className="text-text-heading mb-4 text-lg font-bold">
              Import Summary
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100">
                  <Users className="size-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-text-heading text-2xl font-bold">
                    {stats.total}
                  </p>
                  <p className="text-text-muted text-sm">Total Recipients</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                  <Gift className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-text-heading text-2xl font-bold">
                    {stats.total}
                  </p>
                  <p className="text-text-muted text-sm">Gifts Recorded</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                  <MapPin className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-text-heading text-2xl font-bold">
                    {stats.withAddress}
                  </p>
                  <p className="text-text-muted text-sm">Complete Addresses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality Notes */}
          {(stats.missingAddress > 0 || stats.missingGiftValue > 0) && (
            <div className="rounded-xl bg-amber-50 px-5 py-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                <h3 className="text-text-heading text-sm font-semibold">
                  Data Quality Notes
                </h3>
              </div>
              <p className="text-text-body mb-2 text-sm">
                The following items may need attention:
              </p>
              <ul className="space-y-1 text-sm">
                {stats.missingGiftValue > 0 && (
                  <li className="text-text-body">
                    <span className="font-semibold text-amber-700">
                      {stats.missingGiftValue} recipients
                    </span>{" "}
                    have gifts without value information
                  </li>
                )}
                {stats.missingAddress > 0 && (
                  <li className="text-text-body">
                    <span className="font-semibold text-amber-700">
                      {stats.missingAddress} recipient
                      {stats.missingAddress > 1 ? "s" : ""}
                    </span>{" "}
                    {stats.missingAddress > 1 ? "have" : "has"} incomplete
                    address (missing postal code)
                  </li>
                )}
              </ul>
              <p className="text-text-muted mt-3 text-xs">
                You can still proceed with import and fix these issues in the
                editor.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 gap-2 rounded-xl border-2 border-gray-300 px-6 text-base font-semibold"
            >
              <ArrowLeft className="size-4" />
              Back to Mapping
            </Button>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="h-12 rounded-xl border-2 border-gray-300 px-6 text-base font-semibold"
              >
                Cancel Import
              </Button>
              <Button
                onClick={handleConfirm}
                className="h-12 gap-2 rounded-xl px-6 text-base font-semibold text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Check className="size-4" />
                Confirm & Import
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/import-preview")({
  component: ImportPreviewPage,
  validateSearch: (search: Record<string, unknown>) => ({
    filePath: (search.filePath as string) || "",
    fileName: (search.fileName as string) || "",
    headers: (search.headers as string) || "[]",
    rowCount: Number(search.rowCount) || 0,
    mapping: (search.mapping as string) || "{}",
  }),
});
