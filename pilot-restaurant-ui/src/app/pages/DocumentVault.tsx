import { useState } from "react";
import { Search, FileText, ChevronDown, Filter, Download } from "lucide-react";

type DocStatus = "Active" | "Due Soon" | "Completed" | "Expired";

interface Document {
  name: string;
  type: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: DocStatus;
  category: string;
}

const documents: Document[] = [
  {
    name: "Health Permit",
    type: "License",
    issuer: "Santa Clara County",
    issueDate: "Jan 2026",
    expiryDate: "Jan 2027",
    status: "Active",
    category: "Permits",
  },
  {
    name: "Pest Control Service",
    type: "Maintenance",
    issuer: "Terminix",
    issueDate: "Feb 2026",
    expiryDate: "Mar 2026",
    status: "Due Soon",
    category: "Maintenance",
  },
  {
    name: "Inspection Report",
    type: "Inspection",
    issuer: "Santa Clara County",
    issueDate: "Feb 2026",
    expiryDate: "—",
    status: "Completed",
    category: "Inspections",
  },
  {
    name: "Hood Cleaning Invoice",
    type: "Maintenance",
    issuer: "Bay Area Hood Pros",
    issueDate: "Feb 2026",
    expiryDate: "May 2026",
    status: "Active",
    category: "Maintenance",
  },
  {
    name: "Food Safety Certificate",
    type: "Certification",
    issuer: "ServSafe",
    issueDate: "Apr 2025",
    expiryDate: "Apr 2026",
    status: "Due Soon",
    category: "Certifications",
  },
  {
    name: "Business License",
    type: "License",
    issuer: "City of San Jose",
    issueDate: "Jan 2026",
    expiryDate: "Jan 2027",
    status: "Active",
    category: "Permits",
  },
  {
    name: "Fire Safety Inspection",
    type: "Inspection",
    issuer: "San Jose Fire Dept.",
    issueDate: "Dec 2025",
    expiryDate: "Dec 2026",
    status: "Active",
    category: "Inspections",
  },
  {
    name: "Grease Trap Service",
    type: "Maintenance",
    issuer: "CleanFlow Systems",
    issueDate: "Jan 2026",
    expiryDate: "Apr 2026",
    status: "Active",
    category: "Maintenance",
  },
];

const statusColors: Record<DocStatus, string> = {
  Active: "bg-green-50 text-green-700",
  "Due Soon": "bg-amber-50 text-amber-700",
  Completed: "bg-blue-50 text-blue-700",
  Expired: "bg-red-50 text-red-700",
};

const suggestions = [
  "inspection reports from 2026",
  "pest control invoices",
  "documents expiring soon",
  "Santa Clara County permits",
];

export function DocumentVaultPage() {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filters = ["All", "Permits", "Maintenance", "Inspections", "Certifications"];

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      search === "" ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.type.toLowerCase().includes(search.toLowerCase()) ||
      doc.issuer.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "All" || doc.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[#111827]">Document Vault</h1>
        <p className="text-[#6B7280] mt-1" style={{ fontSize: "14px" }}>
          All your compliance documents, organized and searchable in one place.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-5">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search documents, types, issuers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#F7F8FA] border border-[#E5E7EB] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            style={{ fontSize: "14px" }}
          />
          {showSuggestions && search === "" && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-10 p-2">
              <p className="text-[#9CA3AF] px-2 py-1 mb-1" style={{ fontSize: "11.5px" }}>
                Suggested searches
              </p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={() => setSearch(s)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F7F8FA] text-left transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span className="text-[#374151]" style={{ fontSize: "13.5px" }}>
                    {s}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === f
                  ? "bg-blue-600 text-white"
                  : "bg-[#F7F8FA] text-[#374151] hover:bg-[#EEEEF0]"
              }`}
              style={{ fontSize: "13px" }}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[#9CA3AF]" style={{ fontSize: "13px" }}>
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="text-left px-5 py-3 text-[#6B7280]" style={{ fontSize: "12px", fontWeight: 500 }}>
                Document
              </th>
              <th className="text-left px-4 py-3 text-[#6B7280]" style={{ fontSize: "12px", fontWeight: 500 }}>
                Type
              </th>
              <th className="text-left px-4 py-3 text-[#6B7280]" style={{ fontSize: "12px", fontWeight: 500 }}>
                Vendor / Issuer
              </th>
              <th className="text-left px-4 py-3 text-[#6B7280]" style={{ fontSize: "12px", fontWeight: 500 }}>
                Issue Date
              </th>
              <th className="text-left px-4 py-3 text-[#6B7280]" style={{ fontSize: "12px", fontWeight: 500 }}>
                Expiry Date
              </th>
              <th className="text-left px-4 py-3 text-[#6B7280]" style={{ fontSize: "12px", fontWeight: 500 }}>
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filtered.map((doc, i) => (
              <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-[#F3F4F6] rounded-md flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
                    </div>
                    <span className="text-[#111827]" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                      {doc.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[#6B7280]" style={{ fontSize: "13.5px" }}>
                  {doc.type}
                </td>
                <td className="px-4 py-3.5 text-[#374151]" style={{ fontSize: "13.5px" }}>
                  {doc.issuer}
                </td>
                <td className="px-4 py-3.5 text-[#6B7280]" style={{ fontSize: "13.5px" }}>
                  {doc.issueDate}
                </td>
                <td className="px-4 py-3.5 text-[#6B7280]" style={{ fontSize: "13.5px" }}>
                  {doc.expiryDate}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full ${statusColors[doc.status]}`}
                    style={{ fontSize: "12px", fontWeight: 500 }}
                  >
                    {doc.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
