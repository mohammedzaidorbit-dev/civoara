import React from 'react';
import { PortalShell } from '@/components/layout';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="citizen">{children}</PortalShell>;
}
