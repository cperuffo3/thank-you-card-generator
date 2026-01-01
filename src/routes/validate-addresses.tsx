import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import type { Recipient } from "@/types/recipient";
import { useSession } from "@/context/session-context";
import { GoogleMapsConfigDialog } from "@/components/google-maps-config-dialog";
import {
  validateAddress,
  type AddressInput,
} from "@/services/address-validation";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  SkipForward,
  RefreshCw,
} from "lucide-react";

function ValidateAddressesPage() {
  const navigate = useNavigate();
  const { recipients: recipientsParam } = Route.useSearch();
  const { googleMapsApiKey, setGoogleMapsApiKey, isGoogleMapsConfigured } =
    useSession();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [currentValidatingIndex, setCurrentValidatingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Parse recipients from URL params
  useEffect(() => {
    if (recipientsParam) {
      try {
        const parsed = JSON.parse(recipientsParam) as Recipient[];
        setRecipients(parsed);
      } catch {
        setError("Failed to parse recipient data");
      }
    }
  }, [recipientsParam]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = recipients.length;
    const withAddress = recipients.filter(
      (r) => r.address1 && r.city && r.state && r.zip,
    ).length;
    const validated = recipients.filter(
      (r) => r.addressValidated !== undefined,
    ).length;
    const valid = recipients.filter((r) => r.addressValidated === true).length;
    const invalid = recipients.filter(
      (r) => r.addressValidated === false,
    ).length;
    const pending = withAddress - validated;

    return { total, withAddress, validated, valid, invalid, pending };
  }, [recipients]);

  // Convert Recipient to AddressInput
  const recipientToAddressInput = (r: Recipient): AddressInput => ({
    address1: r.address1,
    address2: r.address2,
    city: r.city,
    state: r.state,
    zip: r.zip,
    country: r.country || "US",
  });

  // Check if recipient has complete address
  const hasCompleteAddress = (r: Recipient) =>
    !!(r.address1 && r.city && r.state && r.zip);

  // Validate all addresses
  const handleValidateAll = useCallback(async () => {
    if (!googleMapsApiKey) {
      setIsConfigDialogOpen(true);
      return;
    }

    setIsValidating(true);
    setError(null);
    setValidationProgress(0);

    const addressesToValidate = recipients.filter(
      (r) => hasCompleteAddress(r) && r.addressValidated === undefined,
    );

    if (addressesToValidate.length === 0) {
      setIsValidating(false);
      return;
    }

    const updatedRecipients = [...recipients];
    let validatedCount = 0;

    for (const recipient of addressesToValidate) {
      const index = updatedRecipients.findIndex((r) => r.id === recipient.id);
      if (index === -1) continue;

      setCurrentValidatingIndex(index);

      try {
        const result = await validateAddress(
          googleMapsApiKey,
          recipientToAddressInput(recipient),
        );

        updatedRecipients[index] = {
          ...updatedRecipients[index],
          addressValidated: result.isValid,
          addressValidationError: result.error,
          formattedAddress: result.formattedAddress,
        };
      } catch (err) {
        updatedRecipients[index] = {
          ...updatedRecipients[index],
          addressValidated: false,
          addressValidationError:
            err instanceof Error ? err.message : "Validation failed",
        };
      }

      validatedCount++;
      setValidationProgress(
        Math.round((validatedCount / addressesToValidate.length) * 100),
      );
      setRecipients([...updatedRecipients]);

      // Small delay to avoid rate limiting
      if (validatedCount < addressesToValidate.length) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    setIsValidating(false);
    setCurrentValidatingIndex(-1);
  }, [googleMapsApiKey, recipients]);

  // Retry validation for a single recipient
  const handleRetryValidation = async (recipientId: string) => {
    if (!googleMapsApiKey) {
      setIsConfigDialogOpen(true);
      return;
    }

    const recipient = recipients.find((r) => r.id === recipientId);
    if (!recipient || !hasCompleteAddress(recipient)) return;

    const index = recipients.findIndex((r) => r.id === recipientId);
    setCurrentValidatingIndex(index);

    try {
      const result = await validateAddress(
        googleMapsApiKey,
        recipientToAddressInput(recipient),
      );

      setRecipients((prev) =>
        prev.map((r) =>
          r.id === recipientId
            ? {
                ...r,
                addressValidated: result.isValid,
                addressValidationError: result.error,
                formattedAddress: result.formattedAddress,
              }
            : r,
        ),
      );
    } catch (err) {
      setRecipients((prev) =>
        prev.map((r) =>
          r.id === recipientId
            ? {
                ...r,
                addressValidated: false,
                addressValidationError:
                  err instanceof Error ? err.message : "Validation failed",
              }
            : r,
        ),
      );
    }

    setCurrentValidatingIndex(-1);
  };

  // Continue to editor
  const handleContinue = () => {
    navigate({
      to: "/editor",
      search: { recipients: JSON.stringify(recipients) },
    });
  };

  // Skip validation and go directly to editor
  const handleSkip = () => {
    navigate({
      to: "/editor",
      search: { recipients: JSON.stringify(recipients) },
    });
  };

  // Go back to import preview
  const handleBack = () => {
    navigate({ to: "/" });
  };

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

  // Format address
  const formatAddress = (r: Recipient) => {
    const line1 = r.address1;
    const line2 = [r.city, r.state, r.zip].filter(Boolean).join(", ");
    return { line1, line2 };
  };

  // Get validation status icon
  const ValidationStatusIcon = ({ recipient }: { recipient: Recipient }) => {
    const index = recipients.findIndex((r) => r.id === recipient.id);
    const isCurrentlyValidating = index === currentValidatingIndex;

    if (isCurrentlyValidating) {
      return <Loader2 className="size-4 animate-spin text-blue-500" />;
    }

    if (!hasCompleteAddress(recipient)) {
      return <AlertTriangle className="size-4 text-gray-400" />;
    }

    if (recipient.addressValidated === undefined) {
      return <MapPin className="size-4 text-gray-400" />;
    }

    if (recipient.addressValidated === true) {
      return <CheckCircle className="size-4 text-green-500" />;
    }

    return <XCircle className="size-4 text-red-500" />;
  };

  if (recipients.length === 0 && !error) {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center"
        style={{ background: "var(--gradient-page)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-text-body">Loading recipients...</p>
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
            Back to Home
          </Button>

          {/* Header */}
          <div className="flex items-center gap-4">
            <div
              className="flex size-12 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <MapPin className="size-5 text-white" />
            </div>
            <h1 className="text-text-heading text-3xl font-bold">
              Validate Addresses
            </h1>
          </div>

          {/* API Key Warning */}
          {!isGoogleMapsConfigured && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800">
                    Google Maps API key required
                  </p>
                  <p className="text-sm text-amber-700">
                    Configure your API key to validate addresses
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsConfigDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Configure API Key
              </Button>
            </div>
          )}

          {/* Stats and Progress */}
          <div
            className="rounded-xl border border-gray-200 bg-white p-6"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-text-heading text-lg font-bold">
                Validation Progress
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-gray-600">{stats.valid} valid</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-500" />
                  <span className="text-gray-600">{stats.invalid} invalid</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-gray-400" />
                  <span className="text-gray-600">{stats.pending} pending</span>
                </div>
              </div>
            </div>

            {isValidating && (
              <div className="mb-4">
                <Progress value={validationProgress} className="h-2" />
                <p className="mt-2 text-sm text-gray-500">
                  Validating address{" "}
                  {Math.round((validationProgress / 100) * stats.pending)} of{" "}
                  {stats.pending}...
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleValidateAll}
                disabled={
                  isValidating || !isGoogleMapsConfigured || stats.pending === 0
                }
                className="h-12 w-full gap-2 text-base font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
                }}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <MapPin className="size-4" />
                    Validate All Addresses
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Address Table */}
          <div
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
          >
            <ScrollArea className="h-80">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-text-muted w-10 py-3 pr-1 pl-4 text-left text-xs font-semibold tracking-wide uppercase">
                      #
                    </th>
                    <th className="text-text-muted w-12 px-2 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                      Status
                    </th>
                    <th className="text-text-muted w-1/3 py-3 pr-4 pl-2 text-left text-xs font-semibold tracking-wide uppercase">
                      Name
                    </th>
                    <th className="text-text-muted px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                      Address
                    </th>
                    <th className="text-text-muted w-24 px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient, idx) => {
                    const address = formatAddress(recipient);
                    const hasAddress = hasCompleteAddress(recipient);

                    return (
                      <tr
                        key={recipient.id}
                        className={`border-b border-gray-100 last:border-0 ${
                          recipient.addressValidated === false
                            ? "bg-red-50"
                            : ""
                        }`}
                      >
                        <td className="text-text-muted py-4 pr-1 pl-4 text-sm">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-4">
                          <ValidationStatusIcon recipient={recipient} />
                        </td>
                        <td className="py-4 pr-4 pl-2">
                          <p className="text-text-heading font-semibold">
                            {formatName(recipient)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {hasAddress ? (
                            <div className="flex flex-col">
                              <p
                                className={`text-sm ${
                                  recipient.addressValidated === false
                                    ? "text-red-700"
                                    : "text-gray-700"
                                }`}
                              >
                                {address.line1}
                              </p>
                              <p
                                className={`text-sm ${
                                  recipient.addressValidated === false
                                    ? "text-red-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {address.line2}
                              </p>
                              {recipient.addressValidationError && (
                                <p className="mt-1 text-xs text-red-600">
                                  {recipient.addressValidationError}
                                </p>
                              )}
                              {recipient.formattedAddress &&
                                recipient.addressValidated && (
                                  <p className="mt-1 text-xs text-green-600">
                                    ✓ {recipient.formattedAddress}
                                  </p>
                                )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              No address
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {hasAddress &&
                            recipient.addressValidated !== true && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRetryValidation(recipient.id)
                                }
                                disabled={
                                  isValidating ||
                                  currentValidatingIndex ===
                                    recipients.findIndex(
                                      (r) => r.id === recipient.id,
                                    )
                                }
                                className="gap-1 text-xs"
                              >
                                <RefreshCw className="size-3" />
                                Retry
                              </Button>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>

            {/* Table footer */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-text-muted text-sm">
                Showing {stats.total} recipients ({stats.withAddress} with
                addresses)
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 gap-2 rounded-xl border-2 border-gray-300 px-6 text-base font-semibold"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="h-12 gap-2 rounded-xl border-2 border-gray-300 px-6 text-base font-semibold"
              >
                <SkipForward className="size-4" />
                Skip Validation
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isValidating || stats.pending > 0}
                className="h-12 gap-2 rounded-xl px-6 text-base font-semibold text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                Continue to Editor
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Google Maps Config Dialog */}
      <GoogleMapsConfigDialog
        open={isConfigDialogOpen}
        onOpenChange={setIsConfigDialogOpen}
        apiKey={googleMapsApiKey}
        onApiKeyChange={setGoogleMapsApiKey}
        onSave={() => {}}
      />
    </div>
  );
}

export const Route = createFileRoute("/validate-addresses")({
  component: ValidateAddressesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    recipients: (search.recipients as string) || "",
  }),
});
