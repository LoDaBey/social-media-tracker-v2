"use client";

import { useCallback, useState } from "react";
import type {
  StrategyCreateProjectInput,
  StrategyCreateProjectResult,
} from "@/types/strategy";

export function useCreateStrategyProject() {
  const [pending, setPending] = useState(false);

  const createProject = useCallback(
    async (
      input: StrategyCreateProjectInput
    ): Promise<StrategyCreateProjectResult> => {
      setPending(true);
      try {
        const response = await fetch("/api/admin/strategy/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await response.json()) as StrategyCreateProjectResult;
        if (!response.ok || !data.ok) {
          return {
            ok: false,
            error:
              !data.ok
                ? data.error
                : "Could not create the project.",
          };
        }
        return data;
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not create the project.",
        };
      } finally {
        setPending(false);
      }
    },
    []
  );

  return { createProject, pending };
}
