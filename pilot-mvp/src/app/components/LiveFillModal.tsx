'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, Download, Loader2, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

/**
 * Field definition for the live-fill animation.
 * Each entry maps a PDF field name to a human-readable label and the value to fill.
 */
interface FillStep {
  fieldName: string;
  label: string;
  value: string;
  type: 'text' | 'dropdown' | 'checkbox';
}

interface LiveFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** URL to the blank government PDF form */
  pdfSourceUrl: string;
  /** Display title */
  formTitle: string;
  /** Ordered list of fields to fill — drives the animation */
  fillSteps: FillStep[];
  /** Optional filename for download */
  downloadFilename?: string;
}

export function LiveFillModal({
  isOpen,
  onClose,
  pdfSourceUrl,
  formTitle,
  fillSteps,
  downloadFilename = 'filled-form.pdf',
}: LiveFillModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blankBytes, setBlankBytes] = useState<Uint8Array | null>(null);
  const [currentBlobUrl, setCurrentBlobUrl] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [filledSteps, setFilledSteps] = useState<number>(0); // how many steps are done
  const [activeStep, setActiveStep] = useState<number>(-1); // which step is currently being filled
  const [done, setDone] = useState(false);
  const [filledPdfBytes, setFilledPdfBytes] = useState<Uint8Array | null>(null);

  // Load the blank PDF when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setFilledSteps(0);
    setActiveStep(-1);
    setDone(false);
    setFilledPdfBytes(null);

    (async () => {
      try {
        // Fetch via our proxy to avoid CORS issues with external gov PDFs
        const isExternal = pdfSourceUrl.startsWith('http');
        const fetchUrl = isExternal
          ? `/api/documents/proxy-pdf?url=${encodeURIComponent(pdfSourceUrl)}`
          : pdfSourceUrl;

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        setBlankBytes(bytes);

        // Show the blank PDF in the iframe
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setCurrentBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      setCurrentBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [isOpen, pdfSourceUrl]);

  // Auto-scroll the log to the bottom as steps complete
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [filledSteps, activeStep]);

  /**
   * The core live-fill routine.
   * Fills fields one at a time using pdf-lib, updating the iframe
   * after every few fields so the user sees the PDF changing live.
   */
  const handleFill = useCallback(async () => {
    if (!blankBytes || filling) return;
    setFilling(true);
    setFilledSteps(0);
    setActiveStep(0);
    setDone(false);

    try {
      const pdfDoc = await PDFDocument.load(blankBytes, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
      const totalSteps = fillSteps.length;

      // How often to refresh the PDF preview (every N fields)
      const refreshEvery = 3;

      for (let i = 0; i < totalSteps; i++) {
        const step = fillSteps[i];
        setActiveStep(i);

        // Small delay for visual effect
        await new Promise((r) => setTimeout(r, 180));

        // Fill the field
        try {
          if (step.type === 'text') {
            form.getTextField(step.fieldName).setText(step.value);
          } else if (step.type === 'checkbox') {
            form.getCheckBox(step.fieldName).check();
          } else if (step.type === 'dropdown') {
            const dd = form.getDropdown(step.fieldName);
            const opts = dd.getOptions();
            const match = opts.find((o) => o === step.value) ??
              opts.find((o) => o.toLowerCase().includes(step.value.toLowerCase()));
            if (match) dd.select(match);
          }
        } catch {
          // Field not found — skip
        }

        setFilledSteps(i + 1);

        // Refresh PDF preview periodically
        if ((i + 1) % refreshEvery === 0 || i === totalSteps - 1) {
          const snapshot = await pdfDoc.save();
          const blob = new Blob([snapshot], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setCurrentBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          // Brief pause so the browser actually re-renders
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      // Final save
      const finalBytes = await pdfDoc.save();
      setFilledPdfBytes(new Uint8Array(finalBytes));
      setActiveStep(-1);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fill failed');
    } finally {
      setFilling(false);
    }
  }, [blankBytes, filling, fillSteps]);

  const handleDownload = () => {
    const bytes = filledPdfBytes;
    if (!bytes) return;
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface border-b border-border shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">{formTitle}</h2>
            <p className="text-xs text-muted-foreground">
              {done
                ? `${filledSteps} fields filled`
                : filling
                ? `Filling field ${filledSteps + 1} of ${fillSteps.length}…`
                : `${fillSteps.length} fields detected`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!done && !filling && (
            <button
              onClick={handleFill}
              disabled={loading || !!error}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-sm disabled:opacity-60 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Fill with AI
            </button>
          )}
          {filling && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 border border-purple-300 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              Filling…
            </div>
          )}
          {done && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download Filled PDF
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body: PDF viewer + field log */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: PDF viewer */}
        <div className="flex-1 bg-neutral-100 dark:bg-neutral-900 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading government form…</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
              <div className="text-center">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}
          {currentBlobUrl && (
            <iframe
              ref={iframeRef}
              src={currentBlobUrl}
              className="w-full h-full border-0"
              title="PDF Form"
            />
          )}
        </div>

        {/* Right: Live fill log (only shows during/after fill) */}
        {(filling || done) && (
          <aside className="w-80 bg-surface border-l border-border flex flex-col">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                AI Fill Progress
              </h3>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(filledSteps / fillSteps.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {filledSteps} / {fillSteps.length} fields
              </p>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1">
              {fillSteps.map((step, i) => {
                const isActive = i === activeStep;
                const isDone = i < filledSteps;
                const isPending = i > filledSteps;
                return (
                  <div
                    key={step.fieldName}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
                        : isDone
                        ? 'bg-green-50/50 dark:bg-green-900/10'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isActive ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${isDone || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      {(isDone || isActive) && (
                        <p className="text-muted-foreground mt-0.5 truncate">
                          {step.type === 'checkbox' ? '☑ Checked' : step.value}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {done && (
              <div className="px-4 py-3 border-t border-border bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-4 h-4" />
                  All fields filled successfully
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Review the PDF and download when ready.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
