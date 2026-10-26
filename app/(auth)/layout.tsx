import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[var(--color-cream)] flex items-center justify-center p-6">
      <div className="absolute end-4 top-4 sm:end-6 sm:top-6">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}

