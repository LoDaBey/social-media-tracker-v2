"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { HeaderSearchPaletteFooter } from "@/components/layout/HeaderSearchPaletteFooter";
import { HeaderSearchPaletteItem } from "@/components/layout/HeaderSearchPaletteItem";
import {
  COMMAND_PALETTE_SPARE_EVENT,
  commandPaletteGroups,
  flattenCommandPaletteGroups,
  readCommandPaletteRecent,
  rememberCommandPaletteItem,
} from "@/lib/admin-command-palette";
import type { HeaderSearchPaletteProps } from "@/types/layout";

export function HeaderSearchPalette({
  people,
  onClose,
}: HeaderSearchPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [recentIds] = useState(() => readCommandPaletteRecent());

  const groups = useMemo(
    () => commandPaletteGroups(query, people, recentIds),
    [people, query, recentIds]
  );
  const items = useMemo(() => flattenCommandPaletteGroups(groups), [groups]);
  const active = items[selected];

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector("[aria-selected='true']");
    node?.scrollIntoView({ block: "nearest" });
  }, [selected, items]);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function openItem(index: number) {
    const item = items[index];
    if (!item) return;
    rememberCommandPaletteItem(item.id);
    onClose();
    if (item.action === "spare") {
      window.dispatchEvent(new Event(COMMAND_PALETTE_SPARE_EVENT));
      return;
    }
    if (item.href) router.push(item.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((prev) => (items.length ? (prev + 1) % items.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((prev) =>
        items.length ? (prev - 1 + items.length) % items.length : 0
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openItem(selected);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close search"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 cursor-pointer bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search Orbit"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
        className="relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] shadow-[0_16px_48px_rgba(20,20,20,.18)]"
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-hairline)] px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-[var(--color-muted)]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search people, accounts, pages..."
            aria-label="Search people, accounts, and pages"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={active?.id}
            className="min-w-0 flex-1 rounded bg-transparent text-[14px] font-medium text-[var(--color-ink)] outline-none"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            Esc
          </button>
        </div>

        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="max-h-[min(560px,70vh)] overflow-y-auto px-2 py-2"
        >
          {items.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-[var(--color-muted)]">
              No people, accounts, or pages match.
            </p>
          ) : (
            groups.map((group, groupIndex) => {
              const start = groups
                .slice(0, groupIndex)
                .reduce((sum, row) => sum + row.items.length, 0);
              return (
                <section key={group.id} className="pb-2">
                  <h2 className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    {group.label}
                  </h2>
                  {group.items.map((item, itemIndex) => {
                    const index = start + itemIndex;
                    return (
                      <HeaderSearchPaletteItem
                        key={item.id}
                        item={item}
                        selected={index === selected}
                        onHover={() => setSelected(index)}
                        onSelect={() => openItem(index)}
                      />
                    );
                  })}
                </section>
              );
            })
          )}
        </div>
        <HeaderSearchPaletteFooter />
      </motion.div>
    </div>,
    document.body
  );
}
