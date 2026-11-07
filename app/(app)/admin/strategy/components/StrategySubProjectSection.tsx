"use client";

import { useState } from "react";
import {
  STRATEGY_SCOPE_LABELS,
  strategyVisibleScopes,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import { StrategyAddSubProjectButton } from "./StrategyAddSubProjectButton";
import { StrategyAddSubProjectModal } from "./StrategyAddSubProjectModal";
import { StrategyCountryCoverageModal } from "./StrategyCountryCoverageModal";
import { StrategyDeleteSubProjectButton } from "./StrategyDeleteSubProjectButton";
import { StrategyDeleteSubProjectModal } from "./StrategyDeleteSubProjectModal";
import { StrategyLanguageSelect } from "./StrategyLanguageSelect";
import { StrategyPlatformGrid } from "./StrategyPlatformGrid";
import { StrategySubProjectNav } from "./StrategySubProjectNav";
import type {
  StrategyAccountScope,
  StrategyAddSubProjectInput,
  StrategySubProjectDraft,
  StrategySubProjectSectionProps,
} from "@/types/strategy";

const SCOPE_DOT: Record<StrategyAccountScope, string> = {
  personal: "bg-[var(--color-emerald)]",
  umbrella: "bg-[#4A8EC7]",
  native: "bg-[var(--color-gold)]",
};

const fieldClass =
  "h-9 w-[64px] rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-center text-[13px] tabular-nums text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategySubProjectSection({
  drafts,
  selectedKey,
  platforms,
  scopes: scopesOverride,
  projectSlug,
  editing,
  canEdit = false,
  creatingCountry = false,
  onStartEdit,
  onSelect,
  onChange,
  onAdd,
  onDelete,
}: StrategySubProjectSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [coverageKey, setCoverageKey] = useState<string | null>(null);

  const selected = drafts.find((item) => item.key === selectedKey) ?? null;
  const scopes =
    scopesOverride ??
    strategyVisibleScopes("custom", [
      ...drafts.map((item) => item.projectTargets),
      ...drafts.map((item) => item.handlerTargets),
    ]);
  const coverageCountry =
    drafts.find((item) => item.key === coverageKey)?.name ?? null;
  const total = drafts.reduce(
    (sum, item) => sum + targetsGrandTotal(item.projectTargets),
    0
  );
  const deleteTarget = drafts.find((item) => item.key === deleteKey) ?? null;
  const showAdd = canEdit || editing;

  function openAdd() {
    if (!editing) onStartEdit?.();
    setAddError(null);
    setAddOpen(true);
  }

  async function handleAdd(input: StrategyAddSubProjectInput) {
    if (!editing) onStartEdit?.();
    const result = await onAdd(input);
    if (result === false) {
      setAddError("That country name is already used here.");
      return;
    }
    if (result && typeof result === "object" && result.ok === false) {
      setAddError(result.error);
      return;
    }
    setAddError(null);
    setAddOpen(false);
  }

  function patchSelected(next: Partial<StrategySubProjectDraft>) {
    if (!selected) return;
    onChange(selected.key, { ...selected, ...next });
  }

  return (
    <section
      aria-label="Sub-projects"
      className="flex min-w-0 flex-col gap-3 rounded-[16px] bg-[var(--color-cream-tint)] p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
            Countries
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
            Click a country to edit its plan. Double-click to open Strategy-style
            live coverage with missing accounts highlighted per holder.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ul className="flex flex-wrap items-center gap-3" aria-label="Category legend">
            {scopes.map((scope) => (
              <li
                key={scope}
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]"
              >
                <span className={`h-2 w-2 rounded-sm ${SCOPE_DOT[scope]}`} aria-hidden="true" />
                {STRATEGY_SCOPE_LABELS[scope]}
              </li>
            ))}
          </ul>
          <p className="text-[16px] font-bold tabular-nums text-[var(--color-ink)]">
            {total}
          </p>
          {showAdd && drafts.length > 0 ? (
            <StrategyAddSubProjectButton onClick={openAdd} />
          ) : null}
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[var(--color-surface)]/70 px-3 py-4">
          <p className="text-[13px] text-[var(--color-muted)]">
            No countries yet. Add a country, set Personal / Umbrella / Native
            counts per platform, then save the project.
          </p>
          {showAdd ? <StrategyAddSubProjectButton onClick={openAdd} /> : null}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <StrategySubProjectNav
              projects={drafts.map((item) => ({
                key: item.key,
                name: item.name,
                totalAccounts: targetsGrandTotal(item.projectTargets),
              }))}
              selectedKey={selectedKey}
              onSelect={onSelect}
              onOpenCoverage={setCoverageKey}
            />
          </div>

          {selected ? (
            <div className="flex flex-col gap-3">
              {editing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold text-[var(--color-ink)]">
                    {selected.name}
                  </p>
                  <StrategyLanguageSelect
                    id={`${selected.key}-language`}
                    label="Language"
                    value={selected.language}
                    allowEmpty
                    emptyLabel="None"
                    onChange={(language) => patchSelected({ language })}
                  />
                  <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]">
                    Resources
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={selected.resources}
                      aria-label={`${selected.name} resources`}
                      onChange={(event) =>
                        patchSelected({
                          resources: Number(event.target.value) || 0,
                        })
                      }
                      className={fieldClass}
                    />
                  </label>
                  <StrategyDeleteSubProjectButton
                    name={selected.name}
                    onClick={() => setDeleteKey(selected.key)}
                  />
                </div>
              ) : (
                <p className="text-[12px] font-medium text-[var(--color-muted)]">
                  {selected.name}
                  {selected.language ? ` · ${selected.language}` : ""}
                  {selected.resources > 0
                    ? ` · ${selected.resources} resources`
                    : ""}
                </p>
              )}
              <StrategyPlatformGrid
                book="custom"
                platforms={platforms}
                value={selected.projectTargets}
                onChange={(projectTargets) => patchSelected({ projectTargets })}
                showHeader={false}
                embedded
                readOnly={!editing}
                scopes={scopes}
                label={`${selected.name} holdings`}
              />
            </div>
          ) : null}
        </>
      )}

      <StrategyAddSubProjectModal
        open={addOpen}
        error={addError}
        pending={creatingCountry}
        onClose={() => {
          if (creatingCountry) return;
          setAddOpen(false);
          setAddError(null);
        }}
        onCreate={handleAdd}
      />
      <StrategyDeleteSubProjectModal
        open={Boolean(deleteTarget)}
        name={deleteTarget?.name ?? "this sub-project"}
        onClose={() => setDeleteKey(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          onDelete(deleteTarget.key);
          setDeleteKey(null);
        }}
      />
      <StrategyCountryCoverageModal
        open={Boolean(coverageCountry)}
        country={coverageCountry}
        projectSlug={projectSlug}
        onClose={() => setCoverageKey(null)}
      />
    </section>
  );
}
