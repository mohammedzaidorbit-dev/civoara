import React from 'react';
import { PortalShell } from '@/components/layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="admin">{children}</PortalShell>;
}
