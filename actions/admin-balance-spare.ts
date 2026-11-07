"use server";

import { revalidatePath } from "next/cache";
import { requireFullAdminActor } from "@/lib/admin-access";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  applyCoverageSpareBalance,
  computeCoverageSpareBalance,
} from "@/lib/admin-balance-spare";
import { logOrbitAction } from "@/lib/orbit-log";
import type {
  AdminRegion,
  BalanceCoverageSpareResult,
} from "@/types/admin";

async function requireAdmin() {
  await requireFullAdminActor();
}

function asRegion(value: string): AdminRegion | null {
  if (
    value === "Overview" ||
    value === "Africa" ||
    value === "Europe" ||
    value === "Alphaa" ||
    value === "Asia"
  ) {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Strategy project slugs / other custom regions are valid AdminRegion values.
  return trimmed;
}

export async function balanceAdminCoverageSpare(
  regionValue: string,
  apply: boolean
): Promise<BalanceCoverageSpareResult> {
  try {
    await requireAdmin();
    const region = asRegion(regionValue);
    if (!region) {
      return {
        applied: false,
        marked: [],
        unmarked: [],
        missing: [],
        error: "Unknown admin region.",
      };
    }

    const preview = await computeCoverageSpareBalance(region);
    if (!apply) {
      return { ...preview, applied: false };
    }

    await applyCoverageSpareBalance(preview.marked, preview.unmarked);
    revalidatePath("/admin");
    revalidatePath("/admin/employees");
    revalidatePath("/admin/extract");
    await logOrbitAction({
      action: "fit_to_plan",
      resource: "coverage",
      summary: `Applied Fit to plan for ${region}`,
      details: {
        region,
        marked: preview.marked.length,
        unmarked: preview.unmarked.length,
        missing: preview.missing.length,
      },
    });
    return { ...preview, applied: true };
  } catch (error) {
    return {
      applied: false,
      marked: [],
      unmarked: [],
      missing: [],
      error: publicAdminMutationError(error),
    };
  }
}
