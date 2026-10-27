import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm } from "./components/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-[24px] font-extrabold text-[var(--color-ink)] sm:text-[32px]">
          Settings
        </h1>
        <p className="text-[15px] text-[var(--color-muted)]">
          Update the password you use to sign in to Orbit.
        </p>
      </header>

      <section
        className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 sm:p-8"
        style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
      >
        <h2 className="mb-5 text-[18px] font-bold text-[var(--color-ink)]">
          Change password
        </h2>
        <ChangePasswordForm email={session.user?.email ?? ""} />
      </section>
    </div>
  );
}
