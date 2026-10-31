export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { logOrbitAction } from "@/lib/orbit-log";
import {
  filterStrategyTargets,
  isStrategyPlatformKey,
  normalizeStrategyTargets,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import { isStrategyProjectRegion, normalizeStrategyProjectRegion } from "@/lib/strategy-regions";
import {
  applyStrategyProjectRegionToAccounts,
  deleteStrategyProject,
  fetchStrategyProjectBySlug,
  saveStrategyProject,
} from "@/lib/strategy-projects-data";
import type {
  StrategyDeleteProjectResult,
  StrategySaveProjectResult,
} from "@/types/strategy";

const saveSubProjectSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(60),
  language: z.string().trim(),
  resources: z.number().int().nonnegative(),
  projectTargets: z.unknown(),
});

const saveSchema = z.object({
  region: z.string().trim().max(60),
  platforms: z.array(z.string()).min(1),
  language: z.string().trim(),
  resources: z.number().int().nonnegative(),
  totalAccounts: z.number().int().nonnegative(),
  projectTargets: z.unknown(),
  handlerTargets: z.unknown(),
  subProjects: z.array(saveSubProjectSchema).optional(),
});

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId) || session?.user?.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — admin only." } satisfies StrategySaveProjectResult,
      { status: 401 }
    );
  }

  const { slug } = await context.params;
  const existing = await fetchStrategyProjectBySlug(slug);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "That project was not found." } satisfies StrategySaveProjectResult,
      { status: 404 }
    );
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Check the project numbers and try again.",
        } satisfies StrategySaveProjectResult,
        { status: 400 }
      );
    }

    const region = normalizeStrategyProjectRegion(parsed.data.region);
    if (parsed.data.region.trim() && !isStrategyProjectRegion(region)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Choose a geographic region such as Gulf, Asia, or Levant.",
        } satisfies StrategySaveProjectResult,
        { status: 400 }
      );
    }

    const platforms = parsed.data.platforms.filter(isStrategyPlatformKey);
    if (platforms.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Choose at least one platform." } satisfies StrategySaveProjectResult,
        { status: 400 }
      );
    }

    const projectTargets = filterStrategyTargets(
      normalizeStrategyTargets(parsed.data.projectTargets),
      platforms
    );
    const handlerTargets = filterStrategyTargets(
      normalizeStrategyTargets(parsed.data.handlerTargets),
      platforms
    );
    const totalAccounts =
      parsed.data.totalAccounts > 0
        ? parsed.data.totalAccounts
        : targetsGrandTotal(projectTargets);
    const subProjects = (parsed.data.subProjects ?? existing.subProjects.map((child) => ({
      slug: child.slug,
      name: child.name,
      language: child.language,
      resources: child.resources,
      projectTargets: child.projectTargets,
    }))).map((item) => ({
      ...item,
      projectTargets: filterStrategyTargets(
        normalizeStrategyTargets(item.projectTargets),
        platforms
      ),
    }));

    await saveStrategyProject({
      slug,
      region,
      platforms,
      language: parsed.data.language,
      resources: parsed.data.resources,
      totalAccounts,
      projectTargets,
      handlerTargets,
      subProjects,
    });
    await applyStrategyProjectRegionToAccounts(existing.name, region);
    revalidatePath("/admin/strategy");
    await logOrbitAction({
      action: "strategy",
      resource: "strategy",
      summary: `Saved strategy project ${existing.name}`,
      details: { slug, region, platforms, totalAccounts },
    });

    return NextResponse.json({ ok: true } satisfies StrategySaveProjectResult);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: publicAdminMutationError(error),
      } satisfies StrategySaveProjectResult,
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId) || session?.user?.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — admin only." } satisfies StrategyDeleteProjectResult,
      { status: 401 }
    );
  }

  const { slug } = await context.params;
  const existing = await fetchStrategyProjectBySlug(slug);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "That project was not found." } satisfies StrategyDeleteProjectResult,
      { status: 404 }
    );
  }

  try {
    await deleteStrategyProject(slug);
    revalidatePath("/admin/strategy");
    await logOrbitAction({
      action: "delete",
      resource: "strategy",
      summary: `Deleted strategy project ${existing.name}`,
      details: { slug },
    });
    return NextResponse.json({ ok: true } satisfies StrategyDeleteProjectResult);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: publicAdminMutationError(error),
      } satisfies StrategyDeleteProjectResult,
      { status: 500 }
    );
  }
}
