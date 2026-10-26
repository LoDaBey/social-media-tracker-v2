"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { updateAlphaaEmployeeProfile } from "@/actions/admin-alphaa";
import { ALPHAA_SETUP_COUNTRIES } from "@/lib/setup-options";
import { AdminCountrySelect } from "@/components/admin/AdminCountrySelect";
import type { AlphaaEmployeeFormProps } from "@/types/admin";

const ROLE_OPTIONS = ["Handler", "Team Leader", "Manager"] as const;

const fieldClass =
  "rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

function uniqueLabels(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const label = value.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export function AlphaaEmployeeForm({ initial }: AlphaaEmployeeFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const base = useMemo(
    () => ({
      fullName: initial.fullName,
      email: initial.email,
      phone: initial.phone,
      roleLabel: initial.roleLabel,
      country: initial.country,
      department: initial.department,
      location: initial.location,
      projects: initial.projects.join(", "),
      isActive: initial.isActive,
    }),
    [initial]
  );
  const [form, setForm] = useState(base);
  const dirty = JSON.stringify(form) !== JSON.stringify(base);

  const roleOptions = uniqueLabels([...ROLE_OPTIONS, form.roleLabel]);
  const countryOptions = uniqueLabels([
    ...ALPHAA_SETUP_COUNTRIES,
    form.country,
  ]);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await updateAlphaaEmployeeProfile(initial.id, {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          roleLabel: form.roleLabel,
          country: form.country,
          department: form.department.trim() || null,
          location: form.location.trim() || null,
          projects: form.projects
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          isActive: form.isActive,
        });
        toast.success("Profile saved.");
        router.refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Save failed.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        ALPHAA profile
      </p>
      <p className="mt-1 text-[13px] text-[var(--color-muted)]">
        Updates this person in the ALPHAA users table. Team lead and manager
        stay assigned through projects.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-2 text-[14px] text-[var(--color-coral)]">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Name
          <input
            value={form.fullName}
            aria-label="ALPHAA employee name"
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Email
          <input
            type="email"
            value={form.email}
            aria-label="ALPHAA employee email"
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Phone
          <input
            value={form.phone}
            aria-label="ALPHAA employee phone"
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Role
          <select
            value={form.roleLabel}
            aria-label="ALPHAA employee role"
            onChange={(e) =>
              setForm((f) => ({ ...f, roleLabel: e.target.value }))
            }
            className={`cursor-pointer ${fieldClass}`}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Country
          <AdminCountrySelect
            value={form.country}
            countries={countryOptions}
            ariaLabel="ALPHAA employee country"
            onChange={(country) => setForm((f) => ({ ...f, country }))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Status
          <select
            value={form.isActive ? "active" : "deactivated"}
            aria-label="ALPHAA employee status"
            onChange={(e) =>
              setForm((f) => ({ ...f, isActive: e.target.value === "active" }))
            }
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="active">Active</option>
            <option value="deactivated">Suspended</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Department
          <input
            value={form.department}
            aria-label="ALPHAA employee department"
            onChange={(e) =>
              setForm((f) => ({ ...f, department: e.target.value }))
            }
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
          Location
          <input
            value={form.location}
            aria-label="ALPHAA employee location"
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-muted)] sm:col-span-2">
          Projects
          <input
            value={form.projects}
            aria-label="ALPHAA employee projects"
            placeholder="sudan, somalia"
            onChange={(e) =>
              setForm((f) => ({ ...f, projects: e.target.value }))
            }
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={pending || !dirty}
          onClick={() => {
            setForm(base);
            setError(null);
          }}
          aria-label="Cancel ALPHAA profile changes"
          className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
        >
          Cancel
        </motion.button>
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={pending || !dirty}
          onClick={submit}
          aria-label="Save ALPHAA profile"
          className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </motion.button>
      </div>
    </div>
  );
}
