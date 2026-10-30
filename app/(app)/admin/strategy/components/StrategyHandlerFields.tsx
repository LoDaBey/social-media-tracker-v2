"use client";

import {
  handlerFieldValue,
  setHandlerFieldValue,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import type { StrategyHandlerFieldsProps } from "@/types/strategy";

const inputClass =
  "h-9 w-14 rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-1 text-center text-[14px] font-semibold tabular-nums text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategyHandlerFields({
  value,
  onChange,
  fields,
}: StrategyHandlerFieldsProps) {
  const total = targetsGrandTotal(value);

  return (
    <div className="overflow-x-auto" aria-label="Handler template">
      <table className="w-max border-collapse text-left">
        <thead>
          <tr className="text-[12px] font-semibold text-[var(--color-muted)]">
            {fields.map((field) => (
              <th
                key={field.label}
                scope="col"
                className="px-1 pb-2 pr-3 font-semibold"
              >
                {field.label}
              </th>
            ))}
            <th scope="col" className="px-2 pb-2 text-right font-semibold">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {fields.map((field) => (
              <td key={field.label} className="px-1 py-0.5 pr-3">
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  aria-label={field.label}
                  className={inputClass}
                  value={handlerFieldValue(value, field)}
                  onChange={(event) =>
                    onChange(
                      setHandlerFieldValue(value, field, Number(event.target.value))
                    )
                  }
                />
              </td>
            ))}
            <td className="px-2 text-right text-[14px] font-semibold tabular-nums text-[var(--color-ink)]">
              {total}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
