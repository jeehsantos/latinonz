// Single source of truth for whether the public platform is live or whether
// we are still in waitlist-only mode. Today this is a localStorage flag set
// from the admin panel; later it will be backed by a server-fn / DB row.
// The hook signature stays the same when we wire it to the backend.

import { useEffect, useState } from "react";

const STORAGE_KEY = "latinonz_site_mode";
const PREVIEW_QS = "preview";
const PREVIEW_VALUE = "platform";

export type SiteMode = "waitlist" | "live";

export function getStoredSiteMode(): SiteMode {
  if (typeof window === "undefined") return "waitlist";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "live" ? "live" : "waitlist";
}

export function setStoredSiteMode(mode: SiteMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
  // Notify other tabs and our own listeners
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: mode }));
}

const PREVIEW_SESSION_KEY = "latinonz_preview_session";

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
 * - Admin can set "live" via the dashboard panel.
 * - Anyone can preview the live platform locally with `?preview=platform`
 *   (persisted in sessionStorage so navigation keeps the override).
 */
export function useSiteMode(): { mode: SiteMode; isPreview: boolean; ready: boolean } {
  const [mode, setMode] = useState<SiteMode>("waitlist");
  const [isPreview, setIsPreview] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMode(getStoredSiteMode());
    setIsPreview(hasPreviewOverride());
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMode(getStoredSiteMode());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const effective: SiteMode = isPreview ? "live" : mode;
  return { mode: effective, isPreview, ready };
}
