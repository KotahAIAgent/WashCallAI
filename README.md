# WashCall AI - SaaS Platform

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
cd washcall-ai
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
- `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., http://localhost:3000)

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
   - This will create all tables, RLS policies, and triggers

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

## Environment Variables

See `env.example` for all required environment variables.

## Stripe Setup

1. Create a Stripe account
2. Get your test API keys
3. Create price IDs for your plans (or use the test IDs in the code)
4. Set up webhooks for subscription events (optional for now)

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
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Fly.io

## License

MIT

