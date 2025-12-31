import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

function WelcomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Wedding Thank You Cards</h1>
        <p className="text-muted-foreground mt-2">
          Generate personalized thank you messages for your wedding guests
        </p>
      </div>
      <div className="flex gap-4">
        <Button size="lg">Start New Session</Button>
        <Button size="lg" variant="outline">
          Load Existing Session
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: WelcomePage,
});
