import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import type { OrbitLogActor, OrbitLogWriteInput } from "@/types/logs";

function asJson(details: Record<string, unknown> | null | undefined) {
  if (!details) return "{}";
  try {
    return JSON.stringify(details);
  } catch {
    return "{}";
  }
}

/** Persist an Orbit action. Never throws — logging must not break the mutation. */
export async function logOrbitAction(input: OrbitLogWriteInput): Promise<void> {
  try {
    let actor: OrbitLogActor | null = input.actor ?? null;
    if (!actor) {
      const { auth } = await import("@/auth");
      const session = await auth();
      const id = Number(session?.user?.id);
      if (Number.isFinite(id)) {
        actor = {
          id,
          name: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
          role: session?.user?.role ?? "",
        };
      }
    }

    await pool.query(
      `INSERT INTO temp_action_logs
        (actor_id, actor_name, actor_email, actor_role, action, resource, summary, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        actor?.id ?? null,
        actor?.name?.trim() || "Unknown",
        actor?.email?.trim() || "",
        actor?.role?.trim() || "",
        input.action,
        input.resource,
        input.summary.trim().slice(0, 500),
        asJson(input.details),
      ]
    );
    revalidatePath("/admin/logs");
  } catch (error) {
    console.error("orbit action log failed", error);
  }
}
