import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recipient } from "@/types/recipient";
import { Sparkles, RefreshCw, Check, X, Loader2 } from "lucide-react";

interface MessageEditorProps {
  recipient: Recipient;
  apiKey: string;
  model: string;
  onUpdateRecipient: (updates: Partial<Recipient>) => void;
  onGenerate: () => Promise<void>;
  onRegenerate: (modificationRequest: string) => Promise<void>;
  isGenerating: boolean;
}

export function MessageEditor({
  recipient,
  onUpdateRecipient,
  onGenerate,
  onRegenerate,
  isGenerating,
}: MessageEditorProps) {
  const [modificationRequest, setModificationRequest] = useState("");

  const handleMessageChange = (value: string) => {
    onUpdateRecipient({
      generatedMessage: value,
      lastModified: new Date().toISOString(),
    });
  };

  const handleCustomPromptChange = (value: string) => {
    onUpdateRecipient({ customPrompt: value });
  };

  const handleApproveToggle = () => {
    onUpdateRecipient({
      isApproved: !recipient.isApproved,
      lastModified: new Date().toISOString(),
    });
  };

  const handleRegenerate = async () => {
    if (!modificationRequest.trim()) return;
    await onRegenerate(modificationRequest);
    setModificationRequest("");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Custom Instructions (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={recipient.customPrompt || ""}
            onChange={(e) => handleCustomPromptChange(e.target.value)}
            placeholder="Add any special context for this recipient (e.g., 'They are close family friends', 'Include a joke about golf')"
            className="min-h-15"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Generated Message</CardTitle>
            <Button onClick={onGenerate} disabled={isGenerating} size="sm">
              {isGenerating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {recipient.generatedMessage ? "Regenerate" : "Generate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {recipient.generatedMessage ? (
            <>
              <Textarea
                value={recipient.generatedMessage}
                onChange={(e) => handleMessageChange(e.target.value)}
                className="min-h-30"
                placeholder="Generated message will appear here..."
              />

              <div className="flex gap-2">
                <Input
                  value={modificationRequest}
                  onChange={(e) => setModificationRequest(e.target.value)}
                  placeholder="Request changes (e.g., 'Make it more formal')"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleRegenerate();
                    }
                  }}
                />
                <Button
                  onClick={handleRegenerate}
                  disabled={isGenerating || !modificationRequest.trim()}
                  variant="outline"
                  size="default"
                >
                  {isGenerating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex h-30 items-center justify-center rounded-md border border-dashed text-sm">
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Generating message...
                </span>
              ) : (
                "Click 'Generate' to create a thank you message"
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleApproveToggle}
          variant={recipient.isApproved ? "outline" : "default"}
          disabled={!recipient.generatedMessage}
          className={
            recipient.isApproved ? "border-green-600 text-green-600" : ""
          }
        >
          {recipient.isApproved ? (
            <>
              <X className="mr-2 size-4" />
              Unapprove
            </>
          ) : (
            <>
              <Check className="mr-2 size-4" />
              Approve
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
