// Persisted dashboard sidebar color (per-browser preference).
import { useEffect, useState } from "react";

const KEY = "latinonz_sidebar_color";
export const DEFAULT_SIDEBAR_COLOR = "#0F3D24";

export function getStoredSidebarColor(): string {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_COLOR;
  return window.localStorage.getItem(KEY) || DEFAULT_SIDEBAR_COLOR;
}

export function setStoredSidebarColor(color: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, color);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: color }));
}

export function useSidebarColor(): [string, (c: string) => void] {
  const [color, setColor] = useState<string>(DEFAULT_SIDEBAR_COLOR);
  useEffect(() => {
    setColor(getStoredSidebarColor());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setColor(getStoredSidebarColor());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return [color, (c) => { setStoredSidebarColor(c); setColor(c); }];
}

// Mix a hex color with black by `amount` (0..1) to make it darker.
export function darken(hex: string, amount = 0.3): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Lighten by mixing with white.
export function lighten(hex: string, amount = 0.15): string {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (255 - v) * amount)));
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
