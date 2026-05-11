# ALPHAA

Internal employee dashboard for daily social submissions, **first-time account setup (`/setup`)**, wallet cycles, **in-app notifications**, and **quality-control (QC) review** for team leads and admins.

This app targets **Next.js 16** APIs and conventions; see `AGENTS.md` if anything differs from older Next.js docs.

---

## Setup

1. Copy `.env.example` into `.env.local` and fill in the values (PostgreSQL + Auth.js secret).
2. Install dependencies:

```bash
npm install
```

## Database

- Fill in `.env.local` with your Postgres credentials (local or hosted).
- Run **`npm run db:migrate`** to execute **every** `*.sql` file in **`db/migrations/`** in **lexicographic order** (there is **no** migrations journal table yet; files rely on **`IF NOT EXISTS`** / idempotent DDL where appropriate). Typical order:
  - **`0001_init.sql`** — `temp_users`, `temp_social_media_accounts`, `temp_growth`, `updated_at` triggers.
  - **`0002_wallet.sql`** — **`temp_wallet_transactions`** ledger (see [Wallet ledger & `/wallet`](#wallet-ledger--wallet) below).
  - **`0003_notifications.sql`** — creates **`temp_notifications`** (per-user rows with `type`, optional `category`, `title`, `body`, optional `action_route` for in-app navigation, `metadata` JSONB, `created_by`, read state, timestamps) plus indexes on `user_id`, unread partial index, `created_at`, and `type`.
- Run **`npm run db:seed`** to insert dev users and sample data.
- Run **`npm run db:seed-notifications`** when you want sample notification rows for `employee@temp.local`.
- After **`0002_wallet`** has been applied on an **existing** database that already has **`rejected_with_deduction`** growth rows, run **`npm run db:backfill-wallet`** at least once. It backfills **deduction** rows from growth + **base_salary** rows for active users with a pay cycle, uses **`ON CONFLICT DO NOTHING`**, and prints **`Backfilled N deductions, M base salaries.`** Safe to re-run.

**Dev login credentials** (after seed):

| Email | Role | Password |
|-------|------|----------|
| `admin@temp.local` | admin | `admin123` |
| `lead@temp.local` | team_lead | `admin123` |
| `employee@temp.local` | employee | `admin123` |

The seeded employee is assigned to the seeded team lead via `team_lead_id`.

## Run

```bash
npm run dev
```

Next.js may bind to **3000**, or another port if busy (e.g. **3001**). Use the URL printed in the terminal. If **`npm run dev`** exits because **another Next dev server is already running** on **3000**, stop the old process or use the URL the running server prints.

---

## First-time account setup (`/setup`)

New employees (or anyone who has not finished account onboarding) use **`/setup`** to register **exactly** the number of **`temp_social_media_accounts`** rows their admin assigned per platform (`temp_users.target_*_count`). Design follows Pack 1 tokens in **`app/globals.css`** (cream background, white cards, Cairo, emerald primary, coral warnings).

### When the user sees `/setup`

1. **`app/(app)/dashboard/page.tsx`** — After `getDashboardData`, if the user has **zero** social accounts across **all** platforms (`totalAccounts === 0`), the server **`redirect("/setup")`**. (Once they have at least one account, they stay on the dashboard; the **Missing accounts** banner still links to **`/setup`** when targets exceed active accounts.)
2. **`app/(app)/setup/page.tsx`** — Server component: **`auth()`**, loads **`temp_users`** target columns, loads all **`temp_social_media_accounts`** for the user, groups by **`platform`**. If the user has **no** platforms with `target > 0`, **`redirect("/dashboard")`**. If **every** assigned platform already has **exactly** `target` rows, **`redirect("/dashboard")`**. Otherwise renders **`SetupForm`**.

### Platform config (`lib/platform-config.ts`)

Single source of truth shared by setup UI, drawer, QC, and types:

- **`Platform`**, **`Metric`**, **`PLATFORMS`**, **`PLATFORM_LABELS`**, **`PLATFORM_TARGET_COLUMNS`** (maps each platform to the matching **`temp_users`** column).
- **`PLATFORM_ICONS`** — **`react-icons/fa6`** for X, Facebook, Instagram, TikTok. **Facebook (Umbrella)** uses the **same `FaFacebook`** icon as **Facebook (Personal)** (not a generic users icon).
- **`PLATFORM_TINTS`**, **`PLATFORM_METRICS`**, **`PLATFORM_DAILY_TARGETS`** (UI hints / daily submission columns), **`METRIC_LABELS`**.

**Dependency:** **`react-icons`** (see **`package.json`**).

### Client UI

| File | Role |
|------|------|
| **`components/setup/SetupForm.tsx`** | Holds per-platform row state; hero (64px emerald circle + **Lucide `Link`**); target strip chips; **fixed** bottom action bar (**full viewport width**, **`z-50`**, inner content **`max-w-7xl`** to match the main column); progress line **“X of Y — Z still missing”** (coral under target, emerald at target); **Save and continue** (disabled until counts + row fields valid); submits **`saveAccountsAction`** via **`FormData`** + **`useTransition`**; coral error banner above the bar. Main content wrapper **`max-w-7xl`**. Uses **logical** spacing where appropriate (**`paddingInline`**, etc.) for RTL. |
| **`components/setup/PlatformAccountsCard.tsx`** | One **white card per assigned platform** (except Facebook — see below). Header: tinted icon square, label, “valid of target” copy, **circular progress dial** + thin bar; **no platform dropdown** in rows (platform is fixed by the card). Rows: handle ( **`@` auto-prepended on blur** if missing), URL, numeric followers, trash. **`max-height` + internal scroll** when many rows. “Target met ✓” pill; defensive over-target coral copy. |
| **`components/setup/FacebookAccountsCard.tsx`** | **One combined card** for **Facebook (Personal)** and **Facebook (Umbrella)** when either has a target: two stacked sections separated by a **coral/red horizontal divider** (1px, semi-transparent). Each section mirrors row + progress behavior of **`PlatformAccountsCard`**. |
| **`components/setup/AddAccountButton.tsx`** | Shared **“+ Add account”** dashed emerald button for **all** platforms so styling matches. **Disabled** when at target: same emerald **text**/**border** family as enabled, lower **opacity**, **`cursor-not-allowed`** (enabled state uses **`cursor-pointer`**). |

**Initial UX:** Each section starts with **one empty row** (inputs open). **“+ Add account”** adds rows until **`targetCount`**; remove is blocked from deleting the last row (always at least one row when `target > 0`).

### Server action (`actions/setup.ts`)

- **`saveAccountsAction(formData)`** — reads JSON **`accounts`** plus **`userId`**, validates with **Zod** (platform, handle, URL via **`URL`**, followers).
- Confirms **per-platform counts** match **`temp_users`** targets (platforms with target **0** must contribute **zero** rows in the payload).
- **`BEGIN` → `DELETE FROM temp_social_media_accounts WHERE user_id = $1` → bulk `INSERT` → `COMMIT`** (idempotent re-save).
- Normalizes handle (leading **`@`**), derives **`account_name`** from handle for DB.
- On success **`redirect("/dashboard")`**; on validation failure returns **`{ error: string }`** for the coral banner.

### Routing / seed

- **`proxy.ts`** — **`/setup`** is in **`PROTECTED_APP_PATHS`** (unauthenticated users → **`/login`**).
- **`scripts/seed.ts`** — Employee seed includes all **`target_*`** columns (including **`target_facebook_umbrella_count`**). Uses **`ON CONFLICT (email) DO UPDATE`** so re-seeding refreshes targets without manual SQL.

The **`(app)`** layout wraps **`/setup`**, so the page uses the same app chrome as the dashboard (brand, **`DateBadge`**, avatar menu with sign-out, and **`NotificationBell`** when present).

### Project files reference (first-time setup)

| Path | Role |
|------|------|
| `app/(app)/setup/page.tsx` | Server page: auth, DB targets + accounts, redirect when complete or no targets. |
| `actions/setup.ts` | Server action: Zod validation, transactional delete + insert, redirect or `{ error }`. |
| `lib/platform-config.ts` | Platform types, labels, icons, tints, metrics, daily target hints, DB column map. |
| `components/setup/SetupForm.tsx` | Client shell: state, hero, chips, cards, fixed footer, save + errors. |
| `components/setup/PlatformAccountsCard.tsx` | Per-platform card (non-Facebook). |
| `components/setup/FacebookAccountsCard.tsx` | Combined Facebook Personal + Umbrella card + divider. |
| `components/setup/AddAccountButton.tsx` | Shared add-row button (enabled/disabled + cursor rules). |

---

## Real dashboard, grouped platform rows, and submission drawer

The old Pack 1 dashboard stub was replaced with the real employee dashboard at **`app/(app)/dashboard/page.tsx`**.

### Dashboard data loading

Dashboard data is centralized in **`lib/dashboard-data.ts`** through **`getDashboardData(userId)`**. It loads and returns:

- The active **`temp_users`** row.
- Active social accounts grouped by platform: **`Record<Platform, TempSocialMediaAccount[]>`**.
- Today's Cairo-date submissions grouped by account id.
- Per-platform daily status:
  - `totalAccounts`
  - `submittedAccounts`
  - `autoResetAccounts`
  - `lastSubmittedAt`
- Missing account counts per platform, derived from admin target counts minus active accounts.
- Wallet summary via **`computeWallet`**.
- Live submission window countdown in milliseconds until next **`00:00 Africa/Cairo`**.
- Today's Cairo date as `YYYY-MM-DD`.

The dashboard still renders as a server component, but the interactive account-row/drawer area is delegated to **`components/dashboard/DashboardRowsClient.tsx`**.

### Cairo timezone behavior

Daily boundaries use **`Africa/Cairo`** so the UI matches the intended cron/reset boundary:

- Dashboard greeting uses Cairo hour.
- Header date badge uses Cairo date.
- Today's submission query uses Cairo `YYYY-MM-DD`.
- Countdown chip closes at next Cairo midnight.
- Seed data for today's growth rows also uses Cairo date.

Important files:

- `components/dashboard/DateBadge.tsx`
- `components/dashboard/SubmissionCountdownChip.tsx`
- `lib/dashboard-data.ts`
- `lib/cairo-date.ts`
- `lib/cairo-month.ts`

### Dashboard layout

The dashboard now includes:

- Greeting row:
  - `Good morning`, `Good afternoon`, or `Good evening` based on Cairo hour.
  - Employee first name.
  - Long Cairo date.
  - Current pay-cycle day.
  - Live countdown chip.
- Wallet card:
  - Net balance.
  - Bonus chip when applicable.
  - Deduction chip when applicable.
  - Days-to-payout chip.
  - `Open wallet →` link to `/wallet`.
- Level card:
  - Level label from `LEVEL_LABELS`.
  - `Level {n}` display.
  - 6-segment progress bar.
  - Dynamic next-level caption.
- Missing accounts banner:
  - Rendered only when target counts exceed active account counts.
  - Combines multiple missing platform messages in one sentence.
  - Links back to `/setup`.
- Today's accounts:
  - One row per platform, **not one row per individual account**.
  - Row preview shows first two handles plus `+N more`.
  - Progress bar appears when any account on that platform has submitted.
  - Status chip variants for pending, partial, submitted, auto-reset, and mixed states.

Dashboard components:

- `components/dashboard/WalletPreviewCard.tsx`
- `components/dashboard/LevelCard.tsx`
- `components/dashboard/MissingAccountsBanner.tsx`
- `components/dashboard/PlatformRow.tsx`
- `components/dashboard/DashboardRowsClient.tsx`
- `components/dashboard/SubmissionCountdownChip.tsx`
- `components/dashboard/DateBadge.tsx`

### Wallet summary and level labels

Wallet math now runs through **`lib/wallet.ts`** and **`types/wallet.ts`**.

The wallet summary is ledger-based:

- `base_salary` credits.
- `level_adjustment` credits/debits.
- `bonus` credits.
- `deduction` debits.
- `payout` debits.

The level labels are shared through **`lib/level-labels.ts`**:

- 1: Bad
- 2: Accepted
- 3: Good
- 4: V. Good
- 5: Excellent
- 6: Super

### Per-platform submission drawer

The dashboard row action opens **`components/submission/PlatformSubmissionDrawer.tsx`**. It is a client component and does **not** navigate routes. The dashboard stays visible behind a soft scrim.

Drawer behavior:

- Desktop: side drawer pinned to the trailing edge.
- Mobile: bottom sheet, `92vh`, rounded top corners, drag handle.
- Focus is trapped inside the drawer while open.
- Escape closes the drawer from edit state.
- Escape steps back from confirmation state to edit state.
- Close button receives initial focus.
- The dialog uses `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.

Responsive drawer width:

- Mobile/small behavior stays as a bottom sheet.
- `md`: `720px` wide side drawer.
- `lg`: widened to `960px`.
- `xl`: widened to `1040px`.

That latest large-screen width change was added so X's full metric table can fit without forcing a horizontal scrollbar on large screens. Small and medium screen behavior intentionally remains unchanged.

Drawer content:

- Header:
  - Platform icon and tint.
  - `{PLATFORM_LABELS[platform]} update`.
  - Account count.
  - Pending/partial status pill.
- Table:
  - One row per account in the selected platform.
  - One column per metric in **`PLATFORM_METRICS[platform]`**.
  - Sticky leading account identity column.
  - Column target hints from **`PLATFORM_DAILY_TARGETS[platform]`**.
  - Follower column shows yesterday's value hint.
  - Stepper controls for editable metric cells.
  - Follower delta chip after typing.
  - Target-met and target-exceeded cell tinting.
  - Alternating row background.
  - Submitted rows are read-only and locked.
  - Auto-reset rows use coral styling and show `0`.
- Notes block:
  - One performance summary textarea for the whole platform batch.
  - Character counter.
- Sticky footer:
  - Default footer with lock note, Cancel, and Submit button.
  - In-place confirmation footer that expands upward.
  - Confirmation summary line per editable account.
  - Go back and Yes, submit all actions.

The confirmation is deliberately in the drawer footer, not a second modal.

### Batch submission server action

The drawer submits through **`actions/submissions.ts`**:

- **`submitPlatformBatch(platform, payload)`**.
- Validates payload with Zod.
- Authenticates through `auth()`.
- Confirms every submitted account id belongs to the signed-in user.
- Confirms all accounts match the platform being submitted.
- Uses today's date in Cairo time.
- Inserts into **`temp_growth`** with **`ON CONFLICT (social_media_account_id, submission_date) DO NOTHING`**.
- Snapshots platform daily targets into the `target_*` columns.
- Updates **`temp_social_media_accounts.current_followers`** to the submitted follower value.
- Runs inserts and follower updates in a transaction.
- Revalidates `/dashboard`.
- Returns `{ ok: true, inserted, justSubmitted }`.

After success, **`DashboardRowsClient`** closes the drawer, refreshes the dashboard, and uses the `?just_submitted={platform}` flow to trigger a small gold confetti puff on the row. The animation is defined in **`app/globals.css`**.

### Seed data for dashboard and drawer testing

`scripts/seed.ts` now creates dashboard-ready data:

- Admin: `admin@temp.local`
- Team lead: `lead@temp.local`
- Employee: `employee@temp.local`
- Employee base salary: `4500`
- Employee current level: `3` (`Good`)
- Employee targets:
  - X: `5`
  - Facebook personal: `1`
  - Facebook umbrella: `1`
  - Instagram: `2`
  - TikTok: `1`
- Five X accounts:
  - `@news_daily_eg`
  - `@sports_today`
  - `@culture_cairo`
  - `@tech_mena`
  - `@daily_deals_eg`
- One Facebook personal account:
  - `@mariam_updates`
- One Instagram account:
  - `@cairo_spotlight`
- One same-day Facebook auto-reset growth row with `rejected_with_deduction` and amount `120`, so dashboard/wallet/QC states can be seen immediately.

Before reseeding today's sample growth rows for those sample accounts, the seed deletes today's existing growth rows for them. This keeps the X drawer clean for testing `Submit 5 accounts` after reseeding.

### Verified drawer flow

Manual browser verification covered:

1. Sign in as `employee@temp.local`.
2. Open `/dashboard`.
3. Confirm X row shows `5 accounts`.
4. Click `Submit 5 accounts`.
5. Confirm drawer opens in place without route navigation.
6. Confirm X drawer table shows 5 rows and 4 metric columns:
   - Followers
   - Posts
   - Retweets
   - Replies
7. Type and increment values.
8. Confirm follower delta and cell tint behavior.
9. Click Submit.
10. Confirm footer expands into the in-place confirmation state.
11. Click Go back, then submit again.
12. Click Yes, submit all.
13. Confirm drawer closes and dashboard row refreshes to submitted/done state.
14. Reopen via View and confirm submitted rows are locked.

---

## Notifications

The notifications foundation is now active instead of being only a stub.

### Database and types

Notifications are stored in **`temp_notifications`** from **`db/migrations/0003_notifications.sql`**.

Columns include:

- `user_id`
- `type`
- `category`
- `title`
- `body`
- `action_route`
- `metadata`
- `created_by`
- `is_read`
- `read_at`
- `created_at`

Indexes support user lookups, unread counts, newest-first ordering, and type filtering.

Notification types are defined in **`types/notifications.ts`**:

- `submission_approved`
- `submission_rejected`
- `bonus_received`
- `payout_processed`
- `level_changed`
- `targets_changed`

### Data helper and server actions

**`lib/notifications.ts`** provides:

- **`createNotification(clientOrPool, input)`** — accepts either a `Pool` or transactional `PoolClient`, so notifications can be created inside QC/admin transactions or after a committed payout.
- **`getUnreadCount(userId)`** — unread badge count.
- **`listRecent(userId, limit = 10)`** — recent dropdown items.
- **`markRead(userId, notificationId)`** — marks one notification as read, scoped to the signed-in user.
- **`markAllRead(userId)`** — marks all notifications for the signed-in user as read.

**`actions/notifications.ts`** exposes:

- **`markReadAction(notificationId)`**
- **`markAllReadAction()`**

Both actions require an authenticated user, update only that user's rows, and revalidate notification surfaces: **`revalidatePath("/api/notifications")`** (so the next **`GET /api/notifications`** reflects new read state) and **`revalidatePath("/", "layout")`** (so server-rendered shell data tied to layout can refresh).

### API route

**`app/api/notifications/route.ts`** is a Node.js route handler that:

- Requires `auth()`.
- Returns `401` for unauthenticated users.
- Returns `{ unreadCount, items }`.
- Loads unread count and the latest 10 notifications in parallel.

### Header bell and dropdown

The app shell now renders **`NotificationBell`** in **`app/(app)/layout.tsx`**.

Notification UI components:

- **`components/notifications/NotificationBell.tsx`**
  - Client component.
  - Fetches `/api/notifications`.
  - Polls every 60 seconds.
  - Shows unread badge, capped at `99+`.
  - Closes on outside click and Escape.
- **`components/notifications/NotificationDropdown.tsx`**
  - Responsive dropdown/panel.
  - Mobile scrim.
  - `Mark all read` action.
  - Recent-notification list.
  - `Older notifications →` link.
- **`components/notifications/NotificationItem.tsx`**
  - Per-type visual icons and colors.
  - Marks unread item read before navigation.
  - Supports direct mark-read check button.
  - Uses `formatRelativeTime`.

The placeholder full history page is **`app/(app)/notifications/page.tsx`**. It currently tells users to use the bell for recent activity and links back to `/dashboard`.

### Notification producers

QC and admin flows now create real notifications:

- QC approval:
  - Type: `submission_approved`
  - Category: `qc`
  - Action route: `/dashboard`
  - Body includes account label, submission date, and reviewer name.
- QC rejection with deduction:
  - Type: `submission_rejected`
  - Category: `qc`
  - Creates the wallet deduction first through `recordDeduction`.
  - Uses the returned wallet transaction id to route to `/wallet?highlight={transactionId}` when available.
- QC rejection without deduction:
  - Type: `submission_rejected`
  - Category: `qc`
  - Action route: `/dashboard`
- Admin level change:
  - Type: `level_changed`
  - Category: `admin`
  - Body includes new level label and salary percentage from `LEVEL_SALARY_PERCENT`.
- Admin target change:
  - Type: `targets_changed`
  - Category: `admin`
  - Action route: `/setup`.
- Admin manual bonus:
  - Type: `bonus_received`
  - Category: `wallet`
  - Action route: `/wallet`.
- Admin payout:
  - Type: `payout_processed`
  - Category: `wallet`
  - Action route: `/wallet?tab=history`.

### Seed notifications

**`scripts/seed-notifications.ts`** inserts sample notifications for `employee@temp.local`:

- Approved submission.
- Bonus received.
- Payout processed.
- Level changed.
- Targets changed.

The script skips inserting if that employee already has any notifications.

Run it with:

```bash
npm run db:seed-notifications
```

---

## Quality control (QC) review — feature summary

Team leads and admins can open **`/qc`** to review pending **`temp_growth`** submissions from employees in scope: employees whose `temp_users.team_lead_id` matches the logged-in team lead; admins see **all** submissions.

### Route protection (`proxy.ts`)

This project uses **`proxy.ts`** as the Next.js 16 edge/auth wrapper (not a root `middleware.ts` file). Behavior:

- **Unauthenticated** users hitting protected app routes are redirected to **`/login`** (unchanged from before).
- **`/qc`** is allowed only for roles **`team_lead`** and **`admin`**. Wrong role → **`/dashboard`**.
- **`/admin`** (and paths under it) is allowed only for **`admin`**. Wrong role → **`/dashboard`**.
- Protected prefixes include `/dashboard`, `/setup`, `/accounts`, `/wallet`, `/qc`, `/submit`, `/admin`.

Additionally, **`app/(app)/qc/page.tsx`** calls `auth()` and redirects **`employee`** users to **`/dashboard`** (defense in depth).

### Page: `app/(app)/qc/page.tsx`

Server component that:

- Resolves **`searchParams`** (async in this Next version): `selected`, `status`, `platform`, `q`.
- Loads the queue via **`lib/qc-data.ts`** and KPIs in parallel.
- **Selection**: if `?selected={growth_id}` matches a row in the filtered queue, that row drives the detail panel; otherwise the **first** queue row is selected; empty queue shows an empty state in the detail panel.
- **Layout**: two columns from **`lg`** breakpoint (~1024px): left ~32% (queue + KPI + filters), right ~68% (detail). Single column stacked on smaller screens.
- **Header**: inline dark emerald pill **`QC · Team Lead`** or **`QC · Admin`** next to the **Review queue** title (cream page background, same app chrome as `(app)/layout.tsx`).

### Data layer: `lib/qc-data.ts`

- **`fetchQcQueue`**: joins `temp_growth`, `temp_users`, `temp_social_media_accounts`. Filters by QC status group (`pending` / `approved` / `rejected` mapped to DB statuses), optional platform, optional search on employee name and account name/handle (case-insensitive). **Team leads** add `u.team_lead_id = current user`; **admins** do not. Ordered by `COALESCE(submitted_at, created_at) DESC`.
- **`fetchQcKpis`**: **pending count** (scoped), **reviewed today** count where `qc_reviewed_by = current user` and Cairo calendar date of `qc_reviewed_at` equals today, **rejection rate** over the last 30 days: `rejected_* / non_pending` as a percentage.
- **`fetchPendingCountForReviewer`**: pending count for the app bar badge (same scope rules).
- **`parseQcSearchParams`**: validates and defaults query params.

Types live in **`types/qc.ts`** (`QcQueueRow`, `QcKpis`, `QcSearchParams`, status groups, etc.).

### UI components: `components/qc/`

| Component | Role |
|-----------|------|
| **`QcKpiStrip.tsx`** | Server. Three stat tiles (Pending, Reviewed today, Rejection rate); rejection rate number uses coral when **> 15%**. |
| **`QcQueueFilters.tsx`** | Client. Debounced search (~350ms) + submit; platform chips (All, X, Facebook, Instagram, TikTok); status chips (Pending, Approved, Rejected); updates URL via **`router.push`** with shallow navigation. |
| **`QcQueueItem.tsx`** | Server. **`Link`** to `/qc?...&selected={id}`; avatar initial, name, handle, platform icon, status chip (pending time-ago, approved, rejected with amount or “no deduction”); selected styling (emerald border + tint). |
| **`QcDetailPanel.tsx`** | Server. Context strip (employee, submitted time, platform, handle, **View account** external link), metrics vs targets from **`PLATFORM_METRICS`** for that platform, delta pills, optional employee note, auto-reset banner, **read-only** panel if already reviewed, otherwise wraps **`QcDecisionForm`**. |
| **`QcDecisionForm.tsx`** | Client. Three decision cards (Approve / Reject with deduction / Reject no deduction); deduction expands with numeric input, ± steppers, presets 100/250/500; optional comment; sticky footer row inside the card with Skip + **Confirm decision** (Framer Motion on buttons per project conventions). Calls server actions inside **`useTransition`**. Resets local state when **`growthId`** changes (derived update pattern for React 19 lint rules). |

### Server actions: `actions/qc.ts`

All use **`"use server"`**, **`pool.connect()`**, explicit **`BEGIN` / `COMMIT` / **`ROLLBACK`**.

1. **`approveSubmission(growthId, comment?)`** — Auth must be team_lead or admin. **`SELECT … FOR UPDATE`** on growth; verify scope (team lead matches employee’s `team_lead_id`, or admin); reject if not `pending`. Updates `temp_growth` to approved, sets reviewer and timestamps. Creates a **`submission_approved`** notification with account label, date, and reviewer name. **`revalidatePath`** for `/qc`, `/dashboard`, and **`/wallet`**.

2. **`rejectWithDeduction(growthId, amount, comment?)`** — Same lock and scope. Validates **`amount > 0`** with Zod. Updates growth to **`rejected_with_deduction`** and stores amount. Calls **`recordDeduction`** from **`lib/wallet-events.ts`** so a row is inserted into **`temp_wallet_transactions`** (negative amount, **`related_growth_id`**, **`created_by`** = reviewer). Reason text uses **`formatShortDate`** on the submission date and the account handle. Creates a **`submission_rejected`** notification whose action route points to **`/wallet?highlight={transactionId}`** when the deduction transaction id is available, then revalidates.

3. **`rejectNoDeduction(growthId, comment?)`** — Updates to **`rejected_no_deduction`**, **`qc_decision_amount = 0`**, no wallet row. Creates a **`submission_rejected`** notification with action route **`/dashboard`**, then revalidates.

Notifications are real rows in **`temp_notifications`** through **`lib/notifications.ts`**.

**Important SQL detail:** the locked row selects **`g.submission_date::date::text AS submission_date`** so `formatShortDate` always receives a **string**. Passing a JS **`Date`** from `pg` into that helper caused **`isoDate.slice is not a function`** during live testing.

### App layout: `app/(app)/layout.tsx`

- For **`team_lead`** and **`admin`**, a **`QC`** link to **`/qc`** with an **emerald underline-on-hover** style and a **badge** showing **`fetchPendingCountForReviewer`** when **> 0**.
- **`Admin`** link for **`role === 'admin'`** (before **QC** in the header).
- **`NotificationBell`** appears in the header for authenticated users and loads recent notification state from `/api/notifications`.

---

## PostgreSQL `DATE` handling: `lib/db.ts` + `lib/cairo-date.ts`

1. **`lib/db.ts`** — The **`pg`** driver’s default parser maps Postgres **`DATE`** (OID **1082**) to JavaScript **`Date`**. Using **`.toISOString().slice(0, 10)`** on that value can **shift the calendar day** for non-UTC zones (e.g. Cairo **UTC+3**), so **`pay_cycle_start_date`** might not match **`cycle_start_date`** on wallet rows and the **“this cycle”** query returns **no rows**.
   **Fix:** **`types.setTypeParser(1082, (value: string) => value)`** so **`DATE`** columns are returned as **`YYYY-MM-DD` strings**.

2. **`lib/cairo-date.ts`** — **`normalizePgDateColumn(value)`** still normalizes **`Date` | string | null** for any code path where a **`Date`** slips through (defense in depth). **`lib/wallet.ts`** (`computeWallet`) and **`app/(app)/wallet/page.tsx`** use it for **`pay_cycle_start_date`**. **`types/db.ts`** types that field as **`string | Date | null`**.

Earlier, calling **`.slice(0, 10)`** directly on **`pay_cycle_start_date`** caused **`slice is not a function`** when **`pg`** returned a **`Date`**; the above fixes address both failure modes.

---

## Wallet ledger & `/wallet`

The dashboard **wallet preview** and the employee **`/wallet`** page read **real ledger rows** in **`temp_wallet_transactions`**, not only derived aggregates from **`temp_growth`**.

### Table: `temp_wallet_transactions` (`0002_wallet.sql`)

| Column | Purpose |
|--------|---------|
| `user_id` | FK → `temp_users` |
| `type` | **`base_salary`** \| **`level_adjustment`** \| **`bonus`** \| **`deduction`** \| **`payout`** (CHECK) |
| `amount` | Signed **`NUMERIC(10,2)`** — credits positive, debits negative |
| `reason` | Shown in wallet activity |
| `cycle_start_date` | Which 30-day cycle the row belongs to |
| `related_growth_id` | Optional FK → `temp_growth` (typical for deductions) |
| `created_by` | Optional FK → `temp_users` (manual / reviewer); **`NULL`** for system rows |
| `created_at` | Default **`CURRENT_TIMESTAMP`** |

**Indexes:** `user_id`, `cycle_start_date`, `type`, **`(user_id, cycle_start_date)`**.

**Partial unique indexes**

- **`uniq_twt_deduction_per_growth`** on **`related_growth_id`** where **`type = 'deduction'`** — at most one deduction per growth row; backfill / retries use **`ON CONFLICT DO NOTHING`**.
- **`uniq_twt_base_salary_per_cycle`** on **`(user_id, cycle_start_date)`** where **`type = 'base_salary'`** — one base salary credit per employee per cycle.

### Backfill: `scripts/backfill-wallet.ts` → `npm run db:backfill-wallet`

- Loads **`.env.local`**, uses **`lib/db`** pool.
- **Deductions:** every **`temp_growth`** with **`qc_status = 'rejected_with_deduction'`** and **`qc_decision_amount > 0`** → insert **`deduction`**, **`amount = -qc_decision_amount`**, reason **`Rejected submission · {account_handle} · {submission_date}`**, **`related_growth_id`**, **`created_by = qc_reviewed_by`**, **`cycle_start_date = COALESCE(user.pay_cycle_start_date, submission_date)`** (joins **`temp_users`** + **`temp_social_media_accounts`**).
- **Base salary:** every **active** user with **`pay_cycle_start_date` IS NOT NULL** → insert **`base_salary`** for that cycle if missing.

### Server code

- **`lib/wallet.ts`** — **`computeWallet(user)`**: **`SUM(amount)`**-style aggregation **per `type`** for the current **`pay_cycle_start_date`** cycle; builds **`WalletSummary`** (**`types/wallet.ts`**): **`baseSalary`**, **`levelAdjustmentTotal`** / **`levelAdjustment`**, **`bonusesTotal`**, **`bonusesCount`**, **`deductionsTotal`** (positive magnitude), **`deductionsCount`**, **`netBalance`**, **`daysToPayout`** (0–30), **`cycleStart`** / **`cycleEnd`**. Re-exports **`WalletSummary`** for existing imports.
- **`lib/wallet-page-data.ts`** — This-cycle transaction list (joins **`qc_comment`**, creator **`full_name`**), **history** grouped by **`cycle_start_date`** with **`BOOL_OR(type = 'payout')`**, **30-day strip** data from **`temp_growth`** (`approved` / `is_auto_reset` per day in the cycle window).
- **`lib/wallet-events.ts`** — **`recordDeduction`**, **`recordBonus`**, **`recordBaseSalary`** (idempotent), **`recordLevelAdjustment`**, **`recordPayout`**; all accept a **`pg` `PoolClient`** for transactional callers (admin payout, QC rejection, etc.). Level labels for adjustment copy come from **`lib/level-labels.ts`** (not **`lib/wallet.ts`**, so client bundles do not pull **`pg`**).

### Employee UI: `app/(app)/wallet/page.tsx` + `components/wallet/`

Server page: **`auth()`**, load user, parallel **`computeWallet`** + data helpers. **`searchParams`** is awaited as a **Promise**; **`highlight`** is normalized to a single string, parsed as a number, and passed down as **`highlightTxId`** so the matching **`TransactionRow`** receives **`highlighted`**.

**`ScrollToWalletHighlight`** and **`WalletTabs`** are wrapped in **`Suspense`** (with a lightweight skeleton fallback) because they are client-driven and participate in navigation / scroll behavior after hydration.

| File | Role |
|------|------|
| **`WalletHero.tsx`** | Large **EGP** net balance, “WALLET — CURRENT CYCLE”, payout line, three stat tiles (base / bonuses / deductions). |
| **`CycleTimeline.tsx`** | 30 segments (submitted / reset / future / gap); today highlighted. |
| **`WalletTabs.tsx`** | **Client** pill tabs: **This cycle** vs **History**. Tab changes use **`URLSearchParams`** cloned from the current URL so **`?tab=history`** is toggled **without dropping** other keys such as **`highlight`**. |
| **`TransactionRow.tsx`** | Activity cards (Lucide icons, gold/coral/neutral amounts); root sets **`data-tx-id={row.id}`** for **`ScrollToWalletHighlight`**; optional emerald ring when **`highlighted`**; **“Why?”** → **`/qc?selected={related_growth_id}`** when set (same **`selected`** query as **`QcQueueItem`**). **Note:** **`/qc`** is reviewer-only; employees are redirected to **`/dashboard`** by **`proxy.ts`** / **`qc/page.tsx`**. |
| **`ScrollToWalletHighlight.tsx`** | **Client**; **`useEffect`** selects **`[data-tx-id="…"]`** and **`scrollIntoView({ block: "center", behavior: "smooth" })`**; renders **`null`**. |
| **`HistoryRow.tsx`** | Past cycles, paid vs pending, net line. |
| **`HistoryDownloadButton.tsx`** | **Client**; Framer Motion on the icon button; **TODO** PDF export. |

Footer: copy about 30-day payout and contacting a team lead. **“← Back to dashboard”** at top of page.

The wallet page accepts **`?highlight={transactionId}`** (ledger row id). When present, the matching **`TransactionRow`** gets an emerald ring and **`ScrollToWalletHighlight`** scrolls it into view. **`rejectWithDeduction`** sets **`action_route`** to **`/wallet?highlight={id}`** when **`recordDeduction`** returns the new transaction id so the notification opens on the exact deduction line.

### Dashboard preview: `components/dashboard/WalletPreviewCard.tsx`

Uses **`WalletSummary`**: **`+{bonusesCount} bonuses`** only if **`bonusesCount > 0`**, **`−{deductionsCount} deductions`** only if **`deductionsCount > 0`**, **`{daysToPayout} days to payout`** always, **Open wallet →** links to **`/wallet`**.

### QC integration (new deductions)

**`rejectWithDeduction`** in **`actions/qc.ts`** calls **`recordDeduction`** inside the transaction: inserts **`temp_wallet_transactions`** with **`type = 'deduction'`**, negative **`amount`**, **`related_growth_id`**, **`created_by`** = reviewer, **`cycle_start_date`** from employee + growth. **`revalidatePath`** includes **`/wallet`**. Reason formatting uses **`formatShortDate`** on a **text** **`submission_date`** from SQL (**`::date::text`**) to avoid **`slice`** errors on **`Date`** objects (see QC section above). The employee notification can point to **`/wallet?highlight={id}`** so **`ScrollToWalletHighlight`** reveals the new deduction row.

---

## Manual end-to-end test (QC)

1. Sign in as **`employee@temp.local`**, submit a platform batch from the dashboard (or use seeded pending rows).
2. Sign out; sign in as **`lead@temp.local`** (or **`admin@temp.local`**).
3. Open **`/qc`** (or use the **QC** nav link + badge). Confirm pending items appear for the lead’s team (admin sees all).
4. Select a row, choose **Reject — apply deduction**, set an amount (e.g. **500**), optionally comment, **Confirm decision**.
5. Verify in SQL: **`temp_growth.qc_status = 'rejected_with_deduction'`**, **`qc_decision_amount`** set, **`temp_wallet_transactions`** has a new **`deduction`** row with **`amount = -500`** (or chosen amount).
6. Sign in again as the employee; open **`/wallet`** — deduction appears in activity; net balance reflects credits and debits.

---

## Manual end-to-end test (notifications + wallet highlight)

1. Run **`npm run db:seed-notifications`** (after migrate + seed) so **`employee@temp.local`** has sample rows, or complete a real QC rejection with deduction as above.
2. Sign in as the employee. Open the header **bell**: confirm unread badge, list, **`Mark all read`**, and per-row mark-read control.
3. Click a **rejection-with-deduction** notification whose action is **`/wallet?highlight=…`**: confirm navigation to **`/wallet`**, the target row is **ring-highlighted**, and the page **scrolls** to that row.
4. Toggle **This cycle** / **History** and confirm **`highlight`** (and **`tab`**) behave as expected when both are present (e.g. **`/wallet?highlight=12&tab=history`** after an admin payout notification).

---

## Project files reference (QC-related)

**Added (typical set):**

- `app/(app)/qc/page.tsx`
- `actions/qc.ts`
- `lib/qc-data.ts`
- `types/qc.ts`
- `components/qc/QcKpiStrip.tsx`
- `components/qc/QcQueueFilters.tsx`
- `components/qc/QcQueueItem.tsx`
- `components/qc/QcDetailPanel.tsx`
- `components/qc/QcDecisionForm.tsx`

**Modified (typical set):**

- `proxy.ts` — role rules for `/qc` and `/admin`, protected paths.
- `app/(app)/layout.tsx` — QC nav link + pending badge; **Admin** link for admins; **`NotificationBell`**.
- `lib/db.ts` — DATE type parser.
- `actions/qc.ts` — QC transactions + `submission_date` text cast.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server after build |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run all SQL migrations in `db/migrations/` |
| `npm run db:seed` | Seed dev users/data |
| `npm run db:seed-notifications` | Seed sample notifications for `employee@temp.local` |
| `npm run db:backfill-wallet` | Backfill ledger deductions + base salaries (`tsx scripts/backfill-wallet.ts`) |
| `npm run db:reset` | Migrate + seed |

---

## Project files reference (wallet ledger)

**Added (wallet feature):**

- `db/migrations/0002_wallet.sql`
- `scripts/backfill-wallet.ts`
- `types/wallet.ts`
- `lib/wallet-events.ts`
- `lib/wallet-page-data.ts`
- `lib/cairo-date.ts` (shared Cairo date helpers + **`normalizePgDateColumn`**)
- `app/(app)/wallet/page.tsx`
- `components/wallet/WalletHero.tsx`
- `components/wallet/CycleTimeline.tsx`
- `components/wallet/WalletTabs.tsx`
- `components/wallet/TransactionRow.tsx`
- `components/wallet/ScrollToWalletHighlight.tsx`
- `components/wallet/HistoryRow.tsx`
- `components/wallet/HistoryDownloadButton.tsx`

**Modified (typical):**

- `package.json` — **`db:backfill-wallet`** script
- `lib/wallet.ts` — ledger-backed **`computeWallet`**, re-exports **`WalletSummary`**
- `lib/dashboard-data.ts` — still calls **`computeWallet`** for the dashboard payload
- `types/dashboard.ts` — **`WalletSummary`** import path (via **`@/lib/wallet`** / **`types/wallet`**)
- `components/dashboard/WalletPreviewCard.tsx` — chips from **`bonusesCount`** / **`deductionsCount`**, link to **`/wallet`**
- `app/(app)/dashboard/page.tsx` — **`WalletPreviewCard`** props (no derived bonus count)
- `types/db.ts` — **`pay_cycle_start_date: string | Date | null`**
- `lib/db.ts` — **`DATE`** type parser (wallet + cycle alignment)
- `proxy.ts` / **`app/(app)/layout.tsx`** — include **`/wallet`** in protected routes / nav as applicable

---

## Project files reference (notifications)

**Added / active notification files:**

- `db/migrations/0003_notifications.sql`
- `types/notifications.ts`
- `lib/notifications.ts`
- `actions/notifications.ts`
- `app/api/notifications/route.ts`
- `app/(app)/notifications/page.tsx`
- `components/notifications/NotificationBell.tsx`
- `components/notifications/NotificationDropdown.tsx`
- `components/notifications/NotificationItem.tsx`
- `scripts/seed-notifications.ts`

**Modified notification producers / consumers:**

- `app/(app)/layout.tsx` — renders **`NotificationBell`**.
- `actions/qc.ts` — creates approval/rejection notifications.
- `actions/admin.ts` — creates level, target, bonus, and payout notifications.
- `app/(app)/wallet/page.tsx` — supports **`?highlight={transactionId}`**.
- `components/wallet/TransactionRow.tsx` — supports highlighted state.
- `lib/wallet-events.ts` — `recordDeduction` returns the inserted transaction id so QC can link directly to it.
- `lib/level-labels.ts` — exports **`LEVEL_SALARY_PERCENT`** for level-change notification copy.

---

## Lint and types

```bash
npx tsc --noEmit
npx eslint .
```

---

## Learn more

This project was bootstrapped with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app). See [Next.js Documentation](https://nextjs.org/docs) for framework features.
