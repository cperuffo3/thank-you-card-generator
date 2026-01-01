"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "sonner";
import {
  faFileExport,
  faAddressCard,
  faEnvelopeOpenText,
  faSliders,
  faChevronRight,
  faDownload,
  faArrowLeft,
  faUser,
  faMapMarkerAlt,
  faGift,
  faComment,
  faCheck,
  faTimes,
  faUsers,
  faCheckCircle,
  faTable,
} from "@fortawesome/free-solid-svg-icons";
import { VisuallyHidden } from "radix-ui";
import type { Recipient } from "@/types/recipient";

// Field definitions with categories
interface FieldDefinition {
  key: keyof Recipient;
  label: string;
  description: string;
  example: string;
  category: "name" | "address" | "gift" | "message";
  required?: boolean;
}

const EXPORT_FIELDS: FieldDefinition[] = [
  // Name fields
  {
    key: "title",
    label: "Title",
    description: "Recipient's honorific",
    example: '"Mr.", "Mrs.", "Dr."',
    category: "name",
    required: true,
  },
  {
    key: "firstName",
    label: "First Name",
    description: "Given name",
    example: '"John", "Sarah"',
    category: "name",
    required: true,
  },
  {
    key: "lastName",
    label: "Last Name",
    description: "Family name",
    example: '"Smith", "Johnson"',
    category: "name",
    required: true,
  },
  {
    key: "partnerTitle",
    label: "Partner Title",
    description: "Partner's honorific",
    example: '"Mrs.", "" (if single)',
    category: "name",
  },
  {
    key: "partnerFirst",
    label: "Partner First Name",
    description: "Partner's given name",
    example: '"Jane", "" (if single)',
    category: "name",
  },
  {
    key: "partnerLast",
    label: "Partner Last Name",
    description: "Partner's family name",
    example: '"Smith", "" (if single)',
    category: "name",
  },
  // Address fields
  {
    key: "addressTo",
    label: "Address To",
    description: "Formal address line",
    example: '"Mr. and Mrs. Smith"',
    category: "address",
    required: true,
  },
  {
    key: "address1",
    label: "Address Line 1",
    description: "Street address",
    example: '"123 Main St"',
    category: "address",
    required: true,
  },
  {
    key: "address2",
    label: "Address Line 2",
    description: "Apt, suite, unit",
    example: '"Apt 4B", "" (if none)',
    category: "address",
  },
  {
    key: "city",
    label: "City",
    description: "City name",
    example: '"New York", "Chicago"',
    category: "address",
    required: true,
  },
  {
    key: "state",
    label: "State",
    description: "State or province",
    example: '"NY", "CA", "TX"',
    category: "address",
    required: true,
  },
  {
    key: "zip",
    label: "ZIP Code",
    description: "Postal code",
    example: '"10001", "90210"',
    category: "address",
    required: true,
  },
  {
    key: "country",
    label: "Country",
    description: "Country name",
    example: '"USA", "Canada"',
    category: "address",
  },
  // Gift fields
  {
    key: "gift",
    label: "Gift",
    description: "Gift description",
    example: '"Kitchen Aid Mixer"',
    category: "gift",
  },
  {
    key: "giftValue",
    label: "Gift Value",
    description: "Monetary value",
    example: '"$100", "$250"',
    category: "gift",
  },
  // Message fields
  {
    key: "generatedMessage",
    label: "Message",
    description: "Thank you message",
    example: '"Dear John, Thank you..."',
    category: "message",
    required: true,
  },
];

// Preset export configurations
const CONTACTS_ONLY_FIELDS: (keyof Recipient)[] = [
  "title",
  "firstName",
  "lastName",
  "partnerTitle",
  "partnerFirst",
  "partnerLast",
  "address1",
  "address2",
  "city",
  "state",
  "zip",
];

const MESSAGES_EXPORT_FIELDS: (keyof Recipient)[] = [
  "addressTo",
  "address1",
  "address2",
  "city",
  "state",
  "zip",
  "country",
  "generatedMessage",
];

type ExportView = "options" | "custom";
type Category = "name" | "address" | "gift" | "message";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  onExport: (recipients: Recipient[], fields: (keyof Recipient)[], filename: string) => void;
}

const CATEGORIES: Record<Category, { label: string; icon: typeof faUser }> = {
  name: { label: "Name", icon: faUser },
  address: { label: "Address", icon: faMapMarkerAlt },
  gift: { label: "Gift", icon: faGift },
  message: { label: "Message", icon: faComment },
};

function ExportOptionsView({
  onSelectOption,
  onClose,
}: {
  onSelectOption: (option: "contacts" | "messages" | "custom") => void;
  onClose: () => void;
}) {
  return (
    <>
      <VisuallyHidden.Root>
        <DialogTitle>Export Cards</DialogTitle>
        <DialogDescription>Choose what data to export</DialogDescription>
      </VisuallyHidden.Root>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-8 pt-6 pb-6">
        <div className="flex items-center gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
          >
            <FontAwesomeIcon
              icon={faFileExport}
              className="text-white"
              style={{ fontSize: "20px" }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Export Cards</h2>
            <p className="text-sm text-gray-500">Choose what data to export</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-10 rounded-lg text-gray-400 hover:text-gray-600"
        >
          <FontAwesomeIcon icon={faTimes} className="text-base" />
        </Button>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-4 px-8 pt-6 pb-14">
        {/* Export Contacts Only */}
        <button
          onClick={() => onSelectOption("contacts")}
          className="group flex w-full cursor-pointer items-start gap-4 rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FontAwesomeIcon
              icon={faAddressCard}
              className="text-blue-600"
              style={{ fontSize: "20px" }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              Export Contacts Only
            </h3>
            <p className="text-sm text-gray-600">
              Export recipient names and addresses without gift details or
              messages
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Names
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Addresses
              </span>
            </div>
          </div>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="mt-1 text-gray-400 transition-transform group-hover:translate-x-1"
          />
        </button>

        {/* Export Messages */}
        <button
          onClick={() => onSelectOption("messages")}
          className="group flex w-full cursor-pointer items-start gap-4 rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-green-50">
            <FontAwesomeIcon
              icon={faEnvelopeOpenText}
              className="text-green-600"
              style={{ fontSize: "20px" }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Export Messages</h3>
            <p className="text-sm text-gray-600">
              Export addresses and thank you messages for approved cards
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Address To
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Full Address
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Message
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-amber-600">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-xs text-amber-500"
              />
              <span className="text-xs">
                Only approved messages will be exported
              </span>
            </div>
          </div>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="mt-1 text-gray-400 transition-transform group-hover:translate-x-1"
          />
        </button>

        {/* Export Custom Selection */}
        <button
          onClick={() => onSelectOption("custom")}
          className="group flex w-full cursor-pointer items-start gap-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 p-6 text-left transition-all hover:bg-indigo-50"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-purple-50">
            <FontAwesomeIcon
              icon={faSliders}
              className="text-purple-600"
              style={{ fontSize: "20px" }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                Export Custom Selection
              </h3>
              <span className="rounded bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white">
                Recommended
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Choose exactly which fields to include in your export
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600">
                Customizable
              </span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600">
                Preview Available
              </span>
            </div>
          </div>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="mt-1 text-indigo-400 transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-8 py-6">
        <Button
          variant="ghost"
          onClick={onClose}
          className="h-12 px-6 text-base font-medium text-gray-700"
        >
          Cancel
        </Button>
      </div>
    </>
  );
}

function CustomExportView({
  onBack,
  onClose,
  onExport,
  recipients,
}: {
  onBack: () => void;
  onClose: () => void;
  onExport: (fields: (keyof Recipient)[]) => void;
  recipients: Recipient[];
}) {
  const [selectedFields, setSelectedFields] = useState<Set<keyof Recipient>>(
    () => new Set(EXPORT_FIELDS.map((f) => f.key)),
  );
  const [activeCategory, setActiveCategory] = useState<Category>("name");

  const approvedCount = useMemo(
    () => recipients.filter((r) => r.isApproved).length,
    [recipients],
  );

  const categorizedFields = useMemo(() => {
    const result: Record<Category, FieldDefinition[]> = {
      name: [],
      address: [],
      gift: [],
      message: [],
    };
    EXPORT_FIELDS.forEach((field) => {
      result[field.category].push(field);
    });
    return result;
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      name: 0,
      address: 0,
      gift: 0,
      message: 0,
    };
    EXPORT_FIELDS.forEach((field) => {
      counts[field.category]++;
    });
    return counts;
  }, []);

  const toggleField = (key: keyof Recipient) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedFields(newSelected);
  };

  const selectAllInCategory = (category: Category) => {
    const newSelected = new Set(selectedFields);
    categorizedFields[category].forEach((field) => {
      newSelected.add(field.key);
    });
    setSelectedFields(newSelected);
  };

  const selectAll = () => {
    setSelectedFields(new Set(EXPORT_FIELDS.map((f) => f.key)));
  };

  const clearAll = () => {
    setSelectedFields(new Set());
  };

  const handleExport = () => {
    onExport(Array.from(selectedFields));
  };

  const previewColumns = useMemo(() => {
    return EXPORT_FIELDS.filter((f) => selectedFields.has(f.key))
      .map((f) => f.label)
      .join(" \u2192 ");
  }, [selectedFields]);

  return (
    <>
      <VisuallyHidden.Root>
        <DialogTitle>Custom Export Selection</DialogTitle>
        <DialogDescription>Choose which fields to include</DialogDescription>
      </VisuallyHidden.Root>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="size-9 rounded-lg"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              }}
            >
              <FontAwesomeIcon
                icon={faSliders}
                className="text-white"
                style={{ fontSize: "14px" }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Custom Export Selection
              </h2>
              <p className="text-xs text-gray-500">
                Choose which fields to include
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-9 rounded-lg text-gray-400 hover:text-gray-600"
        >
          <FontAwesomeIcon icon={faTimes} className="text-sm" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="flex w-56 shrink-0 flex-col gap-4 border-r border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold tracking-wide text-gray-900 uppercase">
              Categories
            </h3>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(CATEGORIES) as Category[]).map((category) => {
                const config = CATEGORIES[category];
                const isActive = activeCategory === category;
                const count = categoryCounts[category];
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3.5 py-2.5 text-left transition-all ${
                      isActive
                        ? "border-2 border-indigo-500 bg-white text-indigo-600"
                        : "border-2 border-transparent text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={config.icon}
                        className={`text-xs ${isActive ? "text-indigo-500" : "text-gray-400"}`}
                      />
                      <span className="text-sm font-medium">
                        {config.label}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-1.5">
              <Button
                onClick={selectAll}
                className="h-9 w-full justify-center gap-2 bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600"
              >
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                Select All
              </Button>
              <Button
                variant="secondary"
                onClick={clearAll}
                className="h-9 w-full justify-center gap-2 bg-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Fields List */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Select Fields
              </h3>
              <p className="text-xs text-gray-600">Choose data to include</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-indigo-500">
                {selectedFields.size}
              </p>
              <p className="text-xs text-gray-500">selected</p>
            </div>
          </div>

          {/* Category header with select all */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 pb-3">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={CATEGORIES[activeCategory].icon}
                className="text-sm text-gray-400"
              />
              <span className="text-sm font-semibold text-gray-900">
                {CATEGORIES[activeCategory].label} Fields
              </span>
            </div>
            <button
              onClick={() => selectAllInCategory(activeCategory)}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
            >
              Select All
            </button>
          </div>

          {/* Scrollable fields */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 p-6">
              {categorizedFields[activeCategory].map((field) => {
                const isSelected = selectedFields.has(field.key);
                return (
                  <button
                    key={field.key}
                    onClick={() => toggleField(field.key)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border-2 p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-indigo-200 bg-indigo-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`flex size-4 items-center justify-center rounded ${
                          isSelected
                            ? "bg-blue-500"
                            : "border-2 border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-[10px] text-white"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {field.label}
                        </span>
                        {field.required ? (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                            Required
                          </span>
                        ) : (
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {field.description}
                      </p>
                      <div className="mt-2 rounded bg-gray-100 px-2.5 py-1.5 font-mono text-xs text-gray-700">
                        {field.example}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer with preview */}
      <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
        {/* Preview panel */}
        <div
          className="rounded-lg border border-indigo-200 p-3.5"
          style={{
            background: "linear-gradient(90deg, #eff6ff 0%, #faf5ff 100%)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-white">
              <FontAwesomeIcon
                icon={faTable}
                className="text-sm text-indigo-500"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-semibold text-gray-900">
                Export Preview
              </h4>
              <div className="mt-1 rounded border border-gray-200 bg-white px-2.5 py-2">
                <p className="text-xs text-gray-600">CSV Column Order:</p>
                <p className="mt-1 truncate font-mono text-xs text-gray-900">
                  {previewColumns || "No fields selected"}
                </p>
              </div>
              <div className="mt-2 flex gap-6">
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-xs text-indigo-500"
                  />
                  <span className="text-xs">
                    <span className="font-semibold text-indigo-500">
                      {recipients.length}
                    </span>{" "}
                    <span className="text-gray-600">recipients</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-xs text-green-500"
                  />
                  <span className="text-xs">
                    <span className="font-semibold text-green-500">
                      {approvedCount}
                    </span>{" "}
                    <span className="text-gray-600">approved</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 px-5 text-sm font-medium text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFields.size === 0}
            className="h-9 gap-2 rounded-lg px-6 text-sm font-semibold text-white"
            style={{
              background:
                selectedFields.size > 0
                  ? "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)"
                  : undefined,
            }}
          >
            <FontAwesomeIcon icon={faDownload} className="text-xs" />
            Export CSV
          </Button>
        </div>
      </div>
    </>
  );
}

export function ExportDialog({
  open,
  onOpenChange,
  recipients,
  onExport,
}: ExportDialogProps) {
  const [view, setView] = useState<ExportView>("options");

  const handleClose = () => {
    onOpenChange(false);
    // Reset view when closing
    setTimeout(() => setView("options"), 200);
  };

  const handleSelectOption = (option: "contacts" | "messages" | "custom") => {
    if (option === "contacts") {
      onExport(recipients, CONTACTS_ONLY_FIELDS, "Thank You Card Contacts.csv");
      handleClose();
    } else if (option === "messages") {
      const approved = recipients.filter((r) => r.isApproved);
      if (approved.length === 0) {
        toast.error("No approved recipients to export. Please approve some messages first.");
        return;
      }
      onExport(approved, MESSAGES_EXPORT_FIELDS, "Thank You Card Messages.csv");
      handleClose();
    } else {
      setView("custom");
    }
  };

  const handleCustomExport = (fields: (keyof Recipient)[]) => {
    onExport(recipients, fields, "Thank You Cards.csv");
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none ${
          view === "custom"
            ? "w-4xl max-w-[calc(100%-2rem)]"
            : "w-3xl max-w-[calc(100%-2rem)]"
        }`}
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {open && view === "options" && (
          <ExportOptionsView
            onSelectOption={handleSelectOption}
            onClose={handleClose}
          />
        )}
        {open && view === "custom" && (
          <CustomExportView
            onBack={() => setView("options")}
            onClose={handleClose}
            onExport={handleCustomExport}
            recipients={recipients}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
