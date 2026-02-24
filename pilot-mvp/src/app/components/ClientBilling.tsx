'use client';

import { CreditCard, Download, Receipt, BadgeCheck } from 'lucide-react';

interface Invoice {
  id: string;
  period: string;
  amount: string;
  status: 'paid' | 'due';
  dueDate?: string;
}

interface ClientBillingProps {
  clientId: string;
  clientName: string;
  viewMode?: 'consultant' | 'client';
}

const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-1021', period: 'Jan 2026', amount: '$1,200', status: 'paid' },
  { id: 'inv-1020', period: 'Dec 2025', amount: '$1,200', status: 'paid' },
  { id: 'inv-1019', period: 'Nov 2025', amount: '$1,200', status: 'due', dueDate: 'Feb 5, 2026' },
];

export function ClientBilling({ clientName, viewMode = 'consultant' }: ClientBillingProps) {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {viewMode === 'client'
            ? 'Your subscription and invoice history'
            : `Billing overview for ${clientName}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
          <p className="mt-2 text-lg font-semibold text-foreground">Compliance Pro</p>
          <p className="mt-1 text-sm text-muted-foreground">Includes document requests & permit tracking</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Invoice</p>
          <p className="mt-2 text-lg font-semibold text-foreground">$1,200</p>
          <p className="mt-1 text-sm text-muted-foreground">Due Feb 5, 2026</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment Method</p>
            <p className="mt-2 text-lg font-semibold text-foreground">Visa •••• 4242</p>
            <p className="mt-1 text-sm text-muted-foreground">Auto-pay enabled</p>
          </div>
          <CreditCard className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Invoice History</h2>
          <button className="text-sm text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y divide-border">
          {MOCK_INVOICES.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{invoice.period}</p>
                  <p className="text-xs text-muted-foreground">{invoice.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {invoice.status === 'due' ? (
                  <span className="text-xs font-medium text-muted-foreground bg-muted font-semibold px-2 py-1 rounded-full">
                    Due {invoice.dueDate}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    Paid
                  </span>
                )}
                <p className="text-sm font-medium text-foreground">{invoice.amount}</p>
                <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          <BadgeCheck className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-foreground">Billing status healthy</p>
            <p className="text-xs text-muted-foreground">
              Next invoice scheduled for Feb 5, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
