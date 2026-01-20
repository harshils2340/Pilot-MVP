'use client';

import { useState } from 'react';
import { DollarSign, Send, CheckCircle, Clock, FileText, Download } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
  permits: string[];
  sentAt?: string;
  paidAt?: string;
  dueDate: string;
}

interface ClientBillingProps {
  clientId?: string | null;
  clientName?: string | null;
}

export function ClientBilling({ clientName }: ClientBillingProps) {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedPermits, setSelectedPermits] = useState<string[]>([]);

  // Mock invoices for now (replace with API-backed data when available)
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-1',
      number: 'INV-2024-001',
      amount: 3875.0,
      status: 'paid',
      permits: ['Health Department Plan Review', 'Building Modification Permit'],
      sentAt: 'Dec 20, 2024',
      paidAt: 'Dec 22, 2024',
      dueDate: 'Jan 5, 2025',
    },
    {
      id: 'inv-2',
      number: 'INV-2024-002',
      amount: 2500.0,
      status: 'sent',
      permits: ['Business Operating Permit'],
      sentAt: 'Jan 8, 2025',
      dueDate: 'Jan 23, 2025',
    },
  ]);

  // Mock permit data for invoicing (replace with API data)
  const permits = [
    { id: '1', name: 'Health Department Plan Review', governmentFee: 875, consultantFee: 2500, billed: true },
    { id: '2', name: 'Building Modification Permit', governmentFee: 1200, consultantFee: 3200, billed: true },
    { id: '3', name: 'Business Operating Permit', governmentFee: 450, consultantFee: 2500, billed: true },
    { id: '4', name: 'Fire Safety Inspection', governmentFee: 350, consultantFee: 1800, billed: false },
    { id: '5', name: 'Signage Permit', governmentFee: 175, consultantFee: 800, billed: false },
  ];

  const getInvoiceStatusConfig = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Paid',
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'sent':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Sent',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'draft':
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Draft',
          color: 'text-neutral-600',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
    }
  };

  const handleSendInvoice = () => {
    const selectedPermitData = permits.filter((p) => selectedPermits.includes(p.id));
    const totalAmount = selectedPermitData.reduce((sum, p) => sum + p.governmentFee + p.consultantFee, 0);

    const newInvoice: Invoice = {
      id: `inv-${invoices.length + 1}`,
      number: `INV-2025-${String(invoices.length + 1).padStart(3, '0')}`,
      amount: totalAmount,
      status: 'sent',
      permits: selectedPermitData.map((p) => p.name),
      sentAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    setInvoices([newInvoice, ...invoices]);
    setShowInvoiceDialog(false);
    setSelectedPermits([]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const totalBilled = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalUnpaid = invoices.filter((i) => i.status === 'sent').reduce((sum, i) => sum + i.amount, 0);
  const unbilledPermits = permits.filter((p) => !p.billed);

  const togglePermitSelection = (permitId: string) => {
    setSelectedPermits((prev) => (prev.includes(permitId) ? prev.filter((id) => id !== permitId) : [...prev, permitId]));
  };

  return (
    <div className="flex-1 bg-neutral-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Billing</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage invoices and billing{clientName ? ` for ${clientName}` : ''} for this client
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 mb-1">Total Billed</p>
            <p className="text-2xl font-semibold text-neutral-900">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 mb-1">Total Paid</p>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 mb-1">Outstanding</p>
            <p className="text-2xl font-semibold text-amber-600">{formatCurrency(totalUnpaid)}</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-medium text-neutral-500 mb-1">Unbilled Permits</p>
            <p className="text-2xl font-semibold text-neutral-900">{unbilledPermits.length}</p>
          </div>
        </div>

        {/* Unbilled Permits */}
        {unbilledPermits.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Unbilled Permits</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{unbilledPermits.length} permit(s) ready to invoice</p>
              </div>
              <button
                onClick={() => setShowInvoiceDialog(true)}
                disabled={unbilledPermits.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Permit</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Government Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Consultant Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {unbilledPermits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">{permit.name}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600 text-right">{formatCurrency(permit.governmentFee)}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600 text-right">{formatCurrency(permit.consultantFee)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900 text-right">
                        {formatCurrency(permit.governmentFee + permit.consultantFee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoice History */}
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-900">Invoice History</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{invoices.length} invoice(s) for this client</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Permits</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Due</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {invoices.map((invoice) => {
                  const statusConfig = getInvoiceStatusConfig(invoice.status);
                  return (
                    <tr key={invoice.id} className="hover:bg-neutral-50 group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-neutral-900">{invoice.number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-600">{invoice.permits.join(', ')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-600">{invoice.sentAt || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-600">{invoice.dueDate}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-neutral-900">{formatCurrency(invoice.amount)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-neutral-100 rounded transition-all">
                          <Download className="w-4 h-4 text-neutral-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Dialog */}
        {showInvoiceDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">Create Invoice</h3>
                <p className="text-sm text-neutral-500 mt-1">Select permits to include in this invoice</p>
              </div>
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {unbilledPermits.map((permit) => (
                    <label
                      key={permit.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPermits.includes(permit.id) ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPermits.includes(permit.id)}
                          onChange={() => togglePermitSelection(permit.id)}
                          className="w-4 h-4 rounded border-neutral-300"
                        />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{permit.name}</p>
                          <p className="text-xs text-neutral-500">
                            Government: {formatCurrency(permit.governmentFee)} • Consultant: {formatCurrency(permit.consultantFee)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(permit.governmentFee + permit.consultantFee)}
                      </p>
                    </label>
                  ))}
                </div>

                {selectedPermits.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900">Total Invoice Amount</span>
                      <span className="text-xl font-semibold text-neutral-900">
                        {formatCurrency(
                          unbilledPermits
                            .filter((p) => selectedPermits.includes(p.id))
                            .reduce((sum, p) => sum + p.governmentFee + p.consultantFee, 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowInvoiceDialog(false);
                    setSelectedPermits([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvoice}
                  disabled={selectedPermits.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Send Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

