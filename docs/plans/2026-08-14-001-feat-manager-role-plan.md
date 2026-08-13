---
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
title: Manager Role - Plan
---

# Manager Role - Plan

## Goal Capsule

**Objective:** Add a Manager role that owns SMD account setup for assigned employees, while Team lead continues QC.

**Product authority:** This plan is the product contract for Manager role, assignment, Manager home, and Manager-driven setup. QC, payroll, and employee daily submit stay as today except unlock rules.

**Open blockers:** None.

## Product Contract

### Summary

Managers are parallel to Team leads. Every employee must have a Manager. Managers hold one or more countries, see only reportees whose country is in that list, and complete setup (country → account holder + language → platforms by target). Employees no longer use self-setup; the dashboard unlocks when Manager setup is complete.

### Key Decisions

- Manager parallel to Team lead with separate `manager_id` and `team_lead_id` (session-settled: user-directed — chosen over replace/hierarchy: setup vs QC split).
- Manager-only setup; employee `/setup` removed; Manager required for every employee (session-settled: user-directed — chosen over dual edit / keep employee setup).
- Wizard: Country → Account holder (+ language) → dynamic platforms by targets (session-settled: user-directed — chosen over fixed six platform steps).
- Managers hold multiple countries; employee country independent; Manager UI shows reportees only when country ∈ Manager countries (session-settled: user-directed — revised from single-country force-match).
- Admin Manager picker: warn but allow country mismatch (session-settled: user-directed — chosen over filter-only / show-all silent).
- Incomplete setup blocks employee dashboard until Manager finishes language + required accounts.
- Only `employee` role requires a Manager.

### Requirements

- **R1.** Role `manager` available in Admin create/edit alongside employee, team_lead, admin.
- **R2.** Admin assigns one or more countries to a Manager.
- **R3.** Creating/editing an employee requires selecting a Manager; Team lead remains optional as today.
- **R4.** If employee country ∉ selected Manager’s countries, Admin sees a warning but can still save.
- **R5.** Manager home: table/groups by country (Manager’s countries), listing visible account holders (reportees) with setup status.
- **R6.** Clicking an account holder opens Manager setup for that person.
- **R7.** Setup step 1: country name + icon for Manager’s countries; selecting a country lists holders needing/available for that country.
- **R8.** Step 2: pick account holder; Manager sets language.
- **R9.** Later steps: only platforms with target count > 0; Manager fills the same account fields as today’s setup.
- **R10.** Employees with a Manager never use `/setup`; after setup complete they use `/dashboard`.
- **R11.** Team lead QC scoping unchanged (`team_lead_id`).

### Scope Boundaries

**In:** Manager role, multi-country assignment, manager_id on employees, Manager home, Manager setup wizard, Admin forms/warnings, route guards, remove employee self-setup.

**Out:** QC changes, Admin targets/wallet/payouts ownership transfer, new payroll features, redesign of employee submit UI.

### Acceptance Examples

- Admin creates Manager with Ghana + Nigeria; creates employee in Ghana assigned to that Manager → employee appears under Ghana for Manager.
- Same Manager assigned employee in Kenya (not in Manager countries) → Admin warned; employee hidden from Manager UI.
- Manager completes language + exact target accounts for a holder → that employee can open dashboard; incomplete → redirected/blocked from working dashboard.
- Employee with Manager visiting `/setup` is redirected away.
- Team lead still only QCs their `team_lead_id` reportees.

### Flows

1. **Admin creates Manager** → role Manager → multi-select countries → save.
2. **Admin creates employee** → must pick Manager (+ optional Team lead, country, etc.) → mismatch warning if needed → save.
3. **Manager login** → home grouped by their countries → holders → open setup → Country → Holder/language → platforms → save.
4. **Employee login** → if setup incomplete, blocked/waiting; if complete → dashboard.
