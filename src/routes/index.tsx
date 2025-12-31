import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelopeOpenText,
  faFileImport,
  faFolderOpen,
  faWandMagicSparkles,
  faPenToSquare,
  faFileExport,
  faCircleInfo,
  faCircleQuestion,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import { loadSession } from "@/actions/file";

function WelcomePage() {
  const navigate = useNavigate();

  const handleImportGiftList = () => {
    navigate({ to: "/import" });
  };

  const handleContinueSession = async () => {
    try {
      const result = await loadSession();
      if (result) {
        navigate({ to: "/editor", search: { session: JSON.stringify(result) } });
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
      <main className="flex flex-1 items-center justify-center overflow-auto p-8">
        <div className="flex w-full max-w-2xl flex-col gap-12">
          {/* Hero Section */}
          <div className="flex flex-col items-center text-center">
            {/* Hero Icon */}
            <div
              className="mb-6 flex size-32 items-center justify-center rounded-3xl"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-hero)",
              }}
            >
              <FontAwesomeIcon
                icon={faEnvelopeOpenText}
                className="text-white"
                style={{ fontSize: "60px" }}
              />
            </div>

            {/* Title */}
            <h1 className="mb-4 text-5xl font-bold leading-tight text-text-heading">
              Wedding Thank You
              <br />
              Card Generator
            </h1>

            {/* Subtitle */}
            <p className="max-w-lg text-xl leading-relaxed text-text-body">
              Generate personalized thank you messages with AI. Save time while
              keeping your gratitude heartfelt and genuine.
            </p>
          </div>

          {/* Action Cards */}
          <div className="flex flex-col gap-4">
            {/* Import Gift List Card */}
            <button
              onClick={handleImportGiftList}
              className="group w-full cursor-pointer rounded-2xl border-2 border-transparent bg-white p-8 text-left transition-all hover:border-indigo-300 hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-6">
                <div
                  className="flex size-20 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--gradient-primary)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFileImport}
                    className="text-white"
                    style={{ fontSize: "30px" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold text-text-heading">
                    Import Gift List
                  </h3>
                  <p className="text-base leading-relaxed text-text-body">
                    Upload your CSV file with recipient names, addresses, and
                    gift details to get started
                  </p>
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-divider to-transparent" />
              <span className="text-sm font-semibold uppercase tracking-wider text-text-subtle">
                or
              </span>
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-divider to-transparent" />
            </div>

            {/* Continue Previous Session Card */}
            <button
              onClick={handleContinueSession}
              className="group w-full cursor-pointer rounded-2xl border-2 border-transparent bg-white p-8 text-left transition-all hover:border-pink-300 hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-6">
                <div
                  className="flex size-20 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--gradient-secondary)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faFolderOpen}
                    className="text-white"
                    style={{ fontSize: "30px" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold text-text-heading">
                    Continue Previous Session
                  </h3>
                  <p className="text-base leading-relaxed text-text-body">
                    Pick up where you left off with your saved progress and
                    approved messages
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Features */}
          <div className="flex justify-center gap-6">
            {/* AI-Powered */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="mb-4 flex size-14 items-center justify-center rounded-xl bg-white"
                style={{ boxShadow: "var(--shadow-icon)" }}
              >
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  className="text-indigo-500"
                  style={{ fontSize: "20px" }}
                />
              </div>
              <h4 className="mb-1 text-base font-semibold text-text-heading">
                AI-Powered
              </h4>
              <p className="text-sm leading-5 text-text-body">
                Personalized messages for
                <br />
                each gift
              </p>
            </div>

            {/* Full Control */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="mb-4 flex size-14 items-center justify-center rounded-xl bg-white"
                style={{ boxShadow: "var(--shadow-icon)" }}
              >
                <FontAwesomeIcon
                  icon={faPenToSquare}
                  className="text-indigo-500"
                  style={{ fontSize: "20px" }}
                />
              </div>
              <h4 className="mb-1 text-base font-semibold text-text-heading">
                Full Control
              </h4>
              <p className="text-sm leading-5 text-text-body">
                Edit and approve every
                <br />
                message
              </p>
            </div>

            {/* Easy Export */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div
                className="mb-4 flex size-14 items-center justify-center rounded-xl bg-white"
                style={{ boxShadow: "var(--shadow-icon)" }}
              >
                <FontAwesomeIcon
                  icon={faFileExport}
                  className="text-indigo-500"
                  style={{ fontSize: "20px" }}
                />
              </div>
              <h4 className="mb-1 text-base font-semibold text-text-heading">
                Easy Export
              </h4>
              <p className="text-sm leading-5 text-text-body">
                Download ready-to-print cards
              </p>
            </div>
          </div>

          {/* Getting Started Info Box */}
          <div
            className="flex gap-4 rounded-xl border border-border-light p-6 backdrop-blur-sm"
            style={{ background: "rgba(255, 255, 255, 0.6)" }}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-info">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="text-blue-600"
                style={{ fontSize: "18px" }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-semibold text-text-heading">
                Getting Started
              </h4>
              <p className="text-sm leading-relaxed text-text-body">
                Your CSV should include recipient names, addresses, and gift
                details. You'll need an OpenRouter API key to generate messages.
                Don't worry, we'll guide you through the setup process.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="flex items-center justify-between border-t border-border-light px-6 py-4 backdrop-blur"
        style={{ background: "rgba(255, 255, 255, 0.8)" }}
      >
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-text-body transition-colors hover:text-text-heading"
          >
            <FontAwesomeIcon icon={faCircleQuestion} className="size-3.5" />
            <span>Help & Documentation</span>
          </a>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-text-body transition-colors hover:text-text-heading"
          >
            <FontAwesomeIcon icon={faKey} className="size-3.5" />
            <span>Get OpenRouter API Key</span>
          </a>
        </div>
        <span className="text-sm text-text-muted">Version 1.0.0</span>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: WelcomePage,
});
