# CIVOARA — System Architecture Documentation

## Overview

CIVOARA is designed as a modular, scalable, event-driven civic operations platform built upon Next.js App Router and Supabase. The system serves three primary user personas:

1. **Citizens**: Submit issues (potholes, sanitation, streetlights, water supply), attach geo-tagged media, track resolution status, and receive updates.
2. **Municipal Officers**: Receive assigned incident tickets based on department, update progress, upload proof of resolution, and coordinate field teams.
3. **City Administrators**: Configure departments, monitor SLAs, analyze heatmaps, detect systemic bottlenecks, and override routing rules.

---

## Architectural Layers

```
+-------------------------------------------------------------+
|                      Presentation Layer                     |
|  - Next.js App Router (/src/app)                            |
|  - Role-specific UI Components (/src/components)            |
|    * citizen/  * officer/  * admin/  * dashboard/  * maps/  |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                       Service Layer                         |
|  - Domain Services (/src/services)                          |
|  - Custom React Hooks (/src/hooks)                          |
|  - Client & Server State Handlers                           |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                     Business Logic Layer                    |
|  - Spatial Proximity Clustering (/src/lib/clustering)       |
|  - SLA Engine & Escalation Matrix (/src/lib/sla)            |
|  - Departmental Routing Engine (/src/lib/routing)           |
|  - Notification Dispatcher (/src/lib/notifications)         |
|  - Schema Validation (/src/lib/validation)                  |
|  - Auth & RBAC Security (/src/lib/auth)                     |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|                     Data & Identity Layer                   |
|  - Supabase Auth (SSO, Magic Link, Passwords)               |
|  - PostgreSQL Database with Row-Level Security (RLS)        |
|  - PostGIS Extension for Geospatial Queries                 |
|  - Supabase Realtime Channels for Live Updates              |
|  - Supabase Storage for Incident Photos and Proofs          |
+-------------------------------------------------------------+
```

---

## Module Breakdown

### 1. `src/components/`
- **`ui/`**: Base UI elements built with accessibility and Tailwind styling.
- **`layout/`**: Header navigation, authenticated user profiles, sidebars.
- **`citizen/`**: Incident submission forms with step-by-step progress, location picker, photo preview.
- **`officer/`**: Actionable work queues, status toggles, proof of resolution submission.
- **`admin/`**: Department settings, SLA threshold management, officer roster.
- **`dashboard/`**: KPI cards, average response times, SLA compliance rates.
- **`maps/`**: Interactive mapping components, geospatial clustering markers, heatmaps.

### 2. `src/lib/`
- **`supabase/`**:
  - `client.ts`: Supabase client for client-side React components (`createBrowserClient`).
  - `server.ts`: Supabase client for server components, route handlers, and server actions (`createServerClient`).
  - `middleware.ts`: Session refresher and route protection middleware.
- **`auth/`**: Role-based access control (RBAC), user session validation, permission assertions (`isCitizen`, `isOfficer`, `isAdmin`).
- **`validation/`**: Zod validation schemas enforcing strict inputs across client forms and server endpoints.
- **`routing/`**: Algorithmic assignment of incoming reports to municipal departments based on category and geospatial jurisdiction.
- **`sla/`**: Calculation of remaining SLA resolution hours, automatic breach alerts, and escalation triggers.
- **`clustering/`**: Proximity algorithm grouping identical or neighboring civic incident reports to eliminate duplicate field tickets.
- **`notifications/`**: Real-time push, in-app notification center, and external notification channels.

### 3. `supabase/`
- **`migrations/`**: Versioned SQL files establishing schema, PostGIS extensions, tables (`profiles`, `incidents`, `departments`, `sla_policies`, `incident_updates`), triggers, and RLS policies.
- **`seed/`**: Seed records containing default department taxonomies, SLA definitions, and test accounts.

---

## Path Aliases

The project utilizes `@/*` mapped to `./src/*`, enabling clean and refactor-resilient module resolution:

- `@/components/*`
- `@/lib/*`
- `@/services/*`
- `@/hooks/*`
- `@/types/*`
