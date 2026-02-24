'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { FillablePDFModal } from '../components/FillablePDFModal';

function FillFormContent() {
  const searchParams = useSearchParams();
  const permitId = searchParams.get('permitId') ?? searchParams.get('permit') ?? '';
  const clientIdParam = searchParams.get('clientId') ?? '';
  const clientName = searchParams.get('clientName') ?? '';
  const formTitleParam = searchParams.get('formTitle');
  const permitNameParam = searchParams.get('permitName');
  const pdfUrl = searchParams.get('pdfUrl') ?? undefined;

  const [clientId, setClientId] = useState(clientIdParam);

  // Try to extract clientId from URL if not in params
  useEffect(() => {
    if (!clientId && typeof window !== 'undefined') {
      const pathMatch = window.location.pathname.match(/\/clients\/([^\/\?]+)/);
      if (pathMatch && pathMatch[1]) {
        const urlClientId = pathMatch[1];
        console.log('[FillForm] Extracted clientId from URL:', urlClientId);
        setClientId(urlClientId);
      }
    }
  }, [clientId]);

  // Fetch permit data from API if permitId provided (no demo data)
  const [permitName, setPermitName] = useState(permitNameParam || '');
  const [formTitle, setFormTitle] = useState(formTitleParam || 'Permit Application Form');

  useEffect(() => {
    if (permitId && !permitNameParam) {
      // Try permit management first, then catalog
      fetch(`/api/permits/management/${encodeURIComponent(permitId)}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setPermitName(data.name || '');
            setFormTitle(
              data.formTitle && data.formCode
                ? `${data.formTitle} (${data.formCode})`
                : data.formTitle || data.name || 'Permit Application Form'
            );
          } else {
            // Try catalog
            return fetch(`/api/permits/${encodeURIComponent(permitId)}`);
          }
        })
        .then(res => {
          if (res && res.ok) {
            return res.json();
          }
          return null;
        })
        .then(data => {
          if (data && !data.error) {
            setPermitName(data.name || '');
            setFormTitle(
              data.formTitle && data.formCode
                ? `${data.formTitle} (${data.formCode})`
                : data.formTitle || data.name || 'Permit Application Form'
            );
          }
        })
        .catch(() => {
          // If permit not found, use defaults
        });
    }
  }, [permitId, permitNameParam]);

  return (
    <FillablePDFModal
      asPage
      isOpen={true}
      onClose={() => {}}
      permitName={permitName}
      clientName={clientName || undefined}
      clientId={clientId || undefined}
      permitId={permitId || undefined}
      formTitle={formTitle}
      pdfUrl={pdfUrl}
    />
  );
}

export default function FillFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page-bg">
          <div className="text-muted-foreground">Loading form...</div>
        </div>
      }
    >
      <FillFormContent />
    </Suspense>
  );
}
