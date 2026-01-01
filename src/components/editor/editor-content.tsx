import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecipientEditDialog } from "@/components/editor/recipient-edit-dialog";
import { AIEditDialog } from "@/components/editor/ai-edit-dialog";
import { AIPromptSettingsDialog } from "@/components/editor/ai-prompt-settings-dialog";
import { EditGiftDialog } from "@/components/edit-gift-dialog";
import { useSession } from "@/context/session-context";
import type { Recipient } from "@/types/recipient";
import {
  MapPin,
  Building,
  Flag,
  Gift,
  FileText,
  Sparkles,
  Check,
  RefreshCw,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Loader2,
  Pencil,
  XCircle,
  Cog,
  Copy,
  X,
} from "lucide-react";

interface EditorContentProps {
  recipient: Recipient;
  currentIndex: number;
  totalCount: number;
  isGenerating: boolean;
  onUpdateRecipient: (updates: Partial<Recipient>) => void;
  onGenerate: () => Promise<void>;
  onRegenerate: (modificationRequest: string) => Promise<void>;
  onNavigate: (direction: "prev" | "next") => void;
  onOpenSettings?: () => void;
}

function getDisplayName(recipient: Recipient): string {
  // Use addressTo if available, otherwise fall back to basic name formatting
  if (recipient.addressTo) {
    return recipient.addressTo;
  }

  const primaryName = [recipient.title, recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(" ");
  const partnerName = [
    recipient.partnerTitle,
    recipient.partnerFirst,
    recipient.partnerLast,
  ]
    .filter(Boolean)
    .join(" ");

  if (primaryName && partnerName) {
    return `${primaryName} & ${partnerName}`;
  }
  return primaryName || "Unnamed Recipient";
}

function getInitials(recipient: Recipient): string {
  const first =
    recipient.firstName?.charAt(0) || recipient.partnerFirst?.charAt(0) || "";
  const last =
    recipient.lastName?.charAt(0) || recipient.partnerLast?.charAt(0) || "";
  return (first + last).toUpperCase() || "??";
}

export function EditorContent({
  recipient,
  currentIndex,
  totalCount,
  isGenerating,
  onUpdateRecipient,
  onGenerate,
  onRegenerate,
  onNavigate,
  onOpenSettings,
}: EditorContentProps) {
  const [modificationRequest, setModificationRequest] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditGiftDialogOpen, setIsEditGiftDialogOpen] = useState(false);
  const [isAIEditDialogOpen, setIsAIEditDialogOpen] = useState(false);
  const [isPromptSettingsOpen, setIsPromptSettingsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const {
    systemPrompt,
    setSystemPrompt,
    userPromptTemplate,
    setUserPromptTemplate,
  } = useSession();
  const displayName = getDisplayName(recipient);
  const initials = getInitials(recipient);

  const handleMessageChange = (value: string) => {
    onUpdateRecipient({
      generatedMessage: value,
      lastModified: new Date().toISOString(),
    });
  };

  const handleCustomPromptChange = (value: string) => {
    onUpdateRecipient({ customPrompt: value });
  };

  const handleApprove = () => {
    onUpdateRecipient({
      isApproved: true,
      lastModified: new Date().toISOString(),
    });
  };

  const handleUnapprove = () => {
    onUpdateRecipient({
      isApproved: false,
      lastModified: new Date().toISOString(),
    });
  };

  const handleRegenerate = async () => {
    if (!modificationRequest.trim()) {
      await onGenerate();
    } else {
      await onRegenerate(modificationRequest);
      setModificationRequest("");
    }
  };

  const handleEditWithAI = () => {
    setIsAIEditDialogOpen(true);
  };

  const handleAIEditGenerate = (modificationRequest: string) => {
    onRegenerate(modificationRequest);
  };

  const handleCopy = async () => {
    if (recipient.generatedMessage) {
      await navigator.clipboard.writeText(recipient.generatedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveGift = (gift: string, giftValue: string) => {
    onUpdateRecipient({
      gift,
      giftValue,
      lastModified: new Date().toISOString(),
    });
  };

  const handleSavePromptSettings = (
    newSystemPrompt: string,
    newUserPromptTemplate: string
  ) => {
    setSystemPrompt(newSystemPrompt);
    setUserPromptTemplate(newUserPromptTemplate);
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Scrollable Content */}
      <div className="min-h-0 flex-1 overflow-auto px-28 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Recipient Details
            </h1>
            {onOpenSettings && (
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenSettings}
                className="size-10"
              >
                <Settings className="size-4" />
              </Button>
            )}
          </div>

          {/* Recipient Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="bg-gradient-primary flex size-16 shrink-0 items-center justify-center rounded-full">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {displayName}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="size-8 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
                <div className="mt-1 space-y-0.5">
                  {recipient.address1 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="size-3.5 text-gray-400" />
                      {recipient.address1}
                      {recipient.addressValidated === true && (
                        <Check className="size-3.5 text-green-500" />
                      )}
                      {recipient.addressValidated === false && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <XCircle className="size-3.5 text-red-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {recipient.addressValidationError ||
                              "Address validation failed"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                  {recipient.address2 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="size-3.5 text-gray-400" />
                      {recipient.address2}
                      {recipient.addressValidated === true && (
                        <Check className="size-3.5 text-green-500" />
                      )}
                      {recipient.addressValidated === false && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <XCircle className="size-3.5 text-red-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {recipient.addressValidationError ||
                              "Address validation failed"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                  {(recipient.city || recipient.state || recipient.zip) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="size-3.5 text-gray-400" />
                      {[recipient.city, recipient.state, recipient.zip]
                        .filter(Boolean)
                        .join(", ")}
                      {recipient.addressValidated === true && (
                        <Check className="size-3.5 text-green-500" />
                      )}
                      {recipient.addressValidated === false && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <XCircle className="size-3.5 text-red-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {recipient.addressValidationError ||
                              "Address validation failed"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                  {recipient.country && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Flag className="size-3.5 text-gray-400" />
                      {recipient.country}
                      {recipient.addressValidated === true && (
                        <Check className="size-3.5 text-green-500" />
                      )}
                      {recipient.addressValidated === false && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <XCircle className="size-3.5 text-red-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {recipient.addressValidationError ||
                              "Address validation failed"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Edit Dialog */}
          <RecipientEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            recipient={recipient}
            onSave={onUpdateRecipient}
          />

          {/* AI Edit Dialog */}
          <AIEditDialog
            open={isAIEditDialogOpen}
            onOpenChange={setIsAIEditDialogOpen}
            currentMessage={recipient.generatedMessage || ""}
            onGenerate={handleAIEditGenerate}
          />

          {/* Gift Card */}
          {recipient.gift && (
            <div className="bg-gradient-subtle rounded-xl border border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Gift className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      Gift Received
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {recipient.gift}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditGiftDialogOpen(true)}
                  className="size-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
              {recipient.giftValue && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {recipient.giftValue.startsWith("$")
                      ? recipient.giftValue
                      : `$${recipient.giftValue}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Edit Gift Dialog */}
          <EditGiftDialog
            open={isEditGiftDialogOpen}
            onOpenChange={setIsEditGiftDialogOpen}
            gift={recipient.gift || ""}
            giftValue={recipient.giftValue || ""}
            onSave={handleSaveGift}
          />

          {/* Additional Context Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                  <FileText className="size-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Additional Context
                  </h3>
                  <p className="text-xs text-gray-500">
                    Optional details to personalize the message
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPromptSettingsOpen(true)}
                    className="size-8 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Cog className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Configure AI prompt settings
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              value={recipient.customPrompt || ""}
              onChange={(e) => handleCustomPromptChange(e.target.value)}
              placeholder="Add any special context about this recipient..."
              className="min-h-24 resize-none border-gray-300"
            />
          </div>

          {/* AI Prompt Settings Dialog */}
          <AIPromptSettingsDialog
            open={isPromptSettingsOpen}
            onOpenChange={setIsPromptSettingsOpen}
            systemPrompt={systemPrompt}
            userPromptTemplate={userPromptTemplate}
            onSave={handleSavePromptSettings}
          />

          {/* Generate Button */}
          {!recipient.generatedMessage && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-gradient-primary w-full rounded-xl py-6 text-base font-semibold"
            >
              {isGenerating ? (
                <Loader2 className="mr-3 size-5 animate-spin" />
              ) : (
                <Sparkles className="mr-3 size-5" />
              )}
              Generate Thank You Message
            </Button>
          )}

          {/* Message Card */}
          {recipient.generatedMessage && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-green-50">
                    <FileText className="size-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Thank You Message
                    </h3>
                    <p className="text-xs text-gray-500">
                      Edit and approve when ready
                    </p>
                  </div>
                </div>
                {recipient.isApproved && (
                  <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
                    <Check className="size-3.5 text-green-700" />
                    <span className="text-xs font-semibold text-green-700">
                      Approved
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <Textarea
                  value={recipient.generatedMessage}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  className="min-h-48 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-gray-700 focus-visible:ring-0"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3">
                {recipient.isApproved ? (
                  <Button
                    onClick={handleUnapprove}
                    variant="outline"
                    className="h-12 flex-1 border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <X className="mr-2 size-4" />
                    Unapprove
                  </Button>
                ) : (
                  <Button
                    onClick={handleApprove}
                    disabled={isGenerating}
                    className="h-12 flex-1 bg-indigo-500 hover:bg-indigo-600"
                  >
                    <Check className="mr-2 size-4" />
                    Approve Message
                  </Button>
                )}
                {recipient.isApproved ? (
                  <Button
                    onClick={handleCopy}
                    className={`h-12 flex-1 ${isCopied ? "bg-green-500 hover:bg-green-600" : "bg-purple-500 hover:bg-purple-600"}`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-2 size-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 size-4" />
                        Copy
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="h-12 px-4"
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 size-4" />
                      )}
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditWithAI}
                      disabled={isGenerating}
                      className="h-12 px-4"
                    >
                      <Wand2 className="mr-2 size-4" />
                      Edit with AI
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Navigation Footer */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-28 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onNavigate("prev")}
            disabled={currentIndex <= 0}
            className="h-12 gap-2 px-6"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">Recipient</p>
            <p className="text-2xl font-bold text-gray-900">
              {currentIndex + 1}{" "}
              <span className="font-bold text-gray-400">of</span> {totalCount}
            </p>
          </div>

          <Button
            onClick={() => onNavigate("next")}
            disabled={currentIndex >= totalCount - 1}
            className="h-12 gap-2 bg-indigo-500 px-6 hover:bg-indigo-600"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
