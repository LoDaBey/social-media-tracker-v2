"use client";

import { useCallback, useState } from "react";
import type {
  StrategyAddSubProjectInput,
  StrategyCreateSubProjectResult,
} from "@/types/strategy";

export function useCreateStrategyCountry(projectSlug: string) {
  const [pending, setPending] = useState(false);

  const createCountry = useCallback(
    async (
      input: StrategyAddSubProjectInput
    ): Promise<StrategyCreateSubProjectResult> => {
      setPending(true);
      try {
        const response = await fetch(
          `/api/admin/strategy/projects/${encodeURIComponent(projectSlug)}/countries`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );
        const data = (await response.json()) as StrategyCreateSubProjectResult;
        if (!response.ok || !data.ok) {
          return {
            ok: false,
            error: !data.ok ? data.error : "Could not create the country.",
          };
        }
        return data;
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not create the country.",
        };
      } finally {
        setPending(false);
      }
    },
    [projectSlug]
  );

  return { createCountry, pending };
}
