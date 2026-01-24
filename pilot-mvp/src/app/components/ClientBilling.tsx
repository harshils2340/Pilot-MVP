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
        <h1 className="text-2xl font-semibold text-neutral-900">Billing</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {viewMode === 'client'
            ? 'Your subscription and invoice history'
            : `Billing overview for ${clientName}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Plan</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">Compliance Pro</p>
          <p className="mt-1 text-sm text-neutral-500">Includes document requests & permit tracking</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Next Invoice</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">$1,200</p>
          <p className="mt-1 text-sm text-neutral-500">Due Feb 5, 2026</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Payment Method</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">Visa •••• 4242</p>
            <p className="mt-1 text-sm text-neutral-500">Auto-pay enabled</p>
          </div>
          <CreditCard className="w-6 h-6 text-neutral-400" />
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900">Invoice History</h2>
          <button className="text-sm text-blue-600 hover:underline">View all</button>
        </div>
        <div className="divide-y divide-neutral-200">
          {MOCK_INVOICES.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{invoice.period}</p>
                  <p className="text-xs text-neutral-500">{invoice.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {invoice.status === 'due' ? (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    Due {invoice.dueDate}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    Paid
                  </span>
                )}
                <p className="text-sm font-medium text-neutral-900">{invoice.amount}</p>
                <button className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <BadgeCheck className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-neutral-900">Billing status healthy</p>
            <p className="text-xs text-neutral-500">
              Next invoice scheduled for Feb 5, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
