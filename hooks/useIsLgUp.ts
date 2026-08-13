"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `lg` (1024px). */
export function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLgUp(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isLgUp;
}
