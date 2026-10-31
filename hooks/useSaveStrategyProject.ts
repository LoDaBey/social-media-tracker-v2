"use client";

import { useCallback, useState } from "react";
import type {
  StrategySaveProjectInput,
  StrategySaveProjectResult,
} from "@/types/strategy";

export function useSaveStrategyProject() {
  const [pending, setPending] = useState(false);

  const saveProject = useCallback(
    async (
      input: StrategySaveProjectInput
    ): Promise<StrategySaveProjectResult> => {
      setPending(true);
      try {
        const response = await fetch(
          `/api/admin/strategy/projects/${encodeURIComponent(input.slug)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              region: input.region,
              platforms: input.platforms,
              language: input.language,
              resources: input.resources,
              totalAccounts: input.totalAccounts,
              projectTargets: input.projectTargets,
              handlerTargets: input.handlerTargets,
              subProjects: input.subProjects,
            }),
          }
        );
        const data = (await response.json()) as StrategySaveProjectResult;
        if (!response.ok || !data.ok) {
          return {
            ok: false,
            error: !data.ok ? data.error : "Could not save the project.",
          };
        }
        return data;
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not save the project.",
        };
      } finally {
        setPending(false);
      }
    },
    []
  );

  return { saveProject, pending };
}
