import React from 'react';
import { PortalShell } from '@/components/layout';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="public">{children}</PortalShell>;
}
