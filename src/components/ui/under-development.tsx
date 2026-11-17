import React from 'react';
import Link from 'next/link';
import { Construction, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface UnderDevelopmentProps {
  moduleName: string;
  phase: string;
  description: string;
  featuresPlanned: string[];
  backHref?: string;
  backLabel?: string;
}

export function UnderDevelopment({
  moduleName,
  phase,
  description,
  featuresPlanned,
  backHref = '/',
  backLabel = 'Return to Overview',
}: UnderDevelopmentProps) {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Construction className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Module Under Active Development
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 font-semibold text-amber-900">
              {phase}
            </span>
          </div>
          <p className="text-xs text-amber-800/90 leading-relaxed">
            This operational module is part of the CIVOARA roadmap. Interface scaffolding is in place;
            backend integration, database triggers, and API wiring are scheduled for subsequent implementation phases.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>{moduleName}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Planned Capabilities & Integrations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {featuresPlanned.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link href={backHref}>
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                {backLabel}
              </Button>
            </Link>
            <span className="text-[11px] text-slate-400 font-mono">
              Status: Scaffolding Ready
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
