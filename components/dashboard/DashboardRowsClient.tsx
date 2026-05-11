"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { PlatformRow } from "@/components/dashboard/PlatformRow";
import { PlatformSubmissionDrawer } from "@/components/submission/PlatformSubmissionDrawer";
import type { DashboardRowsClientProps } from "@/types/dashboard";
import type { TempGrowth } from "@/types/db";

function emptySubmissionsByPlatform() {
  return {
    x: [],
    facebook_personal: [],
    facebook_umbrella: [],
    instagram: [],
    tiktok: [],
  } as Record<Platform, TempGrowth[]>;
}

function isPlatform(value: string | null): value is Platform {
  return Boolean(value && (PLATFORMS as string[]).includes(value));
}

export function DashboardRowsClient({
  accountPlatforms,
  accountsByPlatform,
  todaysSubmissionsByAccountId,
  platformStatus,
  initialJustSubmitted = null,
}: DashboardRowsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryJustSubmitted = searchParams.get("just_submitted");
  const [openPlatform, setOpenPlatform] = useState<Platform | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<Platform | null>(
    initialJustSubmitted ?? (isPlatform(queryJustSubmitted) ? queryJustSubmitted : null)
  );

  const submissionsByPlatform = useMemo(() => {
    const grouped = emptySubmissionsByPlatform();

    for (const platform of PLATFORMS) {
      const accountIds = new Set(accountsByPlatform[platform].map((account) => account.id));
      grouped[platform] = Object.values(todaysSubmissionsByAccountId).filter((submission) =>
        accountIds.has(submission.social_media_account_id)
      );
    }

    return grouped;
  }, [accountsByPlatform, todaysSubmissionsByAccountId]);

  useEffect(() => {
    if (!isPlatform(queryJustSubmitted)) return;

    router.replace("/dashboard", { scroll: false });
  }, [queryJustSubmitted, router]);

  useEffect(() => {
    if (!justSubmitted) return;
    const timeout = window.setTimeout(() => setJustSubmitted(null), 900);
    return () => window.clearTimeout(timeout);
  }, [justSubmitted]);

  function handleSubmitted(platform: Platform) {
    setJustSubmitted(platform);
    router.replace(`/dashboard?just_submitted=${platform}`, { scroll: false });
    router.refresh();
  }

  return (
    <>
      <div className="mt-4 flex flex-col gap-3">
        {accountPlatforms.map((platform) => (
          <PlatformRow
            key={platform}
            platform={platform}
            accounts={accountsByPlatform[platform]}
            status={platformStatus[platform]}
            onSubmitPlatform={setOpenPlatform}
            justSubmitted={justSubmitted === platform}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {openPlatform ? (
          <PlatformSubmissionDrawer
            key={openPlatform}
            platform={openPlatform}
            accounts={accountsByPlatform[openPlatform].map((account) => ({
              id: account.id,
              handle: account.account_handle ?? `@${account.account_name}`,
              url: account.account_url,
              current_followers: account.current_followers,
            }))}
            existingSubmissions={submissionsByPlatform[openPlatform]}
            open={true}
            onClose={() => setOpenPlatform(null)}
            onSubmitted={handleSubmitted}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
