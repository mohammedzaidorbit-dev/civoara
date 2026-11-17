# CIVOARA — Production Deployment Guide

This guide details the end-to-end production deployment process for **CIVOARA (Civic Incident Verification & Automated Routing Platform)** on Vercel and Supabase.

---

## 1. Prerequisites

- A [Vercel](https://vercel.com) team or enterprise account.
- A [Supabase](https://supabase.com) production project with PostgreSQL 15+ and PostGIS enabled.
- A custom municipal domain with SSL (e.g., `https://civoara.city.gov`).
- Node.js 20+ LTS environment.

---

## 2. Supabase Infrastructure Setup

### 2.1 Enable Required PostgreSQL Extensions
Connect to your Supabase SQL editor or run via Supabase CLI:

```sql
-- PostGIS for geospatial ward boundary polygons and ST_DWithin clustering
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 2.2 Apply Database Migrations
Execute migrations in strict numerical order:

```bash
# Using Supabase CLI
supabase db push

# OR execute directly via SQL Editor:
# 1. supabase/migrations/00001_initial_schema.sql
# 2. supabase/migrations/00002_storage_and_reporting.sql
# 3. supabase/migrations/00003_sla_escalation_engine.sql
# 4. supabase/migrations/00004_duplicate_issue_clustering.sql
# 5. supabase/migrations/00005_reorganization_and_fair_sla.sql
```

### 2.3 Storage Bucket Configuration
Create the storage bucket for incident photographs:

1. Navigate to **Storage** in your Supabase dashboard.
2. Create bucket named `incident-media` (Public: Yes).
3. The RLS policies in `00002_storage_and_reporting.sql` automatically restrict uploads to authenticated citizens and allow public read access for authorized incident photos.

---

## 3. Environment Variables Configuration

Configure the following environment variables in **Vercel Project Settings > Environment Variables**:

| Variable Name | Environment | Description | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Supabase project REST endpoint | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Supabase public anon key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Secret) | High-privilege key for cron / admin | `eyJhbGciOi...` (Never prefix with NEXT_PUBLIC_) |
| `CRON_SECRET` | Production (Secret) | 64-char hex secret for scheduled endpoints | `a8f9c1b7...` |
| `NEXT_PUBLIC_APP_URL` | Production | Public canonical domain | `https://civoara.city.gov` |
| `NEXT_PUBLIC_SITE_NAME` | Production | Brand title | `"CIVOARA Civic Operations Platform"` |
| `NODE_ENV` | Production | Node runtime mode | `production` |

---

## 4. Vercel Deployment

### 4.1 Git Connection
1. Push the repository to GitHub / GitLab / Bitbucket.
2. Import the project into Vercel.
3. Framework Preset: **Next.js**.
4. Root Directory: `./`.

### 4.2 Build Settings
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4.3 Scheduled Cron Job Verification
The `vercel.json` file in the project root configures the automated SLA escalation worker:

```json
{
  "crons": [
    {
      "path": "/api/cron/sla-escalation",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Once deployed, verify under **Project > Settings > Cron Jobs** that `/api/cron/sla-escalation` triggers every 5 minutes.

---

## 5. Security Post-Deployment Checklist

- [x] **Row Level Security (RLS)**: Verify all 15 public tables have RLS enabled.
- [x] **Cron Authentication**: Send a test `GET /api/cron/sla-escalation` without headers and confirm HTTP `401 Unauthorized` is returned.
- [x] **File Uploads**: Test uploading a non-image file (.exe or .sh) on `/report` and confirm strict rejection.
- [x] **Public Redaction**: Inspect `/public/performance` and `/public/track` to confirm zero citizen emails, phone numbers, or passwords appear in DOM or JSON responses.
- [x] **Security Headers**: Verify HTTP response headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Permissions-Policy`.
