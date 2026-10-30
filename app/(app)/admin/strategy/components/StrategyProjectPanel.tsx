"use client";

import { useState } from "react";
import {
  filterStrategyTargets,
  orderedStrategyPlatforms,
  strategyScopeTotal,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import { StrategyCountryTotals } from "./StrategyCountryTotals";
import { StrategyHandlerEditor } from "./StrategyHandlerEditor";
import { StrategyPlatformGrid } from "./StrategyPlatformGrid";
import { StrategyProjectPlatformPicker } from "./StrategyProjectPlatformPicker";
import { StrategyProjectToolbar } from "./StrategyProjectToolbar";
import type {
  StrategyPlatformKey,
  StrategyProjectPanelProps,
  StrategyProjectRegion,
  StrategyScopeCounts,
} from "@/types/strategy";

export function StrategyProjectPanel({
  project,
  saving,
  regionOptions,
  onSave,
  onDelete,
}: StrategyProjectPanelProps) {
  const [editing, setEditing] = useState(false);
  const [region, setRegion] = useState<StrategyProjectRegion | "">(
    project.region
  );
  const [resources, setResources] = useState(project.resources);
  const [platforms, setPlatforms] = useState<StrategyPlatformKey[]>(
    project.platforms
  );
  const [projectTargets, setProjectTargets] = useState<StrategyScopeCounts>(
    project.projectTargets
  );
  const [handlerTargets, setHandlerTargets] = useState<StrategyScopeCounts>(
    project.handlerTargets
  );

  const selected = orderedStrategyPlatforms(platforms);
  const visibleProjectTargets = filterStrategyTargets(projectTargets, selected);
  const visibleHandlerTargets = filterStrategyTargets(handlerTargets, selected);
  const computedTotal = targetsGrandTotal(visibleProjectTargets);

  function resetFromProject() {
    setRegion(project.region);
    setResources(project.resources);
    setPlatforms(project.platforms);
    setProjectTargets(project.projectTargets);
    setHandlerTargets(project.handlerTargets);
  }

  function handlePlatformsChange(next: StrategyPlatformKey[]) {
    const ordered = orderedStrategyPlatforms(next);
    setPlatforms(ordered);
    setProjectTargets((current) => filterStrategyTargets(current, ordered));
    setHandlerTargets((current) => filterStrategyTargets(current, ordered));
  }

  async function handleSave() {
    const ok = await onSave({
      slug: project.slug,
      region,
      platforms: selected,
      language: project.language,
      resources,
      totalAccounts: computedTotal,
      projectTargets: visibleProjectTargets,
      handlerTargets: visibleHandlerTargets,
    });
    if (ok) setEditing(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <StrategyProjectToolbar
        name={project.name}
        region={region}
        regionOptions={regionOptions}
        resources={resources}
        editing={editing}
        saving={saving}
        onEdit={() => setEditing(true)}
        onCancel={() => {
          resetFromProject();
          setEditing(false);
        }}
        onRegionChange={setRegion}
        onResourcesChange={setResources}
        onSave={() => {
          void handleSave();
        }}
        onDelete={onDelete}
      />

      <StrategyProjectPlatformPicker
        value={selected}
        readOnly={!editing}
        onChange={handlePlatformsChange}
      />

      {selected.length === 0 ? (
        <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-6 text-[14px] text-[var(--color-muted)]">
          {editing
            ? "Choose at least one platform to set holdings and the handler template."
            : "This project has no platforms yet. Edit the project to add some."}
        </p>
      ) : (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-3">
              <StrategyCountryTotals
                allAccounts={computedTotal}
                personal={strategyScopeTotal(visibleProjectTargets, "personal")}
                umbrella={strategyScopeTotal(visibleProjectTargets, "umbrella")}
                native={strategyScopeTotal(visibleProjectTargets, "native")}
                showNative
              />
            </aside>
            <StrategyPlatformGrid
              book="custom"
              platforms={selected}
              value={projectTargets}
              onChange={setProjectTargets}
              readOnly={!editing}
              description={
                editing
                  ? "How many accounts this project holds, by platform. Save project when done."
                  : "How many accounts this project holds, by platform."
              }
            />
          </div>
          <StrategyHandlerEditor
            book="custom"
            platforms={selected}
            value={handlerTargets}
            onChange={setHandlerTargets}
            readOnly={!editing}
            description="How many seats each resource on this project holds."
          />
        </>
      )}
    </div>
  );
}
