"use client";

import { useState } from "react";
import {
  strategyDisplayScopesForBook,
  strategyScopeTotal,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import { StrategyCountryToolbar } from "./StrategyCountryToolbar";
import { StrategyCountryTotals } from "./StrategyCountryTotals";
import { StrategyHandlerEditor } from "./StrategyHandlerEditor";
import { StrategyPlatformGrid } from "./StrategyPlatformGrid";
import type {
  StrategyCountryPanelProps,
  StrategyScopeCounts,
} from "@/types/strategy";

export function StrategyCountryPanel({
  row,
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

  const computedTotal = targetsGrandTotal(projectTargets);
  const showNative = strategyDisplayScopesForBook(row.book).includes("native");

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
            personal={strategyScopeTotal(projectTargets, "personal")}
            umbrella={strategyScopeTotal(projectTargets, "umbrella")}
            native={strategyScopeTotal(projectTargets, "native")}
            showNative={showNative}
          />
        </aside>

        <StrategyPlatformGrid
          book={row.book}
          value={projectTargets}
          onChange={setProjectTargets}
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
