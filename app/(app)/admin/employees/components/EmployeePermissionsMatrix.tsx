"use client";

import type {
  AdminPermissionCrud,
  AdminPermissionPageKey,
  EmployeePermissionsMatrixProps,
} from "@/types/permissions";

const ACTIONS: { key: keyof AdminPermissionCrud; label: string }[] = [
  { key: "canCreate", label: "Create" },
  { key: "canRead", label: "Read" },
  { key: "canUpdate", label: "Update" },
  { key: "canDelete", label: "Delete" },
];

export function EmployeePermissionsMatrix({
  pages,
  disabled = false,
  onChange,
}: EmployeePermissionsMatrixProps) {
  function toggle(
    pageKey: AdminPermissionPageKey,
    current: AdminPermissionCrud,
    action: keyof AdminPermissionCrud
  ) {
    onChange(pageKey, { ...current, [action]: !current[action] });
  }

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)]">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead className="bg-[var(--color-cream-tint)]">
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-4 py-2.5">
              Page
            </th>
            {ACTIONS.map((action) => (
              <th
                key={action.key}
                scope="col"
                className="px-3 py-2.5 text-center"
              >
                {action.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => {
            const crud: AdminPermissionCrud = {
              canCreate: page.canCreate,
              canRead: page.canRead,
              canUpdate: page.canUpdate,
              canDelete: page.canDelete,
            };
            return (
              <tr
                key={page.pageKey}
                className="border-t border-[var(--color-hairline)]"
              >
                <th
                  scope="row"
                  className="px-4 py-3 text-[13px] font-semibold text-[var(--color-ink)]"
                >
                  {page.label}
                </th>
                {ACTIONS.map((action) => {
                  const checked = crud[action.key];
                  const inputId = `${page.pageKey}-${action.key}`;
                  return (
                    <td key={action.key} className="px-3 py-3 text-center">
                      <label
                        htmlFor={inputId}
                        className="inline-flex cursor-pointer items-center justify-center"
                      >
                        <span className="sr-only">
                          {page.label} {action.label}
                        </span>
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          aria-label={`${page.label} ${action.label}`}
                          onChange={() =>
                            toggle(page.pageKey, crud, action.key)
                          }
                          className="h-4 w-4 cursor-pointer rounded border-[var(--color-hairline)] accent-[var(--color-emerald)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </label>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
