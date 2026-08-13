const FIELD_SELECTOR = '[data-setup-field][aria-invalid="true"]';
const ADD_ACCOUNT_SELECTOR = "[data-setup-add-account]";
const ACCOUNT_ROW_SELECTOR = "[data-setup-account-row]";
const CARD_SELECTOR = '[data-setup-needs-accounts="true"]';

export function scrollToFirstSetupError() {
  const field = document.querySelector<HTMLElement>(FIELD_SELECTOR);
  const addAccount = document.querySelector<HTMLElement>(ADD_ACCOUNT_SELECTOR);
  const accountRows = document.querySelectorAll<HTMLElement>(ACCOUNT_ROW_SELECTOR);
  const lastAccountRow = accountRows[accountRows.length - 1] ?? null;
  const card = document.querySelector<HTMLElement>(CARD_SELECTOR);
  const target = field ?? addAccount ?? lastAccountRow ?? card;
  if (!target) return;

  target.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });

  if (field && typeof field.focus === "function") {
    window.setTimeout(() => {
      field.focus({ preventScroll: true });
    }, 400);
    return;
  }

  if (addAccount && typeof addAccount.focus === "function") {
    window.setTimeout(() => {
      addAccount.focus({ preventScroll: true });
    }, 400);
  }
}
