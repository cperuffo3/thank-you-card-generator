import { useEffect, useRef } from "react";
import BaseLayout from "@/layouts/base-layout";
import { Outlet, createRootRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/context/session-context";
import { toast } from "sonner";
/* import { TanStackRouterDevtools } from '@tanstack/react-router-devtools' */

/*
 * Uncomment the code in this file to enable the router devtools.
 */

// Component to handle file open events from the main process
function FileOpenHandler() {
  const { loadSessionFromPath } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for file open events from main process
    const electronAPI = window.electronAPI;
    if (electronAPI) {
      electronAPI.onOpenCardFile(async (filePath: string) => {
        const result = await loadSessionFromPath(filePath);
        if (result.success) {
          if (result.hasRecipients) {
            toast.success("Card file loaded successfully");
            navigate({ to: "/editor", search: { recipients: "" } });
          } else {
            // Settings-only file - go to import page
            toast.success("Settings loaded. Import a gift list to continue.");
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
          }
        } else {
          toast.error("Failed to load card file");
        }
      });

      return () => {
        electronAPI.removeOpenCardFileListener();
      };
    }
  }, [loadSessionFromPath, navigate]);

  return null;
}

// Component to handle close confirmation (save before close)
function CloseConfirmationHandler() {
  const { saveCurrentSession } = useSession();
  const saveCurrentSessionRef = useRef(saveCurrentSession);

  // Keep ref in sync with current value
  useEffect(() => {
    saveCurrentSessionRef.current = saveCurrentSession;
  }, [saveCurrentSession]);

  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI) return;

    // Handle save request before close
    electronAPI.onCloseConfirmed(async (action) => {
      if (action === "save") {
        const result = await saveCurrentSessionRef.current();
        if (result.success) {
          // Trigger another close attempt
          window.close();
        } else {
          toast.error("Failed to save. Close cancelled.");
        }
      }
    });

    return () => {
      electronAPI.removeCloseListeners();
    };
  }, []);

  return null;
}

function Root() {
  return (
    <BaseLayout>
      <FileOpenHandler />
      <CloseConfirmationHandler />
      <Outlet />
      {/* Uncomment the following line to enable the router devtools */}
      {/* <TanStackRouterDevtools /> */}
    </BaseLayout>
  );
}

export const Route = createRootRoute({
  component: Root,
});
