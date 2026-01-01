import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelopeOpenText,
  faFolderOpen,
  faWandMagicSparkles,
  faPenToSquare,
  faFileExport,
  faCircleInfo,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import { loadSession } from "@/actions/file";

function WelcomePage() {
  const navigate = useNavigate();

  const handleImportGiftList = () => {
    navigate({
      to: "/import",
      search: {
        filePath: "",
        fileName: "",
        headers: "[]",
        rowCount: 0,
        mapping: "{}",
      },
    });
  };

  const handleContinueSession = async () => {
    try {
      const result = await loadSession();
      if (result) {
        navigate({
          to: "/editor",
          search: { session: JSON.stringify(result) },
        });
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{ background: "var(--gradient-page)" }}
    >
      {/* Main Content */}
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
        <div className="flex w-full max-w-2xl flex-col gap-8">
          {/* Hero Section */}
          <div className="flex flex-col items-center text-center">
            {/* Hero Icon */}
            <div
              className="mb-4 flex size-24 items-center justify-center rounded-2xl"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-hero)",
              }}
            >
              <FontAwesomeIcon
                icon={faEnvelopeOpenText}
                className="text-white"
                style={{ fontSize: "44px" }}
              />
            </div>

            {/* Title */}
            <h1 className="text-text-heading mb-2 text-4xl leading-tight font-bold">
              Wedding Thank You Card Generator
            </h1>

            {/* Subtitle */}
            <p className="text-text-body max-w-lg text-lg leading-relaxed">
              Generate personalized thank you messages with AI. Save time while
              keeping your gratitude heartfelt and genuine.
            </p>
          </div>

          {/* Action Cards */}
          <div className="flex flex-col gap-3">
            {/* Import Gift List Card */}
            <Button
              variant="card"
              size="auto"
              onClick={handleImportGiftList}
              className="group hover:border-indigo-300"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-5">
                <div
                  className="flex size-16 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--gradient-primary)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFileCsv}
                    className="text-white"
                    style={{ fontSize: "24px" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-text-heading text-xl font-bold">
                    Import Gift List
                  </h3>
                  <p className="text-text-body text-sm leading-relaxed">
                    Upload your CSV file with recipient names, addresses, and
                    gift details to get started
                  </p>
                </div>
              </div>
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="via-divider h-px flex-1 bg-linear-to-r from-transparent to-transparent" />
              <span className="text-text-subtle text-xs font-semibold tracking-wider uppercase">
                or
              </span>
              <div className="via-divider h-px flex-1 bg-linear-to-r from-transparent to-transparent" />
            </div>

            {/* Continue Previous Session Card */}
            <Button
              variant="card"
              size="auto"
              onClick={handleContinueSession}
              className="group hover:border-pink-300"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-5">
                <div
                  className="flex size-16 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--gradient-secondary)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFolderOpen}
                    className="text-white"
                    style={{ fontSize: "24px" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-text-heading text-xl font-bold">
                    Continue Previous Session
                  </h3>
                  <p className="text-text-body text-sm leading-relaxed">
                    Pick up where you left off with your saved progress and
                    approved messages
                  </p>
                </div>
              </div>
            </Button>
          </div>

          {/* Features */}
          <div className="flex justify-center gap-8">
            {/* AI-Powered */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="mb-3 flex size-12 items-center justify-center rounded-lg bg-white"
                style={{ boxShadow: "var(--shadow-icon)" }}
              >
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  className="text-indigo-500"
                  style={{ fontSize: "18px" }}
                />
              </div>
              <h4 className="text-text-heading mb-0.5 text-sm font-semibold">
                AI-Powered
              </h4>
              <p className="text-text-body text-xs leading-4">
                Personalized messages for each gift
              </p>
            </div>

            {/* Full Control */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="mb-3 flex size-12 items-center justify-center rounded-lg bg-white"
                style={{ boxShadow: "var(--shadow-icon)" }}
              >
                <FontAwesomeIcon
                  icon={faPenToSquare}
                  className="text-indigo-500"
                  style={{ fontSize: "18px" }}
                />
              </div>
              <h4 className="text-text-heading mb-0.5 text-sm font-semibold">
                Full Control
              </h4>
              <p className="text-text-body text-xs leading-4">
                Edit and approve every message
              </p>
            </div>

            {/* Easy Export */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="mb-3 flex size-12 items-center justify-center rounded-lg bg-white"
                style={{ boxShadow: "var(--shadow-icon)" }}
              >
                <FontAwesomeIcon
                  icon={faFileExport}
                  className="text-indigo-500"
                  style={{ fontSize: "18px" }}
                />
              </div>
              <h4 className="text-text-heading mb-0.5 text-sm font-semibold">
                Easy Export
              </h4>
              <p className="text-text-body text-xs leading-4">
                Download ready-to-print cards
              </p>
            </div>
          </div>

          {/* Getting Started Info Box */}
          <div
            className="border-border-light flex gap-3 rounded-lg border p-4 backdrop-blur-sm"
            style={{ background: "rgba(255, 255, 255, 0.6)" }}
          >
            <div className="bg-bg-info flex size-8 shrink-0 items-center justify-center rounded-md">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="text-blue-600"
                style={{ fontSize: "14px" }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-text-heading text-sm font-semibold">
                Getting Started
              </h4>
              <p className="text-text-body text-xs leading-relaxed">
                Your CSV should include recipient names, addresses, and gift
                details. You'll need an OpenRouter API key to generate messages.
                Don't worry, we'll guide you through the setup process.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: WelcomePage,
});
