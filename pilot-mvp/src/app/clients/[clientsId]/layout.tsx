// 'use client'; // Only needed if using client-side hooks

import React, { ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
  params: {
    clientsId: string;
  };
}


export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      {/* You can add a sidebar, header, or wrapper here */}
      {children}
    </div>
  );
}







