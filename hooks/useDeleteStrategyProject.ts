"use client";

import { useCallback, useState } from "react";
import type { StrategyDeleteProjectResult } from "@/types/strategy";

export function useDeleteStrategyProject() {
  const [pending, setPending] = useState(false);

  const deleteProject = useCallback(
    async (slug: string): Promise<StrategyDeleteProjectResult> => {
      setPending(true);
      try {
        const response = await fetch(
          `/api/admin/strategy/projects/${encodeURIComponent(slug)}`,
          { method: "DELETE" }
        );
        const data = (await response.json()) as StrategyDeleteProjectResult;
        if (!response.ok || !data.ok) {
          return {
            ok: false,
            error: !data.ok ? data.error : "Could not delete the project.",
          };
        }
        return data;
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not delete the project.",
        };
      } finally {
        setPending(false);
      }
    },
    []
  );

  return { deleteProject, pending };
}
