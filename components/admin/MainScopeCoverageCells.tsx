import { Building2, Umbrella, User } from "lucide-react";
import { StrategyPlatformIcon } from "@/app/(app)/admin/strategy/components/StrategyPlatformIcon";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { STRATEGY_PLATFORM_LABELS } from "@/lib/strategy-platforms";
import type {
  MainScopeColumn,
  MainScopeCoverage,
  MainScopeKey,
} from "@/types/admin";

/** Narrow sub-column; the first one of each platform gets a divider. */
export const MAIN_SCOPE_COL = "w-[84px] min-w-[84px] max-w-[84px]";
const CELL = `whitespace-nowrap px-2 py-3 text-center ${MAIN_SCOPE_COL}`;
const GROUP_START = "border-l border-[var(--color-hairline)]";

const SCOPE: Record<
  MainScopeKey,
  { icon: typeof User; className: string; label: string }
> = {
  personal: {
    icon: User,
    className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    label: "Personal",
  },
  umbrella: {
    icon: Umbrella,
    className: "bg-[#4A8EC7]/15 text-[#4A8EC7]",
    label: "Umbrella",
  },
  native: {
    icon: Building2,
    className: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
    label: "Native",
  },
};

function platformLabel(column: MainScopeColumn) {
  return STRATEGY_PLATFORM_LABELS[column.platform] ?? column.platform;
}

/** `<col>`s for the split platform columns. */
export function MainScopeColGroup({ columns }: { columns: MainScopeColumn[] }) {
  return columns.flatMap((column) =>
    (column.scopes.length ? column.scopes : ["all"]).map((scope) => (
      <col key={`${column.platform}-${scope}`} className={MAIN_SCOPE_COL} />
    ))
  );
}

/** Top header row: one platform icon spanning its sub-columns. */
export function MainScopeGroupHeadCells({ columns }: { columns: MainScopeColumn[] }) {
  return columns.map((column) => {
    const span = Math.max(column.scopes.length, 1);
    return (
      <th
        key={column.platform}
        scope="colgroup"
        colSpan={span}
        // No split → the platform cell takes both header rows.
        rowSpan={column.scopes.length ? 1 : 2}
        className={`px-2 pb-1 pt-3 text-center align-bottom ${GROUP_START}`}
        title={platformLabel(column)}
      >
        <span className="inline-flex justify-center">
          <StrategyPlatformIcon platform={column.platform} className="h-6 w-6" />
          <span className="sr-only">{platformLabel(column)}</span>
        </span>
      </th>
    );
  });
}

/** Second header row: personal / umbrella / native icon per sub-column. */
export function MainScopeSubHeadCells({ columns }: { columns: MainScopeColumn[] }) {
  return columns.flatMap((column) =>
    column.scopes.map((scope, index) => {
      const meta = SCOPE[scope];
      const Icon = meta.icon;
      return (
        <th
          key={`${column.platform}-${scope}`}
          scope="col"
          className={`px-2 pb-2 pt-1 text-center ${index === 0 ? GROUP_START : ""}`}
          title={`${platformLabel(column)} ${meta.label.toLowerCase()}`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${meta.className}`}
            aria-hidden="true"
          >
            <Icon className="h-3 w-3" strokeWidth={2.25} />
          </span>
          <span className="sr-only">{`${platformLabel(column)} ${meta.label}`}</span>
        </th>
      );
    })
  );
}

/** Body / footer cells for one row. */
export function MainScopeBodyCells({
  columns,
  scopes,
  labelPrefix,
}: {
  columns: MainScopeColumn[];
  scopes?: MainScopeCoverage;
  labelPrefix: string;
}) {
  return columns.flatMap((column) => {
    const cells = scopes?.[column.platform];
    if (!column.scopes.length) {
      return (
        <td key={column.platform} className={`${CELL} ${GROUP_START}`}>
          <AdminCoverageCountCell
            count={{ actual: 0, target: 0 }}
            label={`${labelPrefix} ${platformLabel(column)} accounts`}
          />
        </td>
      );
    }
    return column.scopes.map((scope, index) => (
      <td
        key={`${column.platform}-${scope}`}
        className={`${CELL} ${index === 0 ? GROUP_START : ""}`}
      >
        <AdminCoverageCountCell
          count={cells?.[scope] ?? { actual: 0, target: 0 }}
          label={`${labelPrefix} ${platformLabel(column)} ${SCOPE[scope].label.toLowerCase()} accounts`}
        />
      </td>
    ));
  });
}
