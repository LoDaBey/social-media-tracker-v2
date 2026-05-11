import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dashboard-data";
import { PLATFORMS } from "@/lib/platform-config";
import { WalletPreviewCard } from "@/components/dashboard/WalletPreviewCard";
import { LevelCard } from "@/components/dashboard/LevelCard";
import { MissingAccountsBanner } from "@/components/dashboard/MissingAccountsBanner";
import { DashboardRowsClient } from "@/components/dashboard/DashboardRowsClient";
import { SubmissionCountdownChip } from "@/components/dashboard/SubmissionCountdownChip";
import type { Role, TempUser } from "@/types/db";
import type { DashboardData } from "@/types/dashboard";

function getTimeOfDayWord(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getCairoHour() {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date());

  return Number(hour);
}


function formatLongCairoDate() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function dateString(value: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function getCycleDay(todayCairoDate: string, cycleStart: string | Date | null) {
  const start = dateString(cycleStart);
  if (!start) return 1;

  const startMs = Date.UTC(
    Number(start.slice(0, 4)),
    Number(start.slice(5, 7)) - 1,
    Number(start.slice(8, 10))
  );
  const todayMs = Date.UTC(
    Number(todayCairoDate.slice(0, 4)),
    Number(todayCairoDate.slice(5, 7)) - 1,
    Number(todayCairoDate.slice(8, 10))
  );
  const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(30, diffDays));
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

function assignedAccountTargetTotal(user: TempUser) {
  return (
    user.target_x_count +
    user.target_facebook_personal_count +
    user.target_facebook_umbrella_count +
    user.target_instagram_count +
    user.target_tiktok_count
  );
}

function targetForPlatform(user: TempUser, platform: (typeof PLATFORMS)[number]) {
  if (platform === "x") return user.target_x_count;
  if (platform === "facebook_personal") return user.target_facebook_personal_count;
  if (platform === "facebook_umbrella") return user.target_facebook_umbrella_count;
  if (platform === "instagram") return user.target_instagram_count;
  return user.target_tiktok_count;
}

function hasCompletedAssignedAccounts(data: DashboardData) {
  if (assignedAccountTargetTotal(data.user) === 0) return true;

  return PLATFORMS.every(
    (platform) =>
      data.accountsByPlatform[platform].length === targetForPlatform(data.user, platform)
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user.role ?? "employee") as Role;
  if (role === "admin") redirect("/admin");
  if (role === "team_lead") redirect("/qc");

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) redirect("/login");

  const data = await getDashboardData(userId);
  if (!data) redirect("/login");

  const accountPlatforms = PLATFORMS.filter(
    (platform) => data.accountsByPlatform[platform].length > 0
  );

  if (!hasCompletedAssignedAccounts(data)) {
    redirect("/setup");
  }

  const timeOfDay = getTimeOfDayWord(getCairoHour());
  const cycleDay = getCycleDay(data.todayCairoDate, data.user.pay_cycle_start_date);

  return (
    <main className="w-full">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight text-[var(--color-ink)]">
            Good {timeOfDay}, {firstName(data.user.full_name)}
          </h1>
          <p className="mt-2 text-[13px] font-medium tracking-[0.04em] text-[var(--color-muted)]">
            {formatLongCairoDate()} · Day {cycleDay} of this pay cycle
          </p>
        </div>

        <SubmissionCountdownChip initialMs={data.windowClosesInMs} />
      </header>

      <section className="mt-6 flex flex-col gap-4 md:flex-row" aria-label="Wallet and level">
        <WalletPreviewCard wallet={data.wallet} />
        <LevelCard level={data.user.current_level} />
      </section>

      <MissingAccountsBanner missingAccounts={data.missingAccounts} />

      <section className="mt-8" aria-label="Today's accounts">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[24px] font-bold text-[var(--color-ink)]">
            Today&apos;s accounts
          </h2>
          <button
            type="button"
            aria-label="Filter platforms"
            className="cursor-pointer rounded-lg px-3 py-2 text-[12px] font-semibold text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            All platforms ▾
          </button>
        </div>

        <DashboardRowsClient
          accountPlatforms={accountPlatforms}
          accountsByPlatform={data.accountsByPlatform}
          todaysSubmissionsByAccountId={data.todaysSubmissionsByAccountId}
          platformStatus={data.platformStatus}
        />
      </section>

      <footer className="mt-8 text-center">
        <p className="text-[12px] font-normal text-[var(--color-muted)]">
          Submission window resets every 24 hours at 00:00 Cairo time.
        </p>
        <a
          href="mailto:support@temp.local"
          aria-label="Need help? Email support"
          className="mt-2 inline-flex cursor-pointer rounded-lg px-2 py-1 text-[13px] font-semibold text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          Need help?
        </a>
      </footer>
    </main>
  );
}

