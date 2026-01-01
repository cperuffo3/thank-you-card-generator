import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { openCsv, type ColumnMapping } from "@/actions/file";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  FileSpreadsheet,
  Asterisk,
  AlertTriangle,
  CircleAlert,
  CircleCheck,
} from "lucide-react";
import { ImportErrorDialog } from "@/components/import-error-dialog";

// Field definitions for column mapping
const REQUIRED_FIELDS = [
  { key: "title", label: "Title" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "gift", label: "Gift Description" },
] as const;

const OPTIONAL_FIELDS = [
  { key: "giftValue", label: "Gift Value ($)" },
  { key: "address1", label: "Address Line 1" },
  { key: "address2", label: "Address Line 2" },
  { key: "city", label: "City" },
  { key: "state", label: "State/Province" },
  { key: "zip", label: "Postal Code" },
  { key: "country", label: "Country" },
  { key: "partnerTitle", label: "Partner Title" },
  { key: "partnerFirst", label: "Partner First Name" },
  { key: "partnerLast", label: "Partner Last Name" },
  { key: "company", label: "Company" },
] as const;

// Common column name variations for auto-matching
const COLUMN_ALIASES: Record<string, string[]> = {
  firstName: ["first_name", "firstname", "first name", "fname", "given_name"],
  lastName: [
    "last_name",
    "lastname",
    "last name",
    "lname",
    "surname",
    "family_name",
  ],
  gift: [
    "gift",
    "gift_description",
    "present",
    "item",
    "gift_name",
    "gifts received",
  ],
  giftValue: [
    "gift_value",
    "giftvalue",
    "value",
    "price",
    "amount",
    "gift_price",
    "cost",
    "gift value total",
  ],
  address1: [
    "address_1",
    "address1",
    "address",
    "street",
    "street_address",
    "address_line_1",
  ],
  address2: ["address_2", "address2", "address_line_2", "apt", "suite", "unit"],
  city: ["city", "town", "municipality"],
  state: ["state", "province", "region", "state_province"],
  zip: ["zip", "postal_code", "postalcode", "zipcode", "zip_code", "postcode"],
  country: ["country", "nation"],
  title: ["title", "prefix", "salutation", "honorific"],
  partnerTitle: [
    "partner_title",
    "partner title",
    "partner_prefix",
    "spouse_title",
  ],
  partnerFirst: [
    "partner_first",
    "partner first",
    "partner_first_name",
    "spouse_first",
  ],
  partnerLast: [
    "partner_last",
    "partner last",
    "partner_last_name",
    "spouse_last",
  ],
  company: ["company", "organization", "business", "company_name"],
};

// Auto-match column headers to field keys
function autoMatchColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [fieldKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const index = lowerHeaders.indexOf(alias);
      if (index !== -1) {
        mapping[fieldKey as keyof ColumnMapping] = headers[index];
        break;
      }
    }
  }

  return mapping;
}

function ImportPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  // Parse initial state from search params (for back navigation)
  const initialState = useMemo(() => {
    if (searchParams.filePath) {
      try {
        return {
          filePath: searchParams.filePath,
          fileName: searchParams.fileName,
          headers: JSON.parse(searchParams.headers) as string[],
          rowCount: searchParams.rowCount,
          mapping: JSON.parse(searchParams.mapping) as Partial<ColumnMapping>,
        };
      } catch {
        return null;
      }
    }
    return null;
  }, [searchParams]);

  // CSV data state
  const [filePath, setFilePath] = useState<string | null>(
    initialState?.filePath || null,
  );
  const [fileName, setFileName] = useState<string | null>(
    initialState?.fileName || null,
  );
  const [headers, setHeaders] = useState<string[]>(initialState?.headers || []);
  const [rowCount, setRowCount] = useState(initialState?.rowCount || 0);

  // Column mapping state
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>(
    initialState?.mapping || {},
  );

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Select CSV file
  const handleSelectFile = async () => {
    try {
      setError(null);
      const result = await openCsv();

      if ("canceled" in result && result.canceled) {
        return;
      }

      if ("error" in result && result.error) {
        setError(result.error);
        setShowErrorDialog(true);
        return;
      }

      if ("success" in result && result.success) {
        setFilePath(result.filePath);
        setFileName(result.fileName);
        setHeaders(result.headers);
        setRowCount(result.rowCount);

        // Auto-match columns
        const autoMatched = autoMatchColumns(result.headers);
        setMapping(autoMatched);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open CSV file");
      setShowErrorDialog(true);
    }
  };

  // Update mapping for a specific field
  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === "__none__" ? undefined : value,
    }));
  };

  // Check if all required fields are mapped
  const isValid = useMemo(() => {
    return REQUIRED_FIELDS.every((field) => mapping[field.key]);
  }, [mapping]);

  // Handle preview/continue
  const handlePreview = async () => {
    if (!filePath || !isValid) return;

    // Navigate to preview page with mapping data
    navigate({
      to: "/import-preview",
      search: {
        filePath,
        fileName: fileName || "",
        headers: JSON.stringify(headers),
        rowCount,
        mapping: JSON.stringify(mapping),
      },
    });
  };

  // Navigate back to welcome
  const handleBack = () => {
    navigate({ to: "/" });
  };

  // Show file selection state if no file
  if (!filePath) {
    return (
      <div
        className="relative flex h-full w-full flex-col"
        style={{ background: "var(--gradient-page)" }}
      >
        <main className="flex min-h-0 flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div
              className="flex size-16 items-center justify-center rounded-2xl"
              style={{ background: "var(--gradient-primary)" }}
            >
              <FileSpreadsheet className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-text-heading mb-2 text-2xl font-bold">
                Import Gift List
              </h1>
              <p className="text-text-body">
                Select a CSV file to import your gift list
              </p>
            </div>
            <Button
              onClick={handleSelectFile}
              className="h-12 rounded-xl px-8 text-base font-semibold text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              Select CSV File
            </Button>
          </div>
        </main>

        <ImportErrorDialog
          open={showErrorDialog}
          onOpenChange={setShowErrorDialog}
          error={error}
          onTryAgain={() => {
            setShowErrorDialog(false);
            handleSelectFile();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{ background: "var(--gradient-page)" }}
    >
      <main className="flex min-h-0 flex-1 flex-col items-center overflow-auto px-8 py-8">
        <div className="flex w-full max-w-4xl flex-col gap-8">
          {/* Back button */}
          <Button variant="textBack" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Back
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
              <FileText className="size-5 text-white" />
            </div>
            <h1 className="text-text-heading text-3xl font-bold">
              Import Gift List
            </h1>
          </div>

          {/* File info card */}
          <div
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-text-body size-5" />
              <span className="text-text-heading font-semibold">
                {fileName}
              </span>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              {rowCount} rows found
            </span>
          </div>

          {/* Instructions */}
          <p className="text-text-body">
            Map your CSV columns to the required fields:
          </p>

          {/* Required Fields Card */}
          <div
            className="rounded-xl border border-gray-200 bg-white px-6 py-5"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
          >
            <div className="mb-6 flex items-center gap-2">
              <h2 className="text-text-heading text-lg font-bold tracking-wide uppercase">
                Required Fields
              </h2>
              <Asterisk className="size-3 text-red-500" />
            </div>

            <div className="flex flex-col gap-5">
              {REQUIRED_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-center gap-4"
                >
                  <div className="flex w-72 shrink-0 items-center gap-2">
                    <label className="text-text-body text-sm font-semibold">
                      {field.label}
                    </label>
                    {mapping[field.key] ? (
                      <CircleCheck className="size-4 text-green-500" />
                    ) : (
                      <CircleAlert className="size-4 text-red-500" />
                    )}
                  </div>
                  <Select
                    value={mapping[field.key] || "__none__"}
                    onValueChange={(value) => updateMapping(field.key, value)}
                  >
                    <SelectTrigger className="h-13 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-base">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Fields Card */}
          <div
            className="rounded-xl border border-gray-200 bg-white px-6 py-5"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
          >
            <div className="mb-6 flex items-center gap-2">
              <h2 className="text-text-heading text-lg font-bold tracking-wide uppercase">
                Optional Fields
              </h2>
              <span className="text-text-muted text-xs">(can be skipped)</span>
            </div>

            <div className="flex flex-col gap-5">
              {OPTIONAL_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-center gap-4"
                >
                  <div className="flex w-72 shrink-0 items-center gap-2">
                    <label className="text-text-body text-sm font-semibold">
                      {field.label}
                    </label>
                    {mapping[field.key] ? (
                      <CircleCheck className="size-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="size-4 text-yellow-500" />
                    )}
                  </div>
                  <Select
                    value={mapping[field.key] || "__none__"}
                    onValueChange={(value) => updateMapping(field.key, value)}
                  >
                    <SelectTrigger className="h-13 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-base">
                      <SelectValue placeholder="-- None --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-13 rounded-lg border-2 border-gray-300 px-7 text-base font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePreview}
              disabled={!isValid}
              className="h-13 gap-2 rounded-lg px-6 text-base font-semibold text-white"
              style={{
                background: isValid ? "var(--gradient-primary)" : undefined,
              }}
            >
              Preview Import
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </main>

      <ImportErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        error={error}
        onTryAgain={() => {
          setShowErrorDialog(false);
          setFilePath(null);
          handleSelectFile();
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/import")({
  component: ImportPage,
  validateSearch: (search: Record<string, unknown>) => ({
    filePath: (search.filePath as string) || "",
    fileName: (search.fileName as string) || "",
    headers: (search.headers as string) || "[]",
    rowCount: Number(search.rowCount) || 0,
    mapping: (search.mapping as string) || "{}",
  }),
});
