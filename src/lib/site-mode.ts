// Site mode: "waitlist" vs "live". Backed by the app_config DB row so it's
// shared across all visitors (was previously per-browser localStorage).
// `?preview=platform` still lets anyone preview the live platform locally.

import { useEffect, useState } from "react";
import { useSiteModeConfig, useUpdateAppConfig } from "@/hooks/useAppConfig";

const PREVIEW_QS = "preview";
const PREVIEW_VALUE = "platform";
const PREVIEW_SESSION_KEY = "latinonz_preview_session";

export type SiteMode = "waitlist" | "live";

function hasPreviewOverride(): boolean {
  if (typeof window === "undefined") return false;
  if (window.sessionStorage.getItem(PREVIEW_SESSION_KEY) === "1") return true;
  const fromQs = new URLSearchParams(window.location.search).get(PREVIEW_QS) === PREVIEW_VALUE;
  if (fromQs) window.sessionStorage.setItem(PREVIEW_SESSION_KEY, "1");
  return fromQs;
}

export function clearPreviewOverride() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PREVIEW_SESSION_KEY);
}

/**
 * Effective mode the visitor experiences.
 * - Admin can set "live" via the admin Settings page (persisted in DB).
 * - Anyone can preview the live platform locally with `?preview=platform`.
 */
export function useSiteMode(): { mode: SiteMode; isPreview: boolean; ready: boolean } {
  const { mode, isLoading } = useSiteModeConfig();
  const [isPreview, setIsPreview] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIsPreview(hasPreviewOverride());
    setHydrated(true);
  }, []);

  const effective: SiteMode = isPreview ? "live" : mode;
  return { mode: effective, isPreview, ready: hydrated && !isLoading };
}

/** Admin-only hook to flip the site mode. */
export function useSetSiteMode() {
  const updater = useUpdateAppConfig();
  return {
    setMode: (mode: SiteMode) => updater.mutate({ key: "site_mode", value: mode }),
    isUpdating: updater.isPending,
  };
}
