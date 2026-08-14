import { SETUP_COUNTRIES } from "@/lib/setup-options";
import type {
  CreateEmployeeFieldErrors,
  ValidateCreateEmployeeInput,
} from "@/types/admin";

export function validateCreateEmployeeForm(
  input: ValidateCreateEmployeeInput
): CreateEmployeeFieldErrors {
  const errors: CreateEmployeeFieldErrors = {};

  if (!input.full_name.trim()) {
    errors.full_name = "Enter a full name.";
  }
  if (!input.email.trim()) {
    errors.email = "Enter an email.";
  }
  if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (input.role === "manager") {
    if (input.manager_countries.length === 0) {
      errors.manager_countries =
        "Select at least one country for this manager.";
    }
  } else if (!input.country.trim()) {
    errors.country = "Select a country.";
  } else if (
    !(SETUP_COUNTRIES as readonly string[]).includes(input.country.trim())
  ) {
    errors.country = "Select a valid country.";
  }

  if (input.role === "employee" && !input.manager_id) {
    errors.manager_id = "Select a manager for this employee.";
  }

  return errors;
}

export function firstCreateEmployeeError(
  errors: CreateEmployeeFieldErrors
): string | null {
  return (
    errors.full_name ??
    errors.email ??
    errors.password ??
    errors.country ??
    errors.manager_id ??
    errors.manager_countries ??
    null
  );
}
