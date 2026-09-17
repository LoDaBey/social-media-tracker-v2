import { isSetupCountry } from "@/lib/setup-options";
import {
  reportingFieldsFromSupervisor,
  reportingValidationMessage,
} from "@/lib/role-hierarchy";
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
  } else if (input.role === "admin" || input.role === "op") {
    // Regional country is optional for global roles.
  } else if (!input.country.trim()) {
    errors.country = "Select a country.";
  } else if (!isSetupCountry(input.country.trim())) {
    errors.country = "Select a valid country.";
  }

  const reporting =
    input.role === "employee"
      ? {
          team_lead_id: input.team_lead_id,
          manager_id: input.manager_id,
          op_id: null,
        }
      : reportingFieldsFromSupervisor(
          input.role,
          input.supervisor_id ? Number(input.supervisor_id) : null
        );
  const reportingMessage = reportingValidationMessage(input.role, reporting);
  if (reportingMessage) {
    if (input.role === "employee") {
      errors.manager_id = reportingMessage;
    } else {
      errors.supervisor_id = reportingMessage;
    }
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
    errors.supervisor_id ??
    errors.manager_countries ??
    null
  );
}
