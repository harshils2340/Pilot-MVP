'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload, FileText, FileSpreadsheet, File, CheckCircle2,
  AlertTriangle, X, Loader2, Sparkles, ChevronDown,
} from 'lucide-react';

interface MenuUploadProps {
  clientId: string;
  competitorName?: string;
  competitorNames?: string[];
  onUploadComplete?: (result: UploadResult) => void;
  onClose?: () => void;
}

interface UploadResult {
  success: boolean;
  itemsAdded: number;
  duplicatesSkipped: number;
  invalidSkipped: number;
  format: string;
  warnings: string[];
  competitorMatched: string | null;
  items?: { name: string; price: number | null; category: string }[];
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

const ACCEPTED_TYPES = {
  'text/csv': '.csv',
  'application/json': '.json',
  'application/pdf': '.pdf',
};

const ACCEPTED_EXTENSIONS = '.csv,.json,.pdf';

function CompetitorCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return options;
    const lower = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(lower));
  }, [query, options]);

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (wrapperRef.current?.contains(e.relatedTarget as Node)) return;
    setTimeout(() => setOpen(false), 150);
  };

  if (options.length === 0) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Which competitor is this menu for?
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
          placeholder="Type a restaurant name..."
          className="w-full text-sm rounded-lg border border-border bg-input-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1 relative" ref={wrapperRef}>
      <label className="text-xs font-medium text-muted-foreground">
        Which competitor is this menu for?
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder="Type or select a competitor..."
          className="w-full text-sm rounded-lg border border-border bg-input-background text-foreground px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setOpen(!open); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(name)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                    name === value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  {name}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              No matches — &quot;{query}&quot; will be used as-is
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function MenuUpload({ clientId, competitorName: initialCompetitor, competitorNames, onUploadComplete, onClose }: MenuUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState(initialCompetitor ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdf = selectedFile?.name.toLowerCase().endsWith('.pdf');

  const handleFileSelect = useCallback((file: File) => {
    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    if (!['csv', 'json', 'pdf'].includes(ext)) {
      setError('Please upload a CSV, JSON, or PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }
    setSelectedFile(file);
    setError(null);
    setResult(null);
    setState('idle');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setState('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('clientId', clientId);
      if (selectedCompetitor) {
        formData.append('competitorName', selectedCompetitor);
      }

      const res = await fetch('/api/ai-insights/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setError(data.error || 'Upload failed. Please try again.');
        return;
      }

      setState('success');
      setResult(data);
      onUploadComplete?.(data);
    } catch {
      setState('error');
      setError('Network error. Please check your connection and try again.');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <File className="w-5 h-5 text-red-500" />;
    if (ext === 'json') return <FileText className="w-5 h-5 text-amber-500" />;
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Upload Competitor Menu</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Competitor selector — type-ahead combobox */}
      <CompetitorCombobox
        value={selectedCompetitor}
        onChange={setSelectedCompetitor}
        options={competitorNames ?? []}
      />

      {/* Format pills */}
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <FileSpreadsheet className="w-3 h-3" /> CSV
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <FileText className="w-3 h-3" /> JSON
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
          <File className="w-3 h-3" /> PDF *
        </span>
      </div>

      {/* PDF asterisk note */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2.5">
        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          <span className="font-semibold">* PDF uploads are magic, but not perfect!</span>
          {' '}We&apos;ll do our best to read the menu, but fancy formatting can trip us up.
          CSV or JSON gives the best results. If you upload a PDF, just give the extracted items
          a quick once-over to make sure everything looks right.
        </p>
      </div>

      {/* Drop zone */}
      {!selectedFile && state === 'idle' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/40'
            }
          `}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm text-foreground font-medium">
            Drop your file here, or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            CSV, JSON, or PDF up to 10 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && state !== 'success' && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          {getFileIcon(selectedFile.name)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
              {isPdf && ' · PDF will be auto-parsed'}
            </p>
          </div>
          <button
            onClick={resetUpload}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PDF-specific reminder when file is selected */}
      {isPdf && state === 'idle' && (
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-primary leading-relaxed">
            Heads up! We&apos;ll extract what we can from this PDF. Please review the results
            after upload — you can always edit or remove any items that don&apos;t look right.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive leading-relaxed">{error}</p>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && state !== 'success' && (
        <button
          onClick={handleUpload}
          disabled={state === 'uploading'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {state === 'uploading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isPdf ? 'Parsing PDF & extracting menu items...' : 'Processing...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload {isPdf ? '& Parse' : ''} Menu
            </>
          )}
        </button>
      )}

      {/* Success state */}
      {state === 'success' && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-medium">
              {result.itemsAdded > 0
                ? `${result.itemsAdded} menu items added!`
                : 'File processed — no new items found.'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold text-foreground">{result.itemsAdded}</p>
              <p className="text-[10px] text-muted-foreground">Added</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold text-foreground">{result.duplicatesSkipped}</p>
              <p className="text-[10px] text-muted-foreground">Duplicates</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold text-foreground">{result.invalidSkipped}</p>
              <p className="text-[10px] text-muted-foreground">Skipped</p>
            </div>
          </div>

          {/* Matched competitor */}
          {result.competitorMatched && (
            <p className="text-xs text-muted-foreground">
              Matched to: <span className="font-medium text-foreground">{result.competitorMatched}</span>
            </p>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-1.5">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview of extracted items */}
          {result.items && result.items.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3 py-1.5 bg-muted/40 border-b border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Preview (first {Math.min(result.items.length, 10)})
                </p>
              </div>
              <div className="divide-y divide-border">
                {result.items.slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5">
                    <div>
                      <p className="text-xs font-medium text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    </div>
                    {item.price != null && (
                      <p className="text-xs font-semibold text-foreground">${item.price}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF-specific review reminder */}
          {result.format === 'pdf' && result.itemsAdded > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-primary leading-relaxed">
                These items were extracted from a PDF — nice work! Just take a quick peek to make
                sure the names and prices look right. You&apos;re the expert here.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={resetUpload}
              className="flex-1 px-3 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
            >
              Upload Another
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSV format hint */}
      {state === 'idle' && !selectedFile && (
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            What format should my CSV be in?
          </summary>
          <div className="mt-2 rounded-lg bg-muted/40 border border-border p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Include a header row with column names. We automatically detect these columns:
            </p>
            <code className="block text-[11px] text-foreground bg-muted rounded px-2 py-1.5 font-mono">
              name,price,category{'\n'}
              Smash Burger,24,Entrees{'\n'}
              Espresso Martini,19,Cocktails{'\n'}
              Truffle Fries,14,Sides
            </code>
            <p className="text-[10px] text-muted-foreground mt-2">
              Columns can be named: name/item/dish, price/cost, category/section/type, description
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
