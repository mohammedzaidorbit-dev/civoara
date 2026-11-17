import React from 'react';
import { Metadata } from 'next';
import { CitizenDashboardView } from '@/components/citizen';

export const metadata: Metadata = {
  title: 'Citizen Dashboard: CIVOARA',
  description: 'Monitor your civic reports, track field officer assignments, and verify incident closures in real time.',
};

export default function CitizenPortalRootPage() {
  return <CitizenDashboardView />;
}
