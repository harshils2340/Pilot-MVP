import React, { ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
  params: Promise<{
    clientsId: string;
  }>;
}

export default async function ClientLayout({ children }: ClientLayoutProps) {
  // Params are available if needed, but we don't need them in layout
  return (
    <>
      {children}
    </>
  );
}







