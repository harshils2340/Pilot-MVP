'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FillablePDFModal } from '../components/FillablePDFModal';
import { getPermitById } from '../lib/permits/demoData';

function FillFormContent() {
  const searchParams = useSearchParams();
  const permitId = searchParams.get('permitId') ?? searchParams.get('permit') ?? '';
  const clientName = searchParams.get('clientName') ?? '';
  const formTitleParam = searchParams.get('formTitle');
  const permitNameParam = searchParams.get('permitName');

  const permitData = permitId ? getPermitById(permitId) : null;
  const permitName = permitNameParam ?? permitData?.name ?? '';
  const formTitle =
    formTitleParam ??
    (permitData?.formTitle && permitData?.formCode
      ? `${permitData.formTitle} (${permitData.formCode})`
      : permitData?.formTitle ?? permitData?.name ?? 'Permit Application Form');

  return (
    <FillablePDFModal
      asPage
      isOpen={true}
      onClose={() => {}}
      permitName={permitName}
      clientName={clientName || undefined}
      formTitle={formTitle}
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
