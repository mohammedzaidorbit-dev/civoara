'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bell,
  User,
  CheckSquare,
  MapPin,
  BarChart3,
  Layers,
  Building2,
  Users,
  Clock,
  ShieldCheck,
  Globe,
  Search,
  Activity,
  ExternalLink,
  ChevronRight,
  HardHat,
  Lock,
  GitMerge,
} from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';

export type PortalRole = 'citizen' | 'officer' | 'admin' | 'public';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  exact?: boolean;
}

interface RoleConfig {
  name: string;
  roleBadge: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  userDefaultName: string;
  userEmail: string;
  userRoleLabel: string;
  navItems: NavItem[];
}

const ROLE_CONFIGS: Record<PortalRole, RoleConfig> = {
  citizen: {
    name: 'Citizen Portal',
    roleBadge: 'Verified Citizen',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    accentBorder: 'border-emerald-500',
    userDefaultName: 'Alex Morgan',
    userEmail: 'alex.citizen@civoara.local',
    userRoleLabel: 'Citizen',
    navItems: [
      { label: 'Overview', href: '/citizen', icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
      { label: 'Report Incident', href: '/citizen/report', icon: <PlusCircle className="w-4 h-4" /> },
      { label: 'My Grievances', href: '/citizen/reports', icon: <FileText className="w-4 h-4" />, badge: '3' },
      { label: 'Notifications', href: '/citizen/notifications', icon: <Bell className="w-4 h-4" />, badge: '1' },
      { label: 'Citizen Profile', href: '/citizen/profile', icon: <User className="w-4 h-4" /> },
    ],
  },
  officer: {
    name: 'Officer Operations',
    roleBadge: 'Public Works Officer',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    accentBorder: 'border-amber-500',
    userDefaultName: 'Officer Sarah Chen',
    userEmail: 's.chen@roads.municipality.gov',
    userRoleLabel: 'Field Responder',
    navItems: [
      { label: 'Command Center', href: '/officer', icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
      { label: 'Ticket Queue', href: '/officer/queue', icon: <CheckSquare className="w-4 h-4" />, badge: '5' },
      { label: 'Field Map', href: '/officer/map', icon: <MapPin className="w-4 h-4" /> },
      { label: 'Performance & SLA', href: '/officer/performance', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  admin: {
    name: 'City Administration',
    roleBadge: 'Executive Administrator',
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-400',
    accentBorder: 'border-sky-500',
    userDefaultName: 'Director J. Vance',
    userEmail: 'director.ops@city.gov',
    userRoleLabel: 'Administrator',
    navItems: [
      { label: 'City Overview', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
      { label: 'Incidents & Triage', href: '/admin/incidents', icon: <CheckSquare className="w-4 h-4" />, badge: '14' },
      { label: 'Duplicate Clusters', href: '/admin/clusters', icon: <Layers className="w-4 h-4 text-sky-400" />, badge: 'Active' },
      { label: 'Department Routing', href: '/admin/departments', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Reorganization & SLA', href: '/admin/reorganization', icon: <GitMerge className="w-4 h-4 text-emerald-400" /> },
      { label: 'Officer Roster', href: '/admin/officers', icon: <Users className="w-4 h-4" /> },
      { label: 'SLA Policy Engine', href: '/admin/sla', icon: <Clock className="w-4 h-4" /> },
      { label: 'City Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Audit Trail', href: '/admin/audit', icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
  public: {
    name: 'Public Transparency',
    roleBadge: 'Open Data Portal',
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-400',
    accentBorder: 'border-sky-500',
    userDefaultName: 'Public Guest',
    userEmail: 'guest.viewer@public.civoara',
    userRoleLabel: 'Public Access',
    navItems: [
      { label: 'Incident Explorer', href: '/public', icon: <Globe className="w-4 h-4" />, exact: true },
      { label: 'Performance Dashboard', href: '/public/performance', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
      { label: 'Track by Ticket ID', href: '/public/track', icon: <Search className="w-4 h-4" /> },
      { label: 'SLA Transparency', href: '/public/stats', icon: <Activity className="w-4 h-4" /> },
    ],
  },
};

export interface PortalShellProps {
  role: PortalRole;
  children: React.ReactNode;
}

export function PortalShell({ role, children }: PortalShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const config = ROLE_CONFIGS[role];

  const portalSwitchLinks = [
    { label: 'Citizen Portal', href: '/citizen', icon: <Users className="w-4 h-4 text-emerald-600" /> },
    { label: 'Officer Operations', href: '/officer', icon: <HardHat className="w-4 h-4 text-amber-600" /> },
    { label: 'City Administration', href: '/admin', icon: <Lock className="w-4 h-4 text-sky-600" /> },
    { label: 'Public Transparency', href: '/public', icon: <Globe className="w-4 h-4 text-sky-600" /> },
  ];

  const isLinkActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-sky-700 flex items-center justify-center text-white shadow font-bold text-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                CIVOARA
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                GovTech SaaS
              </span>
            </div>
          </Link>
          <Link
            href="/"
            title="Return to Public Landing"
            className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Portal Role Indicator */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">{config.name}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-current/20 ${config.badgeBg} ${config.badgeText}`}
            >
              {config.roleBadge}
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Main Navigation
          </p>
          {config.navItems.map((item) => {
            const active = isLinkActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500
                  ${active
                    ? 'bg-sky-700 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 transition-colors ${
                      active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`
                      text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0
                      ${active ? 'bg-sky-900 text-sky-100 border border-sky-600/50' : 'bg-slate-800 text-slate-300 border border-slate-700'}
                    `}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Telemetry Status Strip in Sidebar */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Grid Synchronized</span>
          </span>
          <span className="text-slate-500">24/7 SLA</span>
        </div>

        {/* Role Switcher in Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950">
          <div className="px-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Portal Switcher</span>
            <span className="text-[10px] text-slate-500 font-mono">Dev Quick-Jump</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <Link
              href="/citizen"
              className={`p-1.5 rounded text-center font-medium border text-[11px] transition-colors ${role === 'citizen'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
            >
              Citizen
            </Link>
            <Link
              href="/officer"
              className={`p-1.5 rounded text-center font-medium border text-[11px] transition-colors ${role === 'officer'
                ? 'bg-slate-800 text-amber-400 border-amber-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
            >
              Officer
            </Link>
            <Link
              href="/admin"
              className={`p-1.5 rounded text-center font-medium border text-[11px] transition-colors ${role === 'admin'
                ? 'bg-slate-800 text-sky-400 border-sky-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
            >
              Admin
            </Link>
            <Link
              href="/public"
              className={`p-1.5 rounded text-center font-medium border text-[11px] transition-colors ${role === 'public'
                ? 'bg-slate-800 text-sky-400 border-sky-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
            >
              Public
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {config.userDefaultName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{config.userDefaultName}</p>
            <p className="text-[10px] text-slate-400 truncate">{config.userEmail}</p>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER */}
      {/* ========================================================================= */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/75 transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl z-10">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-700 flex items-center justify-center text-white">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-base">CIVOARA</span>
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800">
              <span className="text-xs font-semibold text-white block">{config.name}</span>
              <span className="text-[10px] text-slate-400">{config.roleBadge}</span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {config.navItems.map((item) => {
                const active = isLinkActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`
                      flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors
                      ${active
                        ? 'bg-sky-700 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-800 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                Switch Portal
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {portalSwitchLinks.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-center text-[11px]"
                  >
                    {p.label.split(' ')[0]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN APPLICATION CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-900">{config.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 capitalize">
                {pathname.split('/')[2]?.replace(/-/g, ' ') || 'Overview'}
              </span>
            </div>
          </div>

          {/* Quick Search Shortcut Display */}
          <Link
            href="/public"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-500 transition-colors cursor-pointer"
            title="Search municipal grid and incidents"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">Search incidents, wards &amp; officers...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-300 rounded text-slate-600 shadow-2xs">
              ⌘K
            </kbd>
          </Link>

          {/* Top Header Right Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Switch Dropdown */}
            <Dropdown
              align="right"
              trigger={
                <button
                  type="button"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <span>Switch Workspace</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
              }
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Switch Operational View
              </div>
              {portalSwitchLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  <DropdownItem label={item.label} icon={item.icon} />
                </Link>
              ))}
            </Dropdown>

            {/* Notifications Bell */}
            <Link
              href={role === 'citizen' ? '/citizen/notifications' : `${pathname}#notifications`}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </Link>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {config.userDefaultName.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-semibold text-slate-800 leading-none">
                  {config.userDefaultName}
                </span>
                <span className="text-[10px] text-slate-500">{config.userRoleLabel}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
