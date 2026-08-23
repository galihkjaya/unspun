"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

/**
 * White mark on dark, black mark on light. Tracks the .light-mode class that
 * ThemeToggle applies to #root, so it swaps the instant the theme flips.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  const root = document.getElementById("root");
  if (root) observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export default function Logo() {
  const isDark = useSyncExternalStore(
    subscribe,
    () => !document.getElementById("root")?.classList.contains("light-mode"),
    () => true,
  );

  return (
    <Image
      src={isDark ? "/logo-light.png" : "/logo-dark.png"}
      alt="Unspun"
      width={1024}
      height={1024}
      className="h-7 w-auto"
      priority
    />
  );
}
