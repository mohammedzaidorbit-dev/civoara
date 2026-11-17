'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, AlertCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0B1524] text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-sky-700 flex items-center justify-center text-white font-bold text-base">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                CIVOARA
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Civic Incident Verification, Operations and Automated Routing Architecture. Municipal work order management, proximity clustering, and service level agreement accountability.
            </p>
            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-amber-300 flex items-start gap-2.5 max-w-sm">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight">
                <strong>Emergency Notice:</strong> For active fires, crimes in progress, or immediate medical emergencies, call your municipal emergency dispatch (112 / 911) immediately.
              </p>
            </div>
          </div>

          {/* Citizen Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Citizen Portal
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/report" className="hover:text-white transition-colors">
                  Report Civic Incident
                </Link>
              </li>
              <li>
                <Link href="/citizen/dashboard" className="hover:text-white transition-colors">
                  Tracked Grievances
                </Link>
              </li>
              <li>
                <Link href="/citizen" className="hover:text-white transition-colors">
                  Citizen Dashboard
                </Link>
              </li>
              <li>
                <Link href="/public/track" className="hover:text-white transition-colors">
                  Check Ticket Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Admin Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Municipal Operations
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/officer" className="hover:text-white transition-colors">
                  Officer Field Dispatch
                </Link>
              </li>
              <li>
                <Link href="/officer/queue" className="hover:text-white transition-colors">
                  Department Work Queue
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  City Command Center
                </Link>
              </li>
              <li>
                <Link href="/admin/sla" className="hover:text-white transition-colors">
                  SLA Threshold Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Transparency Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Public and Standards
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/public" className="hover:text-white transition-colors">
                  Public Incident Map
                </Link>
              </li>
              <li>
                <Link href="/public/performance" className="hover:text-white transition-colors">
                  City SLA Compliance Index
                </Link>
              </li>
              <li>
                <Link href="/#accountability" className="hover:text-white transition-colors">
                  Auditability and Verification
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  PostGIS &bull; RLS Protected
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>&copy; 2026 CIVOARA Civic Platform. Government Technology Service.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-300">Strict Data Privacy &amp; Citizen Anonymity Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
