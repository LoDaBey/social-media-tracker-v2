export const runtime = "nodejs";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFullAdminActor } from "@/lib/admin-access";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import { logOrbitAction } from "@/lib/orbit-log";
import { createStrategySubProject } from "@/lib/strategy-projects-data";
import type { StrategyCreateSubProjectResult } from "@/types/strategy";

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  language: z.string().trim(),
  resources: z.number().int().nonnegative(),
});

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireFullAdminActor();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized — admin or Head of Department only.",
      } satisfies StrategyCreateSubProjectResult,
      { status: 401 }
    );
  }

  const { slug } = await context.params;

  try {
    const body = (await request.json()) as unknown;
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Check the country name and try again.",
        } satisfies StrategyCreateSubProjectResult,
        { status: 400 }
      );
    }

    const country = await createStrategySubProject(slug, parsed.data);
    revalidatePath("/admin/strategy");
    await logOrbitAction({
      action: "strategy",
      resource: "strategy",
      summary: `Created strategy country ${country.name}`,
      details: { parentSlug: slug, slug: country.slug, name: country.name },
    });

    return NextResponse.json({
      ok: true,
      country: { name: country.name, slug: country.slug },
    } satisfies StrategyCreateSubProjectResult);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: publicAdminMutationError(error),
      } satisfies StrategyCreateSubProjectResult,
      { status: 500 }
    );
  }
}
