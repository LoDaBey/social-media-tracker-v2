"use client";

import { useState } from "react";
import {
  addStrategyScopeCounts,
  emptyStrategyScopeCounts,
  filterStrategyTargets,
  orderedStrategyPlatforms,
  strategyScopeTotal,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import { StrategyCountryTotals } from "./StrategyCountryTotals";
import { StrategyPlatformGrid } from "./StrategyPlatformGrid";
import { StrategyProjectPlatformPicker } from "./StrategyProjectPlatformPicker";
import { StrategyProjectToolbar } from "./StrategyProjectToolbar";
import { StrategySubProjectSection } from "./StrategySubProjectSection";
import type {
  StrategyPlatformKey,
  StrategyProject,
  StrategyProjectPanelProps,
  StrategyProjectRegion,
  StrategyScopeCounts,
  StrategySubProjectDraft,
} from "@/types/strategy";

function draftFromProject(project: StrategyProject): StrategySubProjectDraft {
  return {
    key: project.slug,
    slug: project.slug,
    name: project.name,
    language: project.language,
    resources: project.resources,
    projectTargets: project.projectTargets,
    handlerTargets: project.handlerTargets,
  };
}

function draftsFromProject(project: StrategyProject): StrategySubProjectDraft[] {
  return project.subProjects.map(draftFromProject);
}

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
  const [subProjects, setSubProjects] = useState<StrategySubProjectDraft[]>(
    draftsFromProject(project)
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(
    project.subProjects[0]?.slug ?? null
  );

  const selected = orderedStrategyPlatforms(platforms);
  const hasSubProjects = subProjects.length > 0;
  const derivedProjectTargets = hasSubProjects
    ? subProjects.reduce(
        (sum, item) => addStrategyScopeCounts(sum, item.projectTargets),
        emptyStrategyScopeCounts()
      )
    : projectTargets;
  const visibleProjectTargets = filterStrategyTargets(
    derivedProjectTargets,
    selected
  );
  const computedTotal = targetsGrandTotal(visibleProjectTargets);
  const computedResources = hasSubProjects
    ? subProjects.reduce((sum, item) => sum + item.resources, 0)
    : resources;

  function resetFromProject() {
    setRegion(project.region);
    setResources(project.resources);
    setPlatforms(project.platforms);
    setProjectTargets(project.projectTargets);
    const nextDrafts = draftsFromProject(project);
    setSubProjects(nextDrafts);
    setSelectedKey(nextDrafts[0]?.key ?? null);
  }

  function handlePlatformsChange(next: StrategyPlatformKey[]) {
    const ordered = orderedStrategyPlatforms(next);
    setPlatforms(ordered);
    setProjectTargets((current) => filterStrategyTargets(current, ordered));
    setSubProjects((current) =>
      current.map((item) => ({
        ...item,
        projectTargets: filterStrategyTargets(item.projectTargets, ordered),
      }))
    );
  }

  function handleAddSubProject(input: { name: string; language: string }) {
    const name = input.name.trim();
    if (
      subProjects.some(
        (item) => item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return false;
    }
    const draft: StrategySubProjectDraft = {
      key: `new-${name.toLowerCase()}-${Date.now()}`,
      slug: null,
      name,
      language: input.language,
      resources: 0,
      projectTargets: emptyStrategyScopeCounts(),
      handlerTargets: emptyStrategyScopeCounts(),
    };
    setSubProjects((current) => [...current, draft]);
    setSelectedKey(draft.key);
    return true;
  }

  function handleDeleteSubProject(key: string) {
    const remaining = subProjects.filter((item) => item.key !== key);
    setSubProjects(remaining);
    setSelectedKey((current) =>
      current === key ? remaining[0]?.key ?? null : current
    );
  }

  async function handleSave() {
    const ok = await onSave({
      slug: project.slug,
      region,
      platforms: selected,
      language: project.language,
      resources: computedResources,
      totalAccounts: computedTotal,
      projectTargets: visibleProjectTargets,
      handlerTargets: project.handlerTargets,
      subProjects: subProjects.map((item) => ({
        slug: item.slug ?? undefined,
        name: item.name,
        language: item.language,
        resources: item.resources,
        projectTargets: filterStrategyTargets(item.projectTargets, selected),
      })),
    });
    if (ok) setEditing(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <StrategyProjectToolbar
        name={project.name}
        region={region}
        regionOptions={regionOptions}
        resources={computedResources}
        resourcesLocked={hasSubProjects}
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
            ? "Choose at least one platform to set holdings and sub-projects."
            : "This project has no platforms yet. Edit the project to add some."}
        </p>
      ) : (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
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
              value={derivedProjectTargets}
              onChange={setProjectTargets}
              readOnly={!editing || hasSubProjects}
              description={
                hasSubProjects
                  ? "How many accounts this project holds, by platform. Totals come from the sub-projects below."
                  : editing
                    ? "How many accounts this project holds, by platform. Save project when done."
                    : "How many accounts this project holds, by platform."
              }
            />
          </div>
          <StrategySubProjectSection
            drafts={subProjects}
            selectedKey={selectedKey}
            platforms={selected}
            editing={editing}
            onSelect={setSelectedKey}
            onChange={(key, next) =>
              setSubProjects((current) =>
                current.map((item) => (item.key === key ? next : item))
              )
            }
            onAdd={handleAddSubProject}
            onDelete={handleDeleteSubProject}
          />
        </>
      )}
    </div>
  );
}
