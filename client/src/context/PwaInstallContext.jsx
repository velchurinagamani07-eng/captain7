import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PwaInstallContext = createContext(null);

export function PwaInstallProvider({ children }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setInstalled(Boolean(standalone));

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null);
  }, [promptEvent]);

  const value = useMemo(
    () => ({
      canInstall: Boolean(promptEvent && !installed),
      installApp,
      installed
    }),
    [installApp, installed, promptEvent]
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  }
  return context;
}
