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
    <>
      {children}
    </>
  );
}







