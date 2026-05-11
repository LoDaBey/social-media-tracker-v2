"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  thisCyclePanel: ReactNode;
  historyPanel: ReactNode;
};

export function WalletTabs({ thisCyclePanel, historyPanel }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = searchParams.get("tab") === "history" ? "history" : "cycle";

  function selectTab(next: "cycle" | "history") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "history") params.set("tab", "history");
    else params.delete("tab");
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-[960px]">
      <div
        className="inline-flex rounded-full bg-[var(--color-cream-tint)] p-1"
        role="tablist"
        aria-label="Wallet sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cycle"}
          aria-label="This cycle activity"
          onClick={() => selectTab("cycle")}
          className="cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          style={
            tab === "cycle"
              ? {
                  background: "var(--color-surface)",
                  boxShadow: "0 4px 14px rgba(20,20,20,.08)",
                  color: "var(--color-ink)",
                }
              : { color: "var(--color-muted)" }
          }
        >
          This cycle
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          aria-label="Wallet history"
          onClick={() => selectTab("history")}
          className="cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          style={
            tab === "history"
              ? {
                  background: "var(--color-surface)",
                  boxShadow: "0 4px 14px rgba(20,20,20,.08)",
                  color: "var(--color-ink)",
                }
              : { color: "var(--color-muted)" }
          }
        >
          History
        </button>
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === "history" ? historyPanel : thisCyclePanel}
      </div>
    </div>
  );
}
