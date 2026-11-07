"use server";

import { getAdminViewerOrNull } from "@/lib/admin-access";
import { fetchAdminCommandPalettePeople } from "@/lib/admin-data";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import type { CommandPalettePerson } from "@/types/layout";

/** Top-bar search data, loaded when search opens (not with every page). */
export async function loadCommandPalettePeople(): Promise<CommandPalettePerson[]> {
  const viewer = await getAdminViewerOrNull();
  if (!viewer) return [];
  const people = await fetchAdminCommandPalettePeople();
  if (viewer.role !== "op" || !viewer.scope) return people;

  // Operation Managers only find people in their own project countries.
  const allowed = new Set(viewer.scope.countries);
  return people.filter((person) => {
    if (!person.country) return false;
    const base = baseCountryFromDisplay(person.country);
    return allowed.has(base) || allowed.has(person.country);
  });
}
