export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { logOrbitAction } from "@/lib/orbit-log";
import { isStrategyPlatformKey } from "@/lib/strategy-platforms";
import { isStrategyProjectRegion } from "@/lib/strategy-regions";
import {
  applyStrategyProjectRegionToAccounts,
  createStrategyProject,
} from "@/lib/strategy-projects-data";
import type { StrategyCreateProjectResult } from "@/types/strategy";

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  region: z.string().trim().min(1).max(60),
  platforms: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId) || session?.user?.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — admin only." } satisfies StrategyCreateProjectResult,
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Give the project a name, region, and at least one platform.",
        } satisfies StrategyCreateProjectResult,
        { status: 400 }
      );
    }

    if (!isStrategyProjectRegion(parsed.data.region)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Choose a geographic region such as Gulf, Asia, or Levant.",
        } satisfies StrategyCreateProjectResult,
        { status: 400 }
      );
    }

    const platforms = parsed.data.platforms.filter(isStrategyPlatformKey);
    if (platforms.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Choose at least one platform.",
        } satisfies StrategyCreateProjectResult,
        { status: 400 }
      );
    }

    const project = await createStrategyProject({
      name: parsed.data.name,
      region: parsed.data.region,
      platforms,
    });
    await applyStrategyProjectRegionToAccounts(project.name, project.region);
    revalidatePath("/admin/strategy");
    await logOrbitAction({
      action: "strategy",
      resource: "strategy",
      summary: `Created strategy project ${project.name}`,
      details: { slug: project.slug, region: project.region, platforms },
    });

    return NextResponse.json({
      ok: true,
      project: { name: project.name, slug: project.slug },
    } satisfies StrategyCreateProjectResult);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: publicAdminMutationError(error),
      } satisfies StrategyCreateProjectResult,
      { status: 500 }
    );
  }
}
