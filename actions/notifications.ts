"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { markAllRead, markRead } from "@/lib/notifications";

async function requireUserId(): Promise<number> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId)) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function revalidateNotificationSurfaces() {
  revalidatePath("/api/notifications");
  revalidatePath("/", "layout");
}

export async function markReadAction(notificationId: number): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  if (!Number.isFinite(notificationId) || notificationId <= 0) {
    throw new Error("Invalid notification.");
  }
  await markRead(userId, notificationId);
  revalidateNotificationSurfaces();
  return { ok: true };
}

export async function markAllReadAction(): Promise<{ ok: boolean }> {
  const userId = await requireUserId();
  await markAllRead(userId);
  revalidateNotificationSurfaces();
  return { ok: true };
}
