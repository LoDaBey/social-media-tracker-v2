"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { saveStrategyCountry } from "@/lib/strategy-plans-data";
import {
  normalizeStrategyTargets,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import type { StrategySaveCountryInput } from "@/types/strategy";

const saveSchema = z.object({
  book: z.enum(["alphaa", "africa_europe"]),
  country: z.string().trim().min(1),
  language: z.string().trim(),
  language2: z.string().trim().nullable().optional(),
  region: z.enum(["Africa", "Europe"]).optional(),
  resources: z.number().int().nonnegative(),
  totalAccounts: z.number().int().nonnegative(),
  projectTargets: z.unknown(),
  handlerTargets: z.unknown(),
});

async function requireAdmin() {
  const session = await auth();
  const adminId = Number(session?.user?.id);
  if (!Number.isFinite(adminId) || session?.user?.role !== "admin") {
    throw new Error("Unauthorized — admin only.");
  }
}

function revalidateStrategy() {
  revalidatePath("/admin");
  revalidatePath("/admin/strategy");
}

export async function saveStrategyCountryAction(
  input: StrategySaveCountryInput
): Promise<{ error: string } | { ok: true }> {
  try {
    await requireAdmin();
    const parsed = saveSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Check the country numbers and try again." };
    }
    const data = parsed.data;
    const projectTargets = normalizeStrategyTargets(data.projectTargets);
    const handlerTargets = normalizeStrategyTargets(data.handlerTargets);
    const totalAccounts =
      data.totalAccounts > 0
        ? data.totalAccounts
        : targetsGrandTotal(projectTargets);
    await saveStrategyCountry({
      book: data.book,
      country: data.country,
      language: data.language,
      language2: data.language2,
      region: data.region,
      resources: data.resources,
      totalAccounts,
      projectTargets,
      handlerTargets,
    });
    revalidateStrategy();
    return { ok: true };
  } catch (error) {
    return { error: publicAdminMutationError(error) };
  }
}
