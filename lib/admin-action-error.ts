import { z } from "zod";

const MISSING_SCHEMA_MESSAGE =
  "The production database is missing the manager-role update. Run npm run db:migrate against that database, then try again.";

function postgresCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  if (!("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function publicAdminMutationError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const messages = [
      ...new Set(
        error.issues
          .map((issue) => issue.message.trim())
          .filter((message) => message.length > 0)
      ),
    ];
    return messages.join(" ") || "Please review the form and try again.";
  }

  const code = postgresCode(error);
  if (code === "23505") return "Email already exists.";
  // undefined_column, undefined_table, check_violation — typical when 0006 was not applied
  if (code === "42703" || code === "42P01" || code === "23514") {
    return MISSING_SCHEMA_MESSAGE;
  }

  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();
    if (
      message.includes("column") ||
      message.includes("relation") ||
      message.includes("does not exist")
    ) {
      return MISSING_SCHEMA_MESSAGE;
    }
    if (message.length <= 180 && !message.includes("\n")) {
      return message;
    }
  }

  return "Could not save this account. Please try again.";
}
