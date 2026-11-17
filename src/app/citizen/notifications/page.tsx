'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function CitizenNotificationsPage() {
  const { info } = useToast();

  const notifications = [
    {
      id: 'n1',
      title: 'Incident Status Updated: Resolved',
      message: 'Officer Sarah Chen has marked your report CIV-2026-8641 (Streetlight outage on Elm St) as resolved. Please verify the closure.',
      timestamp: '15 minutes ago',
      type: 'resolution',
      unread: true,
      ticketId: 'CIV-2026-8641',
    },
    {
      id: 'n2',
      title: 'Field Officer Dispatched',
      message: 'Your report CIV-2026-8812 (Deep pothole on 5th Ave) has been assigned to Public Works Road Maintenance Unit.',
      timestamp: '2 hours ago',
      type: 'dispatch',
      unread: false,
      ticketId: 'CIV-2026-8812',
    },
    {
      id: 'n3',
      title: 'Grievance Intake Confirmed',
      message: 'Ticket CIV-2026-8790 recorded with 24-hour critical SLA. Proximity checks verified no duplicate.',
      timestamp: 'Yesterday',
      type: 'intake',
      unread: false,
      ticketId: 'CIV-2026-8790',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Alerts &amp; Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-channel status alerts for your submitted grievances.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => info('All Marked as Read', 'Notification queue synchronized.')}
        >
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((item) => (
          <Card
            key={item.id}
            className={`transition-colors ${
              item.unread ? 'border-indigo-200 bg-indigo-50/15' : 'border-slate-200'
            }`}
          >
            <CardContent className="p-4 sm:p-5 flex items-start gap-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'resolution'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.type === 'dispatch'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {item.type === 'resolution' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : item.type === 'dispatch' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  <span className="text-[11px] font-mono text-slate-400">{item.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href="/citizen/reports"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                  >
                    View Ticket {item.ticketId} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {item.unread && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
