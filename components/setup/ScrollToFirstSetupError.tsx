"use client";

import { useEffect } from "react";
import { scrollToFirstSetupError } from "@/lib/setup-scroll";
import type { ScrollToFirstSetupErrorProps } from "@/types/setup";

export function ScrollToFirstSetupError({ token }: ScrollToFirstSetupErrorProps) {
  useEffect(() => {
    if (token <= 0) return;

    const timer = window.setTimeout(() => {
      scrollToFirstSetupError();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [token]);

  return null;
}