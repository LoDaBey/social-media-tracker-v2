import type { AdminFieldErrorProps } from "@/types/admin";

export function AdminFieldError({ id, message }: AdminFieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="text-[12px] font-medium text-[var(--color-coral)]">
      {message}
    </p>
  );
}
