'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PDFDocument } from 'pdf-lib';
import { X, FileText, Sparkles, Download, Loader2, RotateCcw, Search, CheckCircle2, Building2, Users, MapPin, Calendar } from 'lucide-react';
import {
  getSuggestedFieldValues,
  buildBusinessContextFromPermit,
  parsePDFFormFields,
  saveBusinessContext,
} from '../lib/form-filler';
import { Progress } from './ui/progress';

// Group fields into sections for better organization
const FIELD_SECTIONS: Record<string, string[]> = {
  'Business Information': ['business_name', 'dba', 'ein', 'business_address', 'mailing_address'],
  'Contact': ['phone', 'owner_name', 'owner_title', 'owner_email'],
  'Facility': ['facility_type', 'permit_type', 'number_of_employees', 'square_footage'],
  'Other': ['date'],
};

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Business Information': Building2,
  'Contact': Users,
  'Facility': MapPin,
  'Other': Calendar,
};

export interface FillablePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  permitName?: string;
  clientName?: string;
  formTitle?: string;
  /** Optional: URL to load an existing fillable PDF. When not provided, a sample form is created. */
  pdfUrl?: string;
}

// Create a fillable PDF with common permit form fields
async function createFillablePDF(): Promise<{ bytes: Uint8Array; fieldNames: string[] }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const form = pdfDoc.getForm();
  const fieldNames: string[] = [];

  const fields = [
    { name: 'business_name', y: 700, label: 'Business Name' },
    { name: 'dba', y: 660, label: 'DBA' },
    { name: 'ein', y: 620, label: 'EIN' },
    { name: 'business_address', y: 580, label: 'Business Address' },
    { name: 'mailing_address', y: 540, label: 'Mailing Address' },
    { name: 'phone', y: 500, label: 'Phone' },
    { name: 'owner_name', y: 460, label: 'Owner/Rep Name' },
    { name: 'owner_title', y: 420, label: 'Title' },
    { name: 'owner_email', y: 380, label: 'Email' },
    { name: 'facility_type', y: 340, label: 'Facility Type' },
    { name: 'permit_type', y: 300, label: 'Permit Type' },
    { name: 'number_of_employees', y: 260, label: 'Employees' },
    { name: 'square_footage', y: 220, label: 'Sq Ft' },
    { name: 'date', y: 180, label: 'Date' },
  ];

  const pageHeight = page.getHeight();
  for (const f of fields) {
    const textField = form.createTextField(f.name);
    textField.addToPage(page, { x: 72, y: pageHeight - f.y - 22, width: 300, height: 20 });
    fieldNames.push(f.name);
  }

  const bytes = await pdfDoc.save();
  return { bytes, fieldNames };
}

export function FillablePDFModal({
  isOpen,
  onClose,
  permitName,
  clientName,
  formTitle = 'Health Permit Application (Form EH-01)',
  pdfUrl,
}: FillablePDFModalProps) {
  const [loading, setLoading] = useState(true);
  const [filling, setFilling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldNames, setFieldNames] = useState<string[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [filled, setFilled] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');

  const loadPDF = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (pdfUrl) {
        // Load from URL using form-filler integration
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
        const arrBuf = await res.arrayBuffer();
        const bytes = new Uint8Array(arrBuf);
        const parsed = await parsePDFFormFields(bytes);
        const names = parsed.map((f) => f.fieldName);
        if (names.length === 0) throw new Error('No fillable fields found in PDF');
        setPdfBytes(bytes);
        setFieldNames(names);
        setFieldValues(names.reduce((acc, n) => ({ ...acc, [n]: '' }), {}));
      } else {
        const { bytes, fieldNames: names } = await createFillablePDF();
        setPdfBytes(bytes);
        setFieldNames(names);
        setFieldValues(names.reduce((acc, n) => ({ ...acc, [n]: '' }), {}));
      }
      setFilled(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load PDF';
      setLoadError(msg);
      console.error('Failed to load PDF:', err);
    } finally {
      setLoading(false);
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (isOpen) {
      loadPDF();
    }
  }, [isOpen, loadPDF]);

  const handleFill = () => {
    setFilling(true);
    const context = buildBusinessContextFromPermit(permitName, clientName);
    saveBusinessContext(context, { permitName, clientName });
    const suggested = getSuggestedFieldValues(
      fieldNames,
      context,
      permitName,
      clientName
    );
    setFieldValues((prev) => {
      const next = { ...prev };
      for (const name of fieldNames) {
        if (suggested[name] !== undefined) {
          next[name] = suggested[name];
        }
      }
      return next;
    });
    setFilled(true);
    setFilling(false);
  };

  const handleDownload = async () => {
    if (!pdfBytes) return;
    setDownloading(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      const fields = form.getFields();
      for (const field of fields) {
        const name = field.getName();
        const val = fieldValues[name];
        if (val === undefined) continue;
        try {
          if (field.constructor.name === 'PDFTextField') {
            (field as import('pdf-lib').PDFTextField).setText(String(val));
          } else if (field.constructor.name === 'PDFCheckBox') {
            if (val === true || val === 'true' || val === 'yes') {
              (field as import('pdf-lib').PDFCheckBox).check();
            }
          } else if (field.constructor.name === 'PDFDropdown') {
            const dd = field as import('pdf-lib').PDFDropdown;
            const opts = dd.getOptions();
            const str = String(val);
            const match = opts.find(
              (o) => o.toLowerCase().includes(str.toLowerCase()) || str.toLowerCase().includes(o.toLowerCase())
            );
            if (match) dd.select(match);
          }
        } catch {
          // Skip field on error
        }
      }

      const filledBytes = await pdfDoc.save();
      const blob = new Blob([filledBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filled-${formTitle.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatFieldLabel = (name: string) =>
    name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleClear = () => {
    setFieldValues(fieldNames.reduce((acc, n) => ({ ...acc, [n]: '' }), {}));
    setFilled(false);
  };

  const filledCount = useMemo(
    () => Object.values(fieldValues).filter((v) => v && String(v).trim()).length,
    [fieldValues]
  );

  const groupedFields = useMemo(() => {
    const groups: { section: string; fields: string[] }[] = [];
    const assigned = new Set<string>();
    const norm = (s: string) => s.toLowerCase().replace(/[_-]/g, '');

    for (const [section, knownFields] of Object.entries(FIELD_SECTIONS)) {
      const inSection = fieldNames.filter((fn) =>
        knownFields.some((kf) => norm(kf) === norm(fn))
      );
      if (inSection.length > 0) {
        groups.push({ section, fields: inSection });
        inSection.forEach((f) => assigned.add(f));
      }
    }
    const remaining = fieldNames.filter((f) => !assigned.has(f));
    if (remaining.length > 0) {
      groups.push({ section: 'Other', fields: remaining });
    }
    return groups;
  }, [fieldNames]);

  const filteredGroups = useMemo(() => {
    if (!fieldSearch.trim()) return groupedFields;
    const q = fieldSearch.toLowerCase();
    return groupedFields
      .map((g) => ({
        ...g,
        fields: g.fields.filter((f) => formatFieldLabel(f).toLowerCase().includes(q)),
      }))
      .filter((g) => g.fields.length > 0);
  }, [groupedFields, fieldSearch]);

  const getInputType = (name: string): 'text' | 'email' | 'tel' => {
    const n = name.toLowerCase();
    if (n.includes('email')) return 'email';
    if (n.includes('phone') || n.includes('tel')) return 'tel';
    return 'text';
  };

  if (!isOpen) return null;

  const progressPercent = fieldNames.length ? (filledCount / fieldNames.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-muted/30 via-page-bg to-muted/20">
      {/* Top toolbar - document chrome */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border bg-surface/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
              <FileText className="w-4 h-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{formTitle}</h2>
              <p className="text-xs text-muted-foreground">{fieldNames.length} fields</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleFill}
            disabled={filling || loading || loadError !== null}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm font-medium rounded-lg hover:from-primary/95 hover:to-primary/85 shadow-sm disabled:opacity-70 transition-all"
          >
            {filling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Fill with AI
          </button>
          <button
            onClick={handleClear}
            disabled={loading || loadError !== null}
            className="flex items-center gap-2 px-3 py-2 border border-border text-foreground text-sm rounded-lg hover:bg-accent hover:border-border/80 transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || loading || loadError !== null || fieldNames.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-70 transition-all"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download
          </button>
        </div>
      </div>

      {/* Page area - paper/document style */}
      <div className="flex-1 overflow-auto flex justify-center p-6 sm:p-8 md:p-12">
        <div className="w-full max-w-3xl min-h-full">
          {/* Paper-style form container */}
          <div className="bg-surface border border-border rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Document header - form title as page header */}
            <div className="px-8 sm:px-10 pt-10 pb-6 border-b border-border">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">{formTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1.5">Complete all fields below. Use Fill with AI to auto-populate from your data.</p>
            </div>

            {/* Form content - document body with margins */}
            <div className="px-8 sm:px-10 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
              <p className="text-sm font-medium text-foreground">
                {pdfUrl ? 'Loading PDF...' : 'Creating fillable form...'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Auto-detecting form fields</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-24">
              <p className="text-sm text-destructive font-medium mb-2">Failed to load PDF</p>
              <p className="text-xs text-muted-foreground mb-4">{loadError}</p>
              <button
                onClick={loadPDF}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress + Search */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-border/60">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-[140px] max-w-[200px]">
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                    <span className="font-medium text-foreground">{filledCount}</span> of {fieldNames.length} filled
                  </span>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search fields..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Form sections */}
              <div className="space-y-8">
                {filteredGroups.map(({ section, fields: sectionFields }) => {
                  const SectionIcon = SECTION_ICONS[section] ?? FileText;
                  return (
                    <section key={section} className="space-y-4">
                      <div className="flex items-center gap-2 pl-3 border-l-2 border-primary/30">
                        <SectionIcon className="w-4 h-4 text-primary/70 shrink-0" />
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          {section}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {sectionFields.map((name) => {
                          const value = fieldValues[name] || '';
                          const isFilled = value.trim().length > 0;
                          const isFullWidth = name.includes('address') || name.includes('mailing');
                          return (
                            <div
                              key={name}
                              className={`group ${isFullWidth ? 'sm:col-span-2' : ''}`}
                            >
                              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                                {formatFieldLabel(name)}
                                {isFilled && (
                                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </label>
                              <input
                                type={getInputType(name)}
                                value={value}
                                onChange={(e) =>
                                  setFieldValues((prev) => ({ ...prev, [name]: e.target.value }))
                                }
                                className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:bg-muted/50 transition-all"
                                placeholder={`Enter ${formatFieldLabel(name).toLowerCase()}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>

              {filteredGroups.length === 0 && fieldSearch && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="w-10 h-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">No matching fields</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No fields match &quot;{fieldSearch}&quot;
                  </p>
                </div>
              )}

              {filled && (
                <div className="flex items-center gap-3 mt-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted shrink-0">
                    <Sparkles className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Form filled with AI-suggested data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Review the fields above and click Download in the toolbar when ready.</p>
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
