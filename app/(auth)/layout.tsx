import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[var(--color-cream)] flex items-center justify-center p-6">
      {children}
    </div>
  );
}

