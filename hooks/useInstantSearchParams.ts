"use client";

import { useEffect, useMemo, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/*
 * Filters that feel instant: a click updates the shared filter state right away
 * (so chips / selects / tabs change at once), and the URL is updated last in a
 * background transition. Every filter on the page reads the same state, so quick
 * clicks on different filters never overwrite each other.
 */

type Pending = { path: string; query: string } | null;

let pending: Pending = null;
const listeners = new Set<() => void>();

function setPending(next: Pending) {
  pending = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Back / forward: the URL is the truth again.
  const onPopState = () => setPending(null);
  window.addEventListener("popstate", onPopState);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", onPopState);
  };
}

export type SearchParamsPatch = Record<string, string | null | undefined>;

export function useInstantSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const urlQuery = useSearchParams().toString();
  const shared = useSyncExternalStore(subscribe, () => pending, () => null);
  const [isPending, startTransition] = useTransition();

  const query = shared && shared.path === pathname ? shared.query : urlQuery;

  // Once the URL has caught up, drop the local copy.
  useEffect(() => {
    if (pending && pending.path === pathname && pending.query === urlQuery) {
      setPending(null);
    }
  }, [pathname, urlQuery]);

  const params = useMemo(() => new URLSearchParams(query), [query]);

  function update(patch: SearchParamsPatch) {
    // Start from the newest state at click time (another filter may have just
    // changed it in this same moment), not from this component's last render.
    const latest =
      pending && pending.path === pathname
        ? pending.query
        : window.location.search.replace(/^\?/, "");
    const next = new URLSearchParams(latest);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    }
    const nextQuery = next.toString();
    setPending({ path: pathname, query: nextQuery }); // 1. screen updates now
    startTransition(() => {
      // 2. URL updates last, without blocking the click.
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }

  return { params, update, isPending };
}
