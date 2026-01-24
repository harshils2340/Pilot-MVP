import { DollarSign, Send, CheckCircle, Clock, Circle, FileText, Download, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
  sentAt?: string;
  paidAt?: string;
  dueDate: string;
}

export function PermitBillingSection() {
  const [governmentFee, setGovernmentFee] = useState('875.00');
  const [consultantFee, setConsultantFee] = useState('2,500.00');
  const [billingMethod, setBillingMethod] = useState<'hourly' | 'per_service'>('per_service');
  const [hourlyRate, setHourlyRate] = useState('150.00');
  const [hoursWorked, setHoursWorked] = useState('16.5');
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-1',
      number: 'INV-2024-001',
      amount: 2500.00,
      status: 'paid',
      sentAt: 'Dec 20, 2024',
      paidAt: 'Dec 22, 2024',
      dueDate: 'Jan 5, 2025',
    },
  ]);

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
        return {
          icon: <Circle className="w-4 h-4" />,
          label: 'Draft',
          color: 'text-neutral-600',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
    }
  };

  const calculateTotal = () => {
    const govFee = parseFloat(governmentFee.replace(/,/g, '')) || 0;
    let consFee = 0;
    
    if (billingMethod === 'per_service') {
      consFee = parseFloat(consultantFee.replace(/,/g, '')) || 0;
    } else {
      const rate = parseFloat(hourlyRate.replace(/,/g, '')) || 0;
      const hours = parseFloat(hoursWorked) || 0;
      consFee = rate * hours;
    }
    
    return govFee + consFee;
  };

  const handleSendInvoice = () => {
    const newInvoice: Invoice = {
      id: `inv-${invoices.length + 1}`,
      number: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      amount: calculateTotal(),
      status: 'sent',
      sentAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setInvoices([newInvoice, ...invoices]);
    setShowInvoiceDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalUnpaid = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      {/* Billing Summary */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Billing Summary</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Fees and charges for this permit</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium text-neutral-500">Total Billed</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrency(totalPaid + totalUnpaid)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-neutral-500">Total Paid</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
            {totalUnpaid > 0 && (
              <div className="text-right">
                <p className="text-xs font-medium text-neutral-500">Outstanding</p>
                <p className="text-lg font-semibold text-amber-600">{formatCurrency(totalUnpaid)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fee Configuration */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-900">Fee Structure</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Configure billing for this permit</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Government Fee */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Government Fee
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={governmentFee}
                onChange={(e) => setGovernmentFee(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">Fee charged by the municipality</p>
          </div>

          {/* Billing Method */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Billing Method
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setBillingMethod('per_service')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  billingMethod === 'per_service'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                Per Service
              </button>
              <button
                onClick={() => setBillingMethod('hourly')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  billingMethod === 'hourly'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                Hourly Rate
              </button>
            </div>
          </div>

          {/* Consultant Fee - Per Service */}
          {billingMethod === 'per_service' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Consultant Fee
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={consultantFee}
                  onChange={(e) => setConsultantFee(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">Fixed fee for this permit service</p>
            </div>
          )}

          {/* Consultant Fee - Hourly */}
          {billingMethod === 'hourly' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Hourly Rate
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Hours Worked
                </label>
                <input
                  type="text"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="0.0"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Total: {formatCurrency(parseFloat(hourlyRate.replace(/,/g, '')) * parseFloat(hoursWorked))}
                </p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">Total Amount</span>
              <span className="text-xl font-semibold text-neutral-900">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button 
              onClick={() => setShowInvoiceDialog(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Invoice
            </button>
            <button className="px-4 py-2.5 bg-white border border-neutral-300 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors">
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-900">Invoice History</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{invoices.length} invoice(s) for this permit</p>
          </div>
          <div className="divide-y divide-neutral-200">
            {invoices.map((invoice) => {
              const statusConfig = getInvoiceStatusConfig(invoice.status);
              
              return (
                <div key={invoice.id} className="p-4 hover:bg-neutral-50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${statusConfig.bg} flex items-center justify-center flex-shrink-0`}>
                        <FileText className={`w-5 h-5 ${statusConfig.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-neutral-900">{invoice.number}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-600">
                          {invoice.sentAt && (
                            <>
                              <span>Sent {invoice.sentAt}</span>
                              <span className="text-neutral-400">•</span>
                            </>
                          )}
                          <span>Due {invoice.dueDate}</span>
                          {invoice.paidAt && (
                            <>
                              <span className="text-neutral-400">•</span>
                              <span className="text-green-600">Paid {invoice.paidAt}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-neutral-900">{formatCurrency(invoice.amount)}</p>
                      </div>
                    </div>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-neutral-100 rounded transition-colors">
                        <Download className="w-4 h-4 text-neutral-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stripe Integration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Stripe Integration</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Invoices are sent via Stripe. Connect your Stripe account in Settings to enable automatic payment processing and tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Send Invoice Dialog */}
      {showInvoiceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Send Invoice</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Invoice will be sent via Stripe
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Government Fee</span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(parseFloat(governmentFee.replace(/,/g, '')) || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">
                    {billingMethod === 'hourly' ? `Consultant Fee (${hoursWorked} hrs @ ${formatCurrency(parseFloat(hourlyRate.replace(/,/g, '')) || 0)}/hr)` : 'Consultant Fee'}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {billingMethod === 'per_service'
                      ? formatCurrency(parseFloat(consultantFee.replace(/,/g, '')) || 0)
                      : formatCurrency((parseFloat(hourlyRate.replace(/,/g, '')) || 0) * (parseFloat(hoursWorked) || 0))
                    }
                  </span>
                </div>
                <div className="pt-3 border-t border-neutral-300 flex items-center justify-between">
                  <span className="text-base font-semibold text-neutral-900">Total</span>
                  <span className="text-xl font-semibold text-neutral-900">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowInvoiceDialog(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
