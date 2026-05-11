export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUnreadCount, listRecent } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [unreadCount, items] = await Promise.all([
    getUnreadCount(userId),
    listRecent(userId, 10),
  ]);

  return NextResponse.json({ unreadCount, items });
}
