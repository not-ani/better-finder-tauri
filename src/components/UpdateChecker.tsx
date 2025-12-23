import { useEffect, useRef, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";
import { DownloadIcon, RefreshCwIcon, XIcon } from "lucide-react";

export function UpdateChecker() {
  const hasChecked = useRef(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkForUpdates = async () => {
      try {
        const update = await check();
        
        if (update) {
          toast.custom(
            (t) => (
              <UpdateToast
                version={update.version}
                notes={update.body || undefined}
                isUpdating={isUpdating}
                progress={progress}
                onUpdate={async () => {
                  setIsUpdating(true);
                  toast.dismiss(t);
                  
                  // Show progress toast
                  const progressToastId = toast.loading("Downloading update...", {
                    position: "top-center",
                  });

                  try {
                    let downloaded = 0;
                    let contentLength = 0;

                    await update.downloadAndInstall((event) => {
                      switch (event.event) {
                        case "Started":
                          contentLength = event.data.contentLength ?? 0;
                          break;
                        case "Progress":
                          downloaded += event.data.chunkLength;
                          const pct = contentLength > 0 
                            ? Math.round((downloaded / contentLength) * 100) 
                            : 0;
                          setProgress(pct);
                          toast.loading(`Downloading update... ${pct}%`, {
                            id: progressToastId,
                            position: "top-center",
                          });
                          break;
                        case "Finished":
                          toast.dismiss(progressToastId);
                          toast.success("Update installed! Restarting...", {
                            position: "top-center",
                            duration: 2000,
                          });
                          break;
                      }
                    });

                    // Relaunch after a short delay
                    setTimeout(async () => {
                      await relaunch();
                    }, 1500);
                  } catch (err) {
                    console.error("Update failed:", err);
                    toast.dismiss(progressToastId);
                    toast.error("Update failed. Please try again later.", {
                      position: "top-center",
                    });
                    setIsUpdating(false);
                  }
                }}
                onDismiss={() => toast.dismiss(t)}
              />
            ),
            {
              position: "top-center",
              duration: Infinity,
              className: "update-toast",
            }
          );
        }
      } catch (err) {
        // Silently fail - don't bother users with update check errors
        console.error("Failed to check for updates:", err);
      }
    };

    // Small delay to let the app fully initialize
    const timer = setTimeout(checkForUpdates, 2000);
    return () => clearTimeout(timer);
  }, [isUpdating, progress]);

  return null;
}

interface UpdateToastProps {
  version: string;
  notes?: string;
  isUpdating: boolean;
  progress: number;
  onUpdate: () => void;
  onDismiss: () => void;
}

function UpdateToast({ version, notes, onUpdate, onDismiss }: UpdateToastProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-popover p-4 shadow-lg min-w-[320px]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
        <DownloadIcon className="h-5 w-5 text-blue-500" />
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-popover-foreground">
              Update Available
            </p>
            <p className="text-sm text-muted-foreground">
              Version {version} is ready to install
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        
        {notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notes}
          </p>
        )}
        
        <div className="flex gap-2 pt-1">
          <button
            onClick={onUpdate}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            Update Now
          </button>
          <button
            onClick={onDismiss}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

