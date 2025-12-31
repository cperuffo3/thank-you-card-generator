import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDefaultModels,
  testConnection,
  type OpenRouterModel,
} from "@/services/openrouter";
import type { Recipient, Session } from "@/types/recipient";
import { Key, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

function ConfigurePage() {
  const navigate = useNavigate();
  const { recipients: recipientsParam } = Route.useSearch();

  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-sonnet-4");
  const [models] = useState<OpenRouterModel[]>(getDefaultModels());
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse recipients from URL params
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    if (recipientsParam) {
      try {
        const parsed = JSON.parse(recipientsParam);
        setRecipients(parsed);
      } catch {
        setError("Failed to parse recipient data");
      }
    }
  }, [recipientsParam]);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const success = await testConnection(apiKey);
      setTestResult(success ? "success" : "error");
      if (!success) {
        setError("Connection test failed. Please check your API key.");
      }
    } catch {
      setTestResult("error");
      setError("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const handleContinue = () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    if (recipients.length === 0) {
      setError("No recipients found. Please go back and import a CSV file.");
      return;
    }

    const session: Session = {
      openRouterApiKey: apiKey,
      model: selectedModel,
      recipients,
    };

    navigate({
      to: "/editor",
      search: { session: JSON.stringify(session) },
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configure API</h1>
        <p className="text-muted-foreground mt-1">
          Set up your OpenRouter API key and select a model for generating messages
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <Card>
          <CardHeader>
            <Key className="text-primary mb-2 size-8" />
            <CardTitle>OpenRouter API Key</CardTitle>
            <CardDescription>
              Enter your OpenRouter API key to enable AI message generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                    setError(null);
                  }}
                  placeholder="sk-or-..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? "Hide" : "Show"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !apiKey.trim()}
              >
                {testing && <Loader2 className="mr-2 size-4 animate-spin" />}
                Test Connection
              </Button>
              {testResult === "success" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="size-4" />
                  Connected
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              Don't have an API key?{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                Get one at OpenRouter
                <ExternalLink className="size-3" />
              </a>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Selection</CardTitle>
            <CardDescription>
              Choose an AI model for generating thank you messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Different models have varying capabilities and costs.
                Claude Sonnet 4 is recommended for quality results.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ready to start</p>
                <p className="text-muted-foreground text-xs">
                  {recipients.length} recipients loaded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate({ to: "/import" })}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!apiKey.trim()}>
          Start Editing
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/configure")({
  component: ConfigurePage,
  validateSearch: (search: Record<string, unknown>) => ({
    recipients: (search.recipients as string) || "",
  }),
});
