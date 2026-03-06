import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  Search,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { useIsMobile } from "../components/ui/use-mobile";

type Category = "All" | "Licenses & Permits" | "Certifications" | "Inspections" | "Maintenance" | "Invoices";

interface Doc {
  name: string;
  category: Exclude<Category, "All">;
  issuer: string;
  date: string;
  amount?: string;
  expiryOrDue?: string;
  status: "Active" | "Due Soon" | "Expired" | "On File";
  extraction: { label: string; value: string }[];
}

const documents: Doc[] = [
  {
    name: "Health Permit 2026",
    category: "Licenses & Permits",
    issuer: "Santa Clara County",
    date: "Jan 5, 2026",
    expiryOrDue: "Jan 5, 2027",
    status: "Active",
    extraction: [
      { label: "Document Type", value: "Health Permit" },
      { label: "Permit Number", value: "HC-2026-00412" },
      { label: "Issuer", value: "Santa Clara County" },
      { label: "Issued", value: "Jan 5, 2026" },
      { label: "Expires", value: "Jan 5, 2027" },
    ],
  },
  {
    name: "Business License 2026",
    category: "Licenses & Permits",
    issuer: "City of San Jose",
    date: "Jan 10, 2026",
    expiryOrDue: "Jan 10, 2027",
    status: "Active",
    extraction: [
      { label: "Document Type", value: "Business License" },
      { label: "License Number", value: "BL-SJ-2026-8841" },
      { label: "Issuer", value: "City of San Jose" },
      { label: "Issued", value: "Jan 10, 2026" },
      { label: "Expires", value: "Jan 10, 2027" },
    ],
  },
  {
    name: "Food Manager Certification",
    category: "Certifications",
    issuer: "ServSafe",
    date: "Apr 3, 2023",
    expiryOrDue: "Apr 3, 2026",
    status: "Due Soon",
    extraction: [
      { label: "Document Type", value: "Food Manager Certification" },
      { label: "Certificate Holder", value: "Mike Kim" },
      { label: "Issued", value: "Apr 3, 2023" },
      { label: "Expires", value: "Apr 3, 2026" },
      { label: "Certificate #", value: "SRV-2023-018432" },
    ],
  },
  {
    name: "Food Handler Cards (4 staff)",
    category: "Certifications",
    issuer: "Santa Clara County",
    date: "Jun 15, 2025",
    expiryOrDue: "Jun 15, 2027",
    status: "Active",
    extraction: [
      { label: "Document Type", value: "Food Handler Cards" },
      { label: "Staff Count", value: "4 employees" },
      { label: "Issued", value: "Jun 15, 2025" },
      { label: "Expires", value: "Jun 15, 2027" },
    ],
  },
  {
    name: "Inspection Report — Feb 2026",
    category: "Inspections",
    issuer: "Santa Clara County",
    date: "Feb 24, 2026",
    status: "On File",
    extraction: [
      { label: "Inspection Date", value: "Feb 24, 2026" },
      { label: "Score", value: "81 / 100 — Grade B" },
      { label: "Inspector", value: "Sandra Lee" },
      { label: "Violations", value: "2 minor (corrected on-site)" },
      { label: "Next Inspection", value: "Est. Aug–Oct 2026" },
    ],
  },
  {
    name: "Inspection Report — Aug 2025",
    category: "Inspections",
    issuer: "Santa Clara County",
    date: "Aug 12, 2025",
    status: "On File",
    extraction: [
      { label: "Inspection Date", value: "Aug 12, 2025" },
      { label: "Score", value: "88 / 100 — Grade A" },
      { label: "Inspector", value: "Daniel Park" },
      { label: "Violations", value: "1 minor" },
    ],
  },
  {
    name: "Hood Cleaning — Feb 2026",
    category: "Maintenance",
    issuer: "Bay Area Hood Pros",
    date: "Feb 14, 2026",
    amount: "$380.00",
    expiryOrDue: "May 14, 2026",
    status: "Active",
    extraction: [
      { label: "Service", value: "Exhaust Hood Cleaning" },
      { label: "Vendor", value: "Bay Area Hood Pros" },
      { label: "Service Date", value: "Feb 14, 2026" },
      { label: "Next Service Due", value: "May 14, 2026" },
      { label: "Invoice #", value: "INV-7821" },
      { label: "Amount", value: "$380.00" },
    ],
  },
  {
    name: "Pest Control — Feb 2026",
    category: "Maintenance",
    issuer: "Terminix",
    date: "Feb 10, 2026",
    amount: "$145.00",
    expiryOrDue: "Mar 10, 2026",
    status: "Due Soon",
    extraction: [
      { label: "Service", value: "Pest Control Inspection" },
      { label: "Vendor", value: "Terminix" },
      { label: "Service Date", value: "Feb 10, 2026" },
      { label: "Next Service Due", value: "Mar 10, 2026" },
      { label: "Amount", value: "$145.00" },
    ],
  },
  {
    name: "Grease Trap Service — Jan 2026",
    category: "Maintenance",
    issuer: "CleanFlow Services",
    date: "Jan 22, 2026",
    amount: "$520.00",
    expiryOrDue: "Apr 22, 2026",
    status: "Active",
    extraction: [
      { label: "Service", value: "Grease Trap Cleaning" },
      { label: "Vendor", value: "CleanFlow Services" },
      { label: "Service Date", value: "Jan 22, 2026" },
      { label: "Next Service Due", value: "Apr 22, 2026" },
      { label: "Invoice #", value: "CF-1044" },
      { label: "Amount", value: "$520.00" },
    ],
  },
  {
    name: "Fire Suppression Inspection",
    category: "Maintenance",
    issuer: "Bay Fire Safety",
    date: "Dec 10, 2025",
    amount: "$210.00",
    expiryOrDue: "Jun 10, 2026",
    status: "Active",
    extraction: [
      { label: "Service", value: "Fire Suppression System Inspection" },
      { label: "Vendor", value: "Bay Fire Safety" },
      { label: "Service Date", value: "Dec 10, 2025" },
      { label: "Next Inspection", value: "Jun 10, 2026" },
      { label: "Amount", value: "$210.00" },
      { label: "Pass/Fail", value: "Pass" },
    ],
  },
  {
    name: "Walk-in Cooler Repair",
    category: "Invoices",
    issuer: "Pacific Refrigeration",
    date: "Feb 2, 2026",
    amount: "$875.00",
    status: "On File",
    extraction: [
      { label: "Service", value: "Walk-in Cooler Compressor Repair" },
      { label: "Vendor", value: "Pacific Refrigeration" },
      { label: "Date", value: "Feb 2, 2026" },
      { label: "Invoice #", value: "PR-3318" },
      { label: "Amount", value: "$875.00" },
    ],
  },
  {
    name: "Knife Sharpening Service",
    category: "Invoices",
    issuer: "Sharp Edge Co.",
    date: "Jan 30, 2026",
    amount: "$60.00",
    status: "On File",
    extraction: [
      { label: "Service", value: "Knife & Equipment Sharpening" },
      { label: "Vendor", value: "Sharp Edge Co." },
      { label: "Date", value: "Jan 30, 2026" },
      { label: "Amount", value: "$60.00" },
    ],
  },
];

const categories: Category[] = [
  "All",
  "Licenses & Permits",
  "Certifications",
  "Inspections",
  "Maintenance",
  "Invoices",
];

const categoryColors: Record<Exclude<Category, "All">, string> = {
  "Licenses & Permits": "bg-blue-50 text-blue-700",
  Certifications: "bg-purple-50 text-purple-700",
  Inspections: "bg-indigo-50 text-indigo-700",
  Maintenance: "bg-orange-50 text-orange-700",
  Invoices: "bg-teal-50 text-teal-700",
};

const statusColors: Record<Doc["status"], string> = {
  Active: "bg-green-50 text-green-700",
  "Due Soon": "bg-amber-50 text-amber-700",
  Expired: "bg-red-50 text-red-700",
  "On File": "bg-[#F3F4F6] text-[#6B7280]",
};

function DocDetailPanel({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-[#111827]" style={{ fontSize: "13px", fontWeight: 600 }}>
            Extracted Data
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#C4C9D4] hover:text-[#374151] transition-colors min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[#374151] mb-4" style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.4 }}>
        {doc.name}
      </p>
      <div className="space-y-3.5">
        {doc.extraction.map((field) => (
          <div key={field.label}>
            <p className="text-[#9CA3AF]" style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {field.label}
            </p>
            <p className="text-[#111827] mt-0.5" style={{ fontSize: "13.5px" }}>
              {field.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-[#F3F4F6]">
        <div className="flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
          <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>
            Pilot extracted and structured this data automatically.
          </p>
        </div>
      </div>
      <button
        onClick={() => toast.success(`Downloading ${doc.name} — in production, file would be fetched`)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
        style={{ fontSize: "12.5px" }}
      >
        <Download className="w-3.5 h-3.5" />
        Download original
      </button>
    </>
  );
}

export function DocumentsPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter((doc) => {
    const matchesCategory = activeCategory === "All" || doc.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      q === "" ||
      doc.name.toLowerCase().includes(q) ||
      doc.issuer.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      (doc.amount ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const counts: Record<Category, number> = {
    All: documents.length,
    "Licenses & Permits": documents.filter((d) => d.category === "Licenses & Permits").length,
    Certifications: documents.filter((d) => d.category === "Certifications").length,
    Inspections: documents.filter((d) => d.category === "Inspections").length,
    Maintenance: documents.filter((d) => d.category === "Maintenance").length,
    Invoices: documents.filter((d) => d.category === "Invoices").length,
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      toast.success(`Added ${files.length} file(s) — Pilot would extract data in production`);
      setShowUpload(false);
    }
    e.target.value = "";
  };

  const handleExport = () => {
    const headers = ["Name", "Category", "Issuer/Vendor", "Date", "Amount", "Expiry/Due", "Status"];
    const rows = filtered.map((doc) => [
      doc.name,
      doc.category,
      doc.issuer,
      doc.date,
      doc.amount ?? "",
      doc.expiryOrDue ?? "",
      doc.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sakura-ramen-documents.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Main panel */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[#111827]">Documents</h1>
            <p className="text-[#9CA3AF]" style={{ fontSize: "13.5px" }}>
              {documents.length} documents · Pilot extracts and organizes key data from each file.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-white border border-[#E5E7EB] rounded-lg text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all"
              style={{ fontSize: "13px" }}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => { setShowUpload(!showUpload); setSelectedDoc(null); }}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              style={{ fontSize: "13px" }}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
        </div>

        {/* Upload area */}
        {showUpload && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) {
                toast.success(`Added ${e.dataTransfer.files.length} file(s) — Pilot would extract data in production`);
                setShowUpload(false);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-7 text-center mb-5 transition-all cursor-pointer ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-[#D1D5DB] bg-white hover:border-blue-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2.5">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[#111827]" style={{ fontSize: "14px", fontWeight: 500 }}>
              Drop any compliance document here, or <span className="text-blue-600">browse files</span>
            </p>
            <p className="text-[#9CA3AF] mt-1" style={{ fontSize: "12.5px" }}>
              Permits · Invoices · Inspection reports · Certifications · Receipts · PDF, PNG, JPG
            </p>
          </div>
        )}

        {/* Category filters */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 md:mx-0 md:flex-wrap md:overflow-visible">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === cat
                  ? "bg-[#111827] border-[#111827] text-white"
                  : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#9CA3AF] hover:text-[#374151]"
              }`}
              style={{ fontSize: "12.5px" }}
            >
              {cat}
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                  activeCategory === cat ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"
                }`}
                style={{ fontSize: "10px", fontWeight: 600 }}
              >
                {counts[cat]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by name, vendor, type, amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-blue-400 transition-all"
            style={{ fontSize: "13.5px" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Table - hidden on mobile */}
        <div className="hidden md:block bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                <th className="text-left px-5 py-3 text-[#9CA3AF]" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                  Document
                </th>
                <th className="text-left px-4 py-3 text-[#9CA3AF]" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                  Vendor / Issuer
                </th>
                <th className="text-left px-4 py-3 text-[#9CA3AF]" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                  Date
                </th>
                <th className="text-left px-4 py-3 text-[#9CA3AF]" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-[#9CA3AF]" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                  Expiry / Due
                </th>
                <th className="text-left px-4 py-3 text-[#9CA3AF]" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F9FAFB]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#9CA3AF]" style={{ fontSize: "14px" }}>
                    No documents match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((doc, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedDoc(selectedDoc?.name === doc.name ? null : doc)}
                    className={`cursor-pointer transition-colors ${
                      selectedDoc?.name === doc.name ? "bg-blue-50" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#C4C9D4] shrink-0" />
                        <div>
                          <p className="text-[#111827]" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                            {doc.name}
                          </p>
                          <span
                            className={`inline-block px-1.5 py-px rounded mt-0.5 ${categoryColors[doc.category]}`}
                            style={{ fontSize: "11px", fontWeight: 500 }}
                          >
                            {doc.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#6B7280]" style={{ fontSize: "13px" }}>
                      {doc.issuer}
                    </td>
                    <td className="px-4 py-3.5 text-[#6B7280]" style={{ fontSize: "13px" }}>
                      {doc.date}
                    </td>
                    <td className="px-4 py-3.5 text-[#374151]" style={{ fontSize: "13px", fontWeight: doc.amount ? 500 : 400 }}>
                      {doc.amount ?? <span className="text-[#D1D5DB]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[#6B7280]" style={{ fontSize: "13px" }}>
                      {doc.expiryOrDue ?? <span className="text-[#D1D5DB]">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full ${statusColors[doc.status]}`}
                        style={{ fontSize: "11.5px", fontWeight: 500 }}
                      >
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card layout */}
        <div className="md:hidden space-y-2">
          {filtered.map((doc, i) => (
            <button
              key={i}
              onClick={() => setSelectedDoc(selectedDoc?.name === doc.name ? null : doc)}
              className={`w-full flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border text-left transition-all min-h-[44px] ${
                selectedDoc?.name === doc.name
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-[#E5E7EB] hover:border-blue-200"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-[#C4C9D4] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[#111827] truncate" style={{ fontSize: "14px", fontWeight: 500 }}>
                    {doc.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span
                      className={`inline-block px-1.5 py-px rounded ${categoryColors[doc.category]}`}
                      style={{ fontSize: "11px", fontWeight: 500 }}
                    >
                      {doc.category}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full ${statusColors[doc.status]}`}
                      style={{ fontSize: "11.5px", fontWeight: 500 }}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-[#6B7280] mt-1" style={{ fontSize: "12px" }}>
                    {doc.issuer} · {doc.date}
                    {doc.amount ? ` · ${doc.amount}` : ""}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length > 0 && (
          <p className="text-[#9CA3AF] mt-3" style={{ fontSize: "12px" }}>
            {filtered.length} document{filtered.length !== 1 ? "s" : ""} · Click any row to see extracted data
          </p>
        )}
      </div>

      {/* Detail panel - Sheet on mobile, side panel on desktop */}
      {selectedDoc && (
        <>
          {isMobile ? (
            <Sheet open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
              <SheetContent side="bottom" className="h-[85dvh] overflow-y-auto">
                <div className="p-4 pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <p className="text-[#111827]" style={{ fontSize: "13px", fontWeight: 600 }}>
                        Extracted Data
                      </p>
                    </div>
                  </div>
                  <p className="text-[#374151] mb-4" style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.4 }}>
                    {selectedDoc.name}
                  </p>
                  <div className="space-y-3.5">
                    {selectedDoc.extraction.map((field) => (
                      <div key={field.label}>
                        <p className="text-[#9CA3AF]" style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {field.label}
                        </p>
                        <p className="text-[#111827] mt-0.5" style={{ fontSize: "13.5px" }}>
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#F3F4F6]">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>
                        Pilot extracted and structured this data automatically.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success(`Downloading ${selectedDoc.name} — in production, file would be fetched`)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-3 min-h-[44px] border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
                    style={{ fontSize: "12.5px" }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download original
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="hidden md:block w-64 border-l border-[#E5E7EB] bg-white p-5 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <p className="text-[#111827]" style={{ fontSize: "13px", fontWeight: 600 }}>
                    Extracted Data
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-[#C4C9D4] hover:text-[#374151] transition-colors min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[#374151] mb-4" style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.4 }}>
                {selectedDoc.name}
              </p>
              <div className="space-y-3.5">
                {selectedDoc.extraction.map((field) => (
                  <div key={field.label}>
                    <p className="text-[#9CA3AF]" style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {field.label}
                    </p>
                    <p className="text-[#111827] mt-0.5" style={{ fontSize: "13.5px" }}>
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[#F3F4F6]">
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>
                    Pilot extracted and structured this data automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => toast.success(`Downloading ${selectedDoc.name} — in production, file would be fetched`)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
                style={{ fontSize: "12.5px" }}
              >
                <Download className="w-3.5 h-3.5" />
                Download original
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
