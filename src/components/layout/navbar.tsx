'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const portalLinks = [
    { label: 'Citizen Portal', href: '/citizen' },
    { label: 'Field Officer Dispatch', href: '/officer' },
    { label: 'Municipal Administration', href: '/admin' },
    { label: 'Public Map Explorer', href: '/public' },
    { label: 'Public Performance & SLA', href: '/public/performance' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      {/* Official Government Top Banner: Solid Navy, Clean Contrast */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Official Civic Operations Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span>24/7 SLA Automation Active</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">Emergency Police/Fire Dial: 112 / 911</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand: Solid Navy Logo, No Gradient */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#0B1524] flex items-center justify-center text-white border border-slate-700">
            <Shield className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900">
                CIVOARA
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                MUNICIPAL 311
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              Incident Routing and SLA Engine
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#how-it-works"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Lifecycle Protocol
          </Link>
          <Link
            href="/#features"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            System Architecture
          </Link>
          <Link
            href="/#accountability"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Accountability and SLA
          </Link>
          <Link
            href="/public/performance"
            className={`text-xs font-semibold transition-colors ${pathname.startsWith('/public/performance') ? 'text-sky-700 font-bold' : 'text-slate-700 hover:text-slate-900'
              }`}
          >
            Performance Metrics
          </Link>

          {/* Portal Switcher Dropdown */}
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md border border-slate-300 transition-colors cursor-pointer"
              >
                <span>Workspaces</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            }
          >
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              Select Workspace
            </div>
            {portalLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <DropdownItem label={item.label} />
              </Link>
            ))}
          </Dropdown>
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/public">
            <Button variant="outline" size="sm">
              Browse Incidents
            </Button>
          </Link>
          <Link href="/report">
            <Button
              variant="accent"
              size="sm"
            >
              Report Incident
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4">
          <div className="flex flex-col space-y-2">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Lifecycle Protocol
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              System Architecture
            </Link>
            <Link
              href="/#accountability"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Accountability and SLA
            </Link>
            <Link
              href="/public/performance"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Performance Metrics
            </Link>
          </div>
          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            <Link href="/public" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Browse Incidents
              </Button>
            </Link>
            <Link href="/report" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="accent" className="w-full">
                Report Incident
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
