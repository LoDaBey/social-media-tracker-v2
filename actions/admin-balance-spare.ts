"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import {
  applyCoverageSpareBalance,
  computeCoverageSpareBalance,
} from "@/lib/admin-balance-spare";
import type {
  AdminRegion,
  BalanceCoverageSpareResult,
} from "@/types/admin";

async function requireAdmin() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  const role = session?.user?.role;
  if (!Number.isFinite(adminId) || role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
}

function asRegion(value: string): AdminRegion | null {
  if (
    value === "Overview" ||
    value === "Africa" ||
    value === "Europe" ||
    value === "Alphaa"
  ) {
    return value;
  }
  return null;
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
