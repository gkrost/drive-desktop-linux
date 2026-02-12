import { useEffect, useState, useRef } from "react";
import { Usage } from "../../../backend/features/usage/usage.types";

const USAGE_CACHE_DURATION = 30000; // 30 seconds cache

export default function useUsage() {
  const [usage, setUsage] = useState<Usage>();
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const lastFetchTime = useRef<number>(0);
  const cachedUsage = useRef<Usage | null>(null);

  async function updateUsage(forceRefresh = false) {
    try {
      const userIsLoggedIn = await window.electron.isUserLoggedIn();

      if (!userIsLoggedIn) {
        return;
      }

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;

      // Use cached data if available and not expired (unless forceRefresh is true)
      if (
        !forceRefresh &&
        cachedUsage.current &&
        timeSinceLastFetch < USAGE_CACHE_DURATION
      ) {
        setUsage(cachedUsage.current);
        setStatus("ready");
        return;
      }

      const getUsageResult = await window.electron.getUsage();
      console.log("getUsageResult", getUsageResult);
      if (getUsageResult.data) {
        setUsage(getUsageResult.data);
        cachedUsage.current = getUsageResult.data;
        lastFetchTime.current = now;
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch (err) {
      window.electron.logger.error({
        msg: "Error getting usage on useUsage",
        error: err,
      });
      setStatus("error");
    }
  }

  useEffect(() => {
    setStatus("loading");
    updateUsage();

    // Debounced usage updates on remote changes
    const debouncedUpdateUsage = () => {
      updateUsage(false);
    };

    const listener = window.electron.onRemoteChanges(debouncedUpdateUsage);
    return listener;
  }, []);

  return {
    usage,
    refreshUsage: () => updateUsage(true), // Force refresh when explicitly requested
    status,
  };
}
