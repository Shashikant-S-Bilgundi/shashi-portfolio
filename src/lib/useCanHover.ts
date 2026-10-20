// File: src/lib/useCanHover.ts
import { useSyncExternalStore } from "react";
import { MQ } from "./motion";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(MQ.hover);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** True on devices with a real hover (mouse, trackpad); false on touch. */
export function useCanHover(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(MQ.hover).matches ?? false,
    () => false,
  );
}