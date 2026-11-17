import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { PublicNavbar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HeroQuickSuite } from '@/components/home/hero-quick-suite';
import { ActionCommandCenter } from '@/components/home/action-command-center';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PublicNavbar />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION: Solid Navy, Crisp White Typography, No Badges/Gradients */}
        {/* ========================================================================= */}
        <section className="bg-[#0B1524] text-white py-16 sm:py-20 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Mission, Actions, Telemetry */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Municipal 311 Operations Grid</span>
                </div>

                {/* Main Headline: Solid White, No Gradient Text, No Emojis */}
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                  Civic accountability, automated from intake to resolution.
                </h1>

                {/* Subtitle: High Contrast White/Slate, Direct Municipal Terminology */}
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
                  CIVOARA connects citizens, municipal field officers, and department supervisors on a single transparent audit log. Incoming reports are geocoded to municipal wards, clustered to prevent duplicate dispatches, and tracked against binding service level agreements.
                </p>

                {/* Action Buttons: Solid Colors, High Contrast */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Link href="/report" className="w-full sm:w-auto">
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full sm:w-auto font-semibold shadow-xs"
                    >
                      Report an Incident
                    </Button>
                  </Link>
                  <Link href="/public" className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto bg-slate-800 text-white hover:bg-slate-700 border-slate-700 font-semibold"
                      leftIcon={<Search className="w-4 h-4 text-sky-400" />}
                    >
                      Browse Public Issues
                    </Button>
                  </Link>
                  <Link href="/public/track" className="w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="w-full sm:w-auto text-slate-200 hover:text-white hover:bg-slate-800 text-sm font-semibold"
                    >
                      Track by Ticket ID
                    </Button>
                  </Link>
                </div>

                {/* Key Metrics: Solid High-Contrast, Clean Colons, No N-dashes */}
                <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800">
                  <div>
                    <div className="text-2xl font-bold text-white font-mono">100%</div>
                    <div className="text-xs text-slate-300 mt-1">Audit Trail Transparency</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white font-mono">50 Meters</div>
                    <div className="text-xs text-slate-300 mt-1">Proximity Clustering Radius</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white font-mono">4 to 72 Hours</div>
                    <div className="text-xs text-slate-300 mt-1">Service Level Agreements</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white font-mono">2-Step</div>
                    <div className="text-xs text-slate-300 mt-1">Dual Verification Closure</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Quick Suite */}
              <div className="lg:col-span-5">
                <HeroQuickSuite />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* OPERATIONAL WORKSPACES: Solid Uniform Cards, No Colored Left Borders */}
        {/* ========================================================================= */}
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Operational Portals
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Role-based workspaces configured for municipal operations and public oversight.
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded">
                Role-Based Access
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Citizen Card: Clean 1px border, no colored left borders */}
              <Link href="/citizen" className="block">
                <Card hover className="h-full border border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle>Citizen Portal</CardTitle>
                    <CardDescription>
                      Submit incident reports with geotagged photographs, monitor status transitions, and verify repairs upon completion.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs font-semibold text-sky-800">
                      Access Citizen Portal &rarr;
                    </span>
                  </CardContent>
                </Card>
              </Link>

              {/* Officer Card */}
              <Link href="/officer" className="block">
                <Card hover className="h-full border border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle>Field Officer Dispatch</CardTitle>
                    <CardDescription>
                      Triage departmental queues, review incident locations on interactive ward maps, and document remediation evidence.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs font-semibold text-sky-800">
                      Open Field Queue &rarr;
                    </span>
                  </CardContent>
                </Card>
              </Link>

              {/* Admin Card */}
              <Link href="/admin" className="block">
                <Card hover className="h-full border border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle>Municipal Administration</CardTitle>
                    <CardDescription>
                      Manage ward boundaries, routing rules, and multi-tier SLA escalation policies with fair reorganization migration accounting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs font-semibold text-sky-800">
                      Open Admin Console &rarr;
                    </span>
                  </CardContent>
                </Card>
              </Link>

              {/* Public Card */}
              <Link href="/public" className="block">
                <Card hover className="h-full border border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle>Public Transparency</CardTitle>
                    <CardDescription>
                      Inspect live citywide performance rankings, resolution benchmarks, and public ticket timelines with full PII redaction.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs font-semibold text-sky-800">
                      Explore Public Metrics &rarr;
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* OPERATIONAL LIFECYCLE: Clean Sequential Stages, No Clichéd Icon Circles */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Incident Lifecycle Protocol
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                From intake through field closure, every incident follows an immutable, verified audit sequence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stage 1 */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Stage 01
                </div>
                <h3 className="text-base font-bold text-slate-900">Geotagged Intake</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Citizens submit issue reports via web or mobile, providing latitude, longitude, category, and evidence photographs. A unique reference ticket (CIV-YYYY-XXXXX) is generated immediately.
                </p>
              </div>

              {/* Stage 2 */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Stage 02
                </div>
                <h3 className="text-base font-bold text-slate-900">Ward Identification &amp; Clustering</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  PostGIS boundaries resolve the responsible ward. Spatial proximity algorithms group concurrent reports within 50 meters into a canonical tracked issue with dynamic priority elevation.
                </p>
              </div>

              {/* Stage 3 */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Stage 03
                </div>
                <h3 className="text-base font-bold text-slate-900">Department Routing &amp; SLA Clock</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Configured routing rules assign the work order to the designated department. The category SLA timer begins immediately with automated escalation to supervisors if deadlines approach.
                </p>
              </div>

              {/* Stage 4 */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Stage 04
                </div>
                <h3 className="text-base font-bold text-slate-900">Dual Verification Closure</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Field officers complete repairs and attach photographic proof of work. Reporting citizens receive notice to verify the outcome, eliminating unverified clerical closures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MUNICIPAL SYSTEM CAPABILITIES: Structured Table/Grid, No 3-Icon-Box Clichés */}
        {/* ========================================================================= */}
        <section id="features" className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Municipal Governance Architecture
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Core technical mechanisms designed for high-integrity public sector operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-mono font-bold text-sky-800 uppercase">Core Capability 1</div>
                <h3 className="text-base font-bold text-slate-900">Deduplication Proximity Engine</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uses Haversine distance and Dice-Sørensen text overlap to identify duplicate reports within a 50-meter radius. Above an 85% confidence threshold, reports are linked to the canonical ticket, consolidating field resources while protecting against artificial priority inflation.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-mono font-bold text-sky-800 uppercase">Core Capability 2</div>
                <h3 className="text-base font-bold text-slate-900">Multi-Tier SLA Escalation Engine</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Service standard thresholds range from 4 hours for emergency hazards to 72 hours for routine repairs. When deadlines breach, the system executes idempotent server-side escalation from Field Officer to Operational Supervisor, Municipal Commissioner, and Chief Administrator.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-mono font-bold text-sky-800 uppercase">Core Capability 3</div>
                <h3 className="text-base font-bold text-slate-900">Fair Reorganization &amp; SLA Migration</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When city boundaries or department responsibilities change, CIVOARA preserves historical ownership segments without blame shifting. The outgoing department retains elapsed hours, while the incoming department receives a fresh segment budget with an emergency grace buffer.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-mono font-bold text-sky-800 uppercase">Core Capability 4</div>
                <h3 className="text-base font-bold text-sky-900 uppercase">Public Performance &amp; Privacy Isolation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Public dashboards publish explainable department rankings based on verifiable composite compliance scores with minimum sample disclosures. All public endpoints enforce zero-knowledge redaction of citizen names, phone numbers, and private residential addresses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PUBLIC ACCOUNTABILITY: Solid Dark Navy, High Contrast Text, Clean Borders */}
        {/* ========================================================================= */}
        <section id="accountability" className="py-16 bg-[#0B1524] text-white border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Public Accountability by Design
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">
                Traditional civic portals obscure operational delays. CIVOARA operates under an open governance model with cryptographic audit trails, verified photo evidence, and public resolution performance indices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-3">
                <h3 className="text-base font-bold text-white">
                  Mandatory Verification Proof
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A work order cannot be closed by clerical decree alone. Officers must attach photographic evidence, and citizens retain a 72-hour window to contest unfulfilled resolutions.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-3">
                <h3 className="text-base font-bold text-white">
                  Public Performance Rankings
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Department turnarounds, SLA compliance rates, and ward resolution equity are published openly. Low-sample sizes are transparently disclosed to ensure fair reporting.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-3">
                <h3 className="text-base font-bold text-white">
                  Tamper-Evident Audit Logs
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every status adjustment, officer assignment, and escalation alert is recorded as an immutable event with timestamps, actor roles, and geocoded coordinates.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-3">
                <h3 className="text-base font-bold text-white">
                  Fair SLA Restructuring
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Restructuring divisions or transferring ward responsibility creates partitioned ownership segments without erasing historical delays or attributing old backlogs to incoming crews.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3 items-center">
              <Link href="/public/performance">
                <Button variant="accent" size="sm">
                  View Public Performance Index
                </Button>
              </Link>
              <Link href="/public">
                <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800">
                  Browse Municipal Map
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MUNICIPAL ACTION COMMAND CENTER: Dual Interactive Cards & Telemetry */}
        {/* ========================================================================= */}
        <ActionCommandCenter />
      </main>

      <Footer />
    </div>
  );
}
