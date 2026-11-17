# CIVOARA — Civic Incident Verification, Operations & Automated Routing Architecture

CIVOARA is a modern, high-reliability civic incident management and automated response platform. It empowers citizens to report urban issues, automatically groups related reports using proximity clustering, calculates SLA timelines, routes incidents to relevant municipal officers, and delivers real-time oversight to city administrators.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Auth, Realtime)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Directory Architecture

```
civoara/
├── docs/                   # Architectural documentation & system specifications
├── public/                 # Static public assets
├── src/
│   ├── app/                # Next.js App Router (pages, layouts, route handlers)
│   ├── components/         # Reusable UI component library
│   │   ├── ui/             # Core atomic design primitives (buttons, inputs, dialogs)
│   │   ├── layout/         # Shell layouts, navigation bars, headers, sidebars
│   │   ├── citizen/        # Citizen grievance intake, tracking, and feedback UI
│   │   ├── officer/        # Officer task queue, status resolution, evidence upload
│   │   ├── admin/          # Admin oversight, department configuration, SLA rules
│   │   ├── dashboard/      # Analytic widgets, KPI summaries, SLA alerts
│   │   └── maps/           # Map layers, geospatial heatmaps, cluster pins
│   ├── hooks/              # Custom reusable React hooks
│   ├── lib/                # Core utilities and business logic engines
│   │   ├── auth/           # RBAC utilities, session guards, permission checks
│   │   ├── clustering/     # Geospatial clustering and duplicate detection
│   │   ├── notifications/  # Notification dispatchers (email, SMS, in-app push)
│   │   ├── routing/        # Departmental assignment and triage algorithms
│   │   ├── sla/            # SLA timers, breach calculations, escalation rules
│   │   ├── supabase/       # Supabase client helpers (browser, server, middleware)
│   │   └── validation/     # Zod validation schemas for forms and API contracts
│   ├── services/           # Data access layers and API service abstractions
│   └── types/              # Centralized TypeScript domain type definitions
└── supabase/
    ├── migrations/         # Versioned SQL migrations for schema and RLS policies
    └── seed/               # Initial seed data for municipal departments and roles
```

---

## Getting Started

### 1. Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### 2. Installation

```bash
git clone <repository-url>
cd civoara
npm install
```

### 3. Environment Setup

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Configure your Supabase project credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. Code Quality & Linting

```bash
# Type check without emitting files
npm run type-check

# Run ESLint
npm run lint
```
