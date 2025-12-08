# FusionCaller - SaaS Platform

A complete AI-powered call center platform for service businesses, built with Next.js, Supabase, and Stripe.

## Features

- **Inbound AI Receptionist**: 24/7 answering, lead capture, appointment booking
- **Outbound AI Caller**: Automated calling to leads and past customers
- **Multi-tenant Architecture**: Organization-based data isolation with RLS
- **Dashboard**: View calls, leads, and appointments
- **Billing Integration**: Stripe subscriptions with multiple plans

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI Integration**: Vapi.ai (ready for integration)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fusioncaller
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Fill in your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `STRIPE_SECRET_KEY`: Your Stripe secret key (test mode)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_STARTER_PRICE_ID`: Stripe price ID for Starter plan subscription
- `STRIPE_GROWTH_PRICE_ID`: Stripe price ID for Growth plan subscription
- `STRIPE_PRO_PRICE_ID`: Stripe price ID for Pro plan subscription
- `STRIPE_SETUP_FEE_STARTER_PRICE_ID`: Stripe price ID for Starter setup fee (one-time)
- `STRIPE_SETUP_FEE_GROWTH_PRICE_ID`: Stripe price ID for Growth setup fee (one-time)
- `STRIPE_SETUP_FEE_PRO_PRICE_ID`: Stripe price ID for Pro setup fee (one-time)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret (for subscription tracking)
- `CRON_SECRET`: Secret key for securing cron job endpoints
- `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., http://localhost:3000)

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
   - This will create all tables, RLS policies, and triggers
   - For existing databases, run migration scripts:
     - `supabase/migrations/add-setup-fee-columns.sql` (if not already run)
     - `supabase/migrations/add-credit-system.sql` (for 6-month credit feature)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (marketing)/     # Public marketing site
│   ├── app/             # Dashboard pages (protected)
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── marketing/       # Marketing site components
│   ├── dashboard/       # Dashboard components
│   └── settings/        # Settings components
├── lib/
│   ├── supabase/        # Supabase client helpers
│   ├── stripe/          # Stripe helpers
│   ├── auth/            # Auth actions
│   ├── vapi/            # Vapi actions
│   └── organization/    # Organization actions
├── contexts/            # React contexts
└── types/               # TypeScript types
```

## Database Schema

The app uses Supabase with the following main tables:
- `profiles`: User profiles
- `organizations`: Business organizations
- `organization_members`: Organization membership
- `vapi_configs`: AI agent configurations
- `leads`: Captured leads
- `calls`: Call records
- `appointments`: Scheduled appointments

All tables have Row Level Security (RLS) policies for multi-tenant data isolation.

## Features Overview

### Public Marketing Site
- Hero section with CTAs
- Inbound vs Outbound feature tabs
- How it works section
- Pricing plans
- FAQ section

### Dashboard
- Summary cards (calls, leads, appointments)
- Recent calls table with detail view
- Calls page with filters
- Leads management
- AI configuration pages
- Settings and billing

### API Routes
- `/api/vapi/webhook`: Vapi webhook handler
- `/api/leads`: Create and update leads
- `/api/auth/stripe/checkout`: Stripe checkout
- `/api/auth/stripe/portal`: Stripe customer portal
- `/api/auth/stripe/webhook`: Stripe webhook handler (subscription events)
- `/api/cron/process-setup-credits`: Cron job to process 6-month credits
- `/api/cron/check-trials`: Cron job to check expired trials
- `/api/cron/weekly-reports`: Cron job to send weekly reports

## Environment Variables

See `env.example` for all required environment variables.

## Stripe Setup

1. Create a Stripe account
2. Get your test API keys
3. Create subscription products:
   - **Starter Plan**: $149/month
   - **Growth Plan**: $349/month
   - **Pro Plan**: $699/month
4. Create one-time payment products for setup fees:
   - **Setup Fee - Starter**: $99
   - **Setup Fee - Growth**: $149
   - **Setup Fee - Pro**: $199
5. Get the Price IDs from each product and add them to your environment variables
6. Set up webhooks for subscription events (see Webhook Setup below)

### Setup Fees & Trial System

- All plans include a one-time setup fee that covers CRM & Calendar integration
- Setup fees are automatically refunded if a user cancels during their trial period
- **7-day free trial** is available for the Starter plan only
- Growth and Pro plans require immediate payment (no free trial) as they include outbound calling features
- **6-Month Loyalty Credit**: Setup fees are automatically credited back to your account after 6 months of continuous subscription. The credit applies to your next invoice automatically.

## Stripe Webhook Setup

The app requires Stripe webhooks to track subscription start dates for the 6-month credit system:

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter webhook URL: `https://yourdomain.com/api/auth/stripe/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add to `STRIPE_WEBHOOK_SECRET` environment variable

The webhook handler automatically tracks when subscriptions start, which is used to calculate 6-month credit eligibility.

## Cron Jobs Setup

The app uses cron jobs for automated tasks:

### Required Cron Jobs

1. **Process Setup Credits** (`/api/cron/process-setup-credits`)
   - Checks for organizations eligible for 6-month setup fee credit
   - Runs daily (configured in `vercel.json`)
   - Requires `CRON_SECRET` environment variable

2. **Check Trials** (`/api/cron/check-trials`)
   - Disables services for expired trials
   - Runs hourly (recommended)

3. **Weekly Reports** (`/api/cron/weekly-reports`)
   - Sends weekly email reports to users
   - Runs weekly on Mondays (recommended)

### Vercel Cron (Recommended)

If using Vercel, cron jobs are configured in `vercel.json`. Vercel Cron requires Hobby plan or higher.

### External Cron Service

If not using Vercel Cron, use an external service like:
- cron-job.org
- EasyCron
- GitHub Actions (scheduled workflows)

**Setup for external cron:**
- URL: `https://yourdomain.com/api/cron/[endpoint-name]`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: As specified in each cron job

### Generate CRON_SECRET

Generate a secure random string:
```bash
openssl rand -hex 32
```

Add this to your environment variables as `CRON_SECRET`.

## Vapi.ai Integration

The app is structured to integrate with Vapi.ai:
1. Add your Vapi API key to environment variables
2. Configure agent IDs in the Inbound/Outbound AI pages
3. Set up webhook URL: `https://yourdomain.com/api/vapi/webhook`
4. The webhook handler will process call events and create records

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables from `env.example`:
   - All Supabase variables
   - All Stripe variables (including `STRIPE_WEBHOOK_SECRET`)
   - `CRON_SECRET` (generate with `openssl rand -hex 32`)
   - `NEXT_PUBLIC_APP_URL` (your production URL)
4. Run database migrations in Supabase (if using existing database):
   ```sql
   -- Run supabase/migrations/add-setup-fee-columns.sql (if needed)
   -- Run supabase/migrations/add-credit-system.sql
   ```
5. Create Stripe products and add price IDs to environment variables
6. Set up Stripe webhook (see Webhook Setup section above)
7. Verify cron jobs are configured (check `vercel.json` - requires Vercel Hobby plan or higher)
8. Deploy and test:
   - Test webhook endpoint with Stripe CLI
   - Test cron endpoints manually
   - Verify credit display in Settings > Billing

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Fly.io

## License

MIT

