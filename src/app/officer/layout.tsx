import React from 'react';
import { PortalShell } from '@/components/layout';

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="officer">{children}</PortalShell>;
}
