import { useNavigate } from "react-router";
import {
  FileText,
  CalendarDays,
  ClipboardList,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const alerts = [
  {
    urgency: "urgent",
    label: "Pest Control service due",
    date: "Mar 10, 2026",
    action: "View Calendar",
    to: "/calendar",
  },
  {
    urgency: "soon",
    label: "Food Safety Certificate expiring",
    date: "Apr 5, 2026",
    action: "View Document",
    to: "/documents",
  },
];

const sections = [
  {
    to: "/documents",
    icon: FileText,
    label: "Documents",
    desc: "Upload and store your permits, invoices, and reports.",
    count: "14 documents",
  },
  {
    to: "/calendar",
    icon: CalendarDays,
    label: "Compliance Calendar",
    desc: "See all upcoming renewal and service deadlines.",
    count: "3 upcoming",
  },
  {
    to: "/inspections",
    icon: ClipboardList,
    label: "Inspections",
    desc: "View your last inspection score and violations.",
    count: "Score 81 — Grade B",
  },
  {
    to: "/readiness",
    icon: CheckSquare,
    label: "Inspection Checklist",
    desc: "Run through the checklist before an inspector visits.",
    count: "6 of 9 done",
  },
  {
    to: "/assistant",
    icon: MessageSquare,
    label: "Ask Pilot",
    desc: "Ask any compliance question — Pilot knows your docs.",
    count: null,
  },
];

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="p-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[#111827]">Sakura Ramen</h1>
        <p className="text-[#9CA3AF]" style={{ fontSize: "14px" }}>
          San Jose, CA
        </p>
      </div>

      {/* Needs Attention */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <p
            className="text-[#6B7280] mb-3"
            style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            Needs Attention
          </p>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <button
                key={i}
                onClick={() => navigate(alert.to)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                  alert.urgency === "urgent"
                    ? "bg-red-50 border-red-200 hover:border-red-300"
                    : "bg-amber-50 border-amber-200 hover:border-amber-300"
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    alert.urgency === "urgent" ? "text-red-500" : "text-amber-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`${
                      alert.urgency === "urgent" ? "text-red-800" : "text-amber-800"
                    }`}
                    style={{ fontSize: "14px", fontWeight: 500 }}
                  >
                    {alert.label}
                  </p>
                  <p
                    className={`mt-0.5 ${
                      alert.urgency === "urgent" ? "text-red-500" : "text-amber-500"
                    }`}
                    style={{ fontSize: "12.5px" }}
                  >
                    Due {alert.date}
                  </p>
                </div>
                <ArrowRight
                  className={`w-4 h-4 shrink-0 ${
                    alert.urgency === "urgent" ? "text-red-400" : "text-amber-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section cards */}
      <div>
        <p
          className="text-[#6B7280] mb-3"
          style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          Everything
        </p>
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.to}
              onClick={() => navigate(section.to)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E5E7EB] text-left hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 bg-[#F3F4F6] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                <section.icon className="w-4.5 h-4.5 text-[#6B7280] group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#111827]" style={{ fontSize: "14px", fontWeight: 500 }}>
                  {section.label}
                </p>
                <p className="text-[#9CA3AF]" style={{ fontSize: "13px" }}>
                  {section.desc}
                </p>
              </div>
              {section.count && (
                <span
                  className="text-[#9CA3AF] shrink-0"
                  style={{ fontSize: "12.5px" }}
                >
                  {section.count}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-[#D1D5DB] shrink-0 group-hover:text-blue-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}