"use client";

import { groupHandlerFieldsByPlatform } from "@/lib/strategy-platforms";
import { StrategyHandlerSeatCard } from "./StrategyHandlerSeatCard";
import type { StrategyHandlerFieldsProps } from "@/types/strategy";

export function StrategyHandlerFields({
  value,
  onChange,
  fields,
  readOnly = false,
}: StrategyHandlerFieldsProps) {
  const groups = groupHandlerFieldsByPlatform(fields);

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"
      aria-label="Handler template"
    >
      {groups.map((group) => (
        <StrategyHandlerSeatCard
          key={group.platform}
          platform={group.platform}
          fields={group.fields}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
