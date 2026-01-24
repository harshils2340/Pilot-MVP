'use client';

import { DocumentsView } from './DocumentsView';

interface EnhancedDocumentsViewProps {
  clientId: string;
  consultantId?: string;
  clientEmail?: string;
  clientName?: string;
  consultantName?: string;
  viewMode?: 'consultant' | 'client';
}

export function EnhancedDocumentsView(props: EnhancedDocumentsViewProps) {
  return <DocumentsView {...props} />;
}
