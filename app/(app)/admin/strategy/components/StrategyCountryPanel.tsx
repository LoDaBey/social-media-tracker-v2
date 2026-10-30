"use client";

import { useState } from "react";
import {
  missingCountByPlatform,
  strategyDisplayScopesForBook,
  strategyScopeTotal,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import { StrategyCountryToolbar } from "./StrategyCountryToolbar";
import { StrategyCountryTotals } from "./StrategyCountryTotals";
import { StrategyHandlerEditor } from "./StrategyHandlerEditor";
import { StrategyPlatformGrid } from "./StrategyPlatformGrid";
import { StrategyProjectGaps } from "./StrategyProjectGaps";
import type {
  StrategyCountryPanelProps,
  StrategyPlatformKey,
  StrategyScopeCounts,
} from "@/types/strategy";

export function StrategyCountryPanel({
  row,
  gaps,
  saving,
  onSave,
}: StrategyCountryPanelProps) {
  const [language, setLanguage] = useState(row.language);
  const [language2, setLanguage2] = useState(row.language2 ?? "");
  const [resources, setResources] = useState(row.resources);
  const [projectTargets, setProjectTargets] = useState<StrategyScopeCounts>(
    row.projectTargets
  );
  const [handlerTargets, setHandlerTargets] = useState<StrategyScopeCounts>(
    row.handlerTargets
  );
  const [highlightedPlatform, setHighlightedPlatform] =
    useState<StrategyPlatformKey | null>(null);
  const [highlightToken, setHighlightToken] = useState(0);

  const computedTotal = targetsGrandTotal(projectTargets);
  const showNative = strategyDisplayScopesForBook(row.book).includes("native");
  const projectLines = gaps?.project.lines ?? [];
  const missingTotal = Math.max(
    0,
    (gaps?.project.totalPlanned ?? row.totalAccounts) -
      (gaps?.project.totalActual ?? 0)
  );

  function handleSave() {
    onSave({
      book: row.book,
      country: row.country,
      language,
      language2: language2 || null,
      region: row.region === "Alphaa" ? undefined : row.region,
      resources,
      totalAccounts: computedTotal,
      projectTargets,
      handlerTargets,
    });
  }

  function handleSelectPlatform(platform: StrategyPlatformKey) {
    setHighlightedPlatform(platform);
    setHighlightToken((token) => token + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <StrategyCountryToolbar
        country={row.country}
        book={row.book}
        language={language}
        language2={language2}
        resources={resources}
        saving={saving}
        onLanguageChange={setLanguage}
        onLanguage2Change={setLanguage2}
        onResourcesChange={setResources}
        onSave={handleSave}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3">
          <StrategyCountryTotals
            allAccounts={computedTotal}
            target={row.totalAccounts}
            actual={gaps?.project.totalActual ?? 0}
            missing={missingTotal}
            personal={strategyScopeTotal(projectTargets, "personal")}
            umbrella={strategyScopeTotal(projectTargets, "umbrella")}
            native={strategyScopeTotal(projectTargets, "native")}
            showNative={showNative}
          />
          {gaps ? (
            <StrategyProjectGaps
              gaps={gaps.project}
              onSelectPlatform={handleSelectPlatform}
            />
          ) : null}
        </aside>

        <StrategyPlatformGrid
          book={row.book}
          value={projectTargets}
          onChange={setProjectTargets}
          missingByPlatform={missingCountByPlatform(projectLines)}
          highlightedPlatform={highlightedPlatform}
          highlightToken={highlightToken}
        />
      </div>

      <StrategyHandlerEditor
        book={row.book}
        value={handlerTargets}
        onChange={setHandlerTargets}
      />
    </div>
  );
}
