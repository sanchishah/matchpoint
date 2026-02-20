# Matchpoint

[![GitHub Repo](https://img.shields.io/badge/GitHub-matchpoint-3F6F5E?logo=github)](https://github.com/sanchishah/matchpoint)

**Where players meet their match.**

Matchpoint is an elegant pickleball player matching platform for the South Bay Area. The Matchpoint team pre-books court slots at clubs, publishes them as inventory, and players join to get matched. When enough players join, the game is confirmed and payments are charged.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **TailwindCSS v4** + shadcn/ui
- **Prisma** + PostgreSQL
- **NextAuth v5** (credentials auth)
- **Stripe** (PaymentIntents, test mode)
- **Resend** (transactional email)
- **Zod** + React Hook Form (validation)

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd matchpoint
cp .env.example .env
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Run migrations & seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key (`pk_test_...`) |
| `RESEND_API_KEY` | Resend API key for emails |
| `EMAIL_FROM` | Sender email address |
| `APP_BASE_URL` | Base URL for email links (default: `http://localhost:3000`) |
| `EMAIL_PROVIDER` | Email provider: `resend` / `sendgrid` / `ses` (default: `resend`) |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |

## Test Accounts

After seeding:

| Email | Password | Role |
|---|---|---|
| `sanchishah@gmail.com` | `admin123` | Admin |
| `demo@matchpoint.app` | `demo123` | User (with profile) |

## Stripe Test Mode

Use Stripe test cards for payments:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry, any CVC, any zip

Payments are only charged when a game is confirmed (all required players joined).

## Scheduled Jobs

### Development

Trigger jobs manually:

```bash
curl http://localhost:3000/api/jobs/run
```

Or visit the URL in your browser.

### Production (Vercel Cron)

Create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/jobs/run",
    "schedule": "*/15 * * * *"
  }]
}
```

Jobs handle:
- 24-hour game reminders
- 2-hour game reminders
- Chat open notifications (15 min before)
- Auto-expiring unfilled slots

## Project Structure

```
src/
  app/
    (app)/              # App pages (with navbar/footer layout)
      home/             # Landing page
      book/             # Browse & reserve slots
      dashboard/        # User dashboard
      games/            # Games list
      games/[id]/       # Game detail + chat + ratings
      profile/setup/    # Profile onboarding
      admin/            # Admin dashboard
      contact/          # Contact form
      info/             # Info page
      terms/            # Terms & conditions
      privacy/          # Privacy policy
    (auth)/             # Auth pages (centered layout)
      login/
      signup/
    api/
      auth/             # NextAuth + signup
      slots/            # Slot browsing, join, cancel
      games/            # Games + messages + ratings
      favorites/        # Club favorites toggle
      notifications/    # In-app notifications
      contact/          # Contact form submission
      admin/            # Admin CRUD APIs
      jobs/             # Scheduled job runner
      profile/          # Profile CRUD
  components/
    ui/                 # shadcn/ui components
    navbar.tsx
    footer.tsx
    notification-bell.tsx
    providers.tsx
  lib/
    auth.ts             # NextAuth config
    db.ts               # Prisma client
    stripe.ts           # Stripe client
    email.ts            # Email service (provider abstraction)
    welcome-email.ts    # Welcome email trigger (idempotent)
    emails/
      welcome.ts        # Welcome email HTML + text templates
    constants.ts        # Shared constants + helpers
    validations.ts      # Zod schemas
    game-service.ts     # Game confirmation + cancellation logic
prisma/
  schema.prisma         # Database schema
  seed.ts               # Seed data (16 clubs + slots)
```

## Key Features

- **Skill + age bracket matching**: Players can only join slots matching their exact skill level and age bracket
- **Lock time**: 8 hours before game start, self-cancellation is blocked
- **Waitlist**: Full slots accept waitlisted players who auto-promote on cancellation
- **Stripe charging**: Only on game confirmation when all players are matched
- **Game chat**: Opens 15 min before, closes at game end (server-enforced)
- **Post-game ratings**: Stars (1-5) + felt level (Below/At/Above) per player
- **No-show strikes**: 3 strikes = account restricted
- **Admin dashboard**: Full CRUD for clubs, slots, games, users, attendance, refunds, contact messages

## Location Approach

For MVP, location filtering uses:
- Zip code entry on profile
- Haversine distance calculation between user zip coordinates and club coordinates
- South Bay clubs are seeded with real lat/lng coordinates
- Radius filtering (3/5/10 miles) in slot browsing

## Design System

Elegant, minimal, lifestyle-brand aesthetic (Kate Spade vibe):

- **Primary**: `#3F6F5E` (deep green)
- **Pastel Green**: `#DDEFE6`
- **Pastel Blue**: `#E6F0F6`
- **Text**: `#4A4A4A`
- **Borders**: `#F1F1F1`
- **Headings**: Montserrat (sans-serif)
- **Body**: Inter (sans-serif)
