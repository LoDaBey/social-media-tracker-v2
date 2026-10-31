"use client";

import { useEffect, useState } from "react";
import type { AdminOverviewUpdatedAtProps } from "@/types/admin";

function formatUpdatedAgo(iso: string, nowMs: number) {
  const delta = Math.max(0, nowMs - new Date(iso).getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 minute ago";
  if (minutes < 60) return `Updated ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Updated 1 hour ago";
  return `Updated ${hours} hours ago`;
}

export function AdminOverviewUpdatedAt({
  generatedAt,
}: AdminOverviewUpdatedAtProps) {
  const [label, setLabel] = useState("Updated just now");

  useEffect(() => {
    function tick() {
      setLabel(formatUpdatedAgo(generatedAt, Date.now()));
    }
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [generatedAt]);

  return <span>{label}</span>;
}
