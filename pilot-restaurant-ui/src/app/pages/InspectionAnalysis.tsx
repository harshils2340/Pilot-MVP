import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Shield,
  Calendar,
  User,
  Clipboard,
} from "lucide-react";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { useIsMobile } from "../components/ui/use-mobile";

const inspection = {
  score: 81,
  grade: "B",
  date: "Feb 24, 2026",
  inspector: "Sandra Lee",
  location: "Sakura Ramen — 1420 N 1st St, San Jose CA",
  majorViolations: [
    {
      id: "V-001",
      title: "Improper food temperature control",
      points: 4,
      detail:
        "Hot foods were held below 135°F. Soup observed at 118°F during inspection. Food temperature logs were not available on-site.",
      corrected: false,
    },
  ],
  minorViolations: [
    {
      id: "V-002",
      title: "Handwashing station supplies missing",
      points: 2,
      detail:
        "Paper towels and soap were not present at the rear handwashing station. Staff must have supplies available at all times.",
      corrected: false,
    },
    {
      id: "V-003",
      title: "Non-food contact surfaces dirty",
      points: 2,
      detail:
        "Grease buildup observed on cookline hood exterior surfaces and shelf below prep station. Must be cleaned regularly.",
      corrected: false,
    },
  ],
  observations: [
    "Overall facility well-maintained",
    "Refrigerator temperatures within range",
    "Food storage properly labeled",
    "Pest control records on file",
  ],
};

const recommendations = [
  {
    priority: "high",
    action: "Verify hot food holding temperature daily",
    detail: "Use calibrated thermometer. Log readings at 11am, 2pm, and 5pm shifts. Maintain above 135°F.",
  },
  {
    priority: "high",
    action: "Restock soap and paper towels at all handwashing stations",
    detail: "Check supply levels at start of every shift. Keep backup supplies stocked in storage.",
  },
  {
    priority: "medium",
    action: "Clean cookline and hood surfaces nightly",
    detail: "Add to closing checklist. Use degreaser on hood exterior. Document cleaning log.",
  },
  {
    priority: "medium",
    action: "Set up daily food temperature log",
    detail: "Print or use digital log. Have log available for inspectors at all times.",
  },
  {
    priority: "low",
    action: "Schedule staff food safety refresher training",
    detail: "Review temperature danger zone (40°F–140°F) and handwashing procedures with all staff.",
  },
];

const priorityColors = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

type PriorityFilter = "all" | "high" | "medium" | "low";

export function InspectionAnalysisPage() {
  const [expandedViolation, setExpandedViolation] = useState<string | null>("V-001");
  const [corrected, setCorrected] = useState<Record<string, boolean>>({});
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [recsOpen, setRecsOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleCorrected = (id: string) => {
    setCorrected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scoreColor =
    inspection.score >= 90
      ? "text-green-600"
      : inspection.score >= 80
      ? "text-amber-600"
      : "text-red-600";

  const scoreRingColor =
    inspection.score >= 90
      ? "#16a34a"
      : inspection.score >= 80
      ? "#d97706"
      : "#dc2626";

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (inspection.score / 100) * circumference;

  const filteredRecs =
    priorityFilter === "all"
      ? recommendations
      : recommendations.filter((r) => r.priority === priorityFilter);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Main */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0">
        <div className="max-w-2xl">
          <div className="mb-7">
            <h1 className="text-[#111827]">Inspection Analysis</h1>
            <p className="text-[#6B7280] mt-1" style={{ fontSize: "14px" }}>
              Pilot converted your inspection report into structured feedback and action items.
            </p>
          </div>

          {/* Score card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-5">
            <div className="flex items-center gap-6">
              {/* Score ring */}
              <div className="relative shrink-0">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={scoreRingColor}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={scoreColor} style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1 }}>
                    {inspection.score}
                  </span>
                  <span className="text-[#9CA3AF]" style={{ fontSize: "11px" }}>
                    / 100
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700"
                    style={{ fontSize: "20px", fontWeight: 700 }}
                  >
                    {inspection.grade}
                  </span>
                  <div>
                    <p className="text-[#111827]" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Health Inspection
                    </p>
                    <p className="text-[#6B7280]" style={{ fontSize: "13px" }}>
                      Grade {inspection.grade} — Score {inspection.score}/100
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Inspection Date</p>
                    <p className="text-[#374151]" style={{ fontSize: "13px", fontWeight: 500 }}>{inspection.date}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Inspector</p>
                    <p className="text-[#374151]" style={{ fontSize: "13px", fontWeight: 500 }}>{inspection.inspector}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Point Deductions</p>
                    <p className="text-red-600" style={{ fontSize: "13px", fontWeight: 500 }}>−{100 - inspection.score} pts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Violations */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[#111827]">Violation Breakdown</h3>
            </div>

            {/* Major */}
            <div className="px-5 py-3 bg-red-50/40 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-red-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Major Violations
                </p>
              </div>
              {inspection.majorViolations.map((v) => (
                <div key={v.id} className="border border-red-100 rounded-lg overflow-hidden mb-2">
                  <button
                    onClick={() => setExpandedViolation(expandedViolation === v.id ? null : v.id)}
                    className="w-full flex items-center gap-3 p-3.5 bg-white text-left hover:bg-red-50/30 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer border-2 transition-colors ${corrected[v.id] ? "bg-green-500 border-green-500" : "border-[#D1D5DB]"}`}
                      onClick={(e) => { e.stopPropagation(); toggleCorrected(v.id); }}>
                      {corrected[v.id] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`flex-1 ${corrected[v.id] ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`} style={{ fontSize: "13.5px" }}>
                      {v.title}
                    </span>
                    <span className="text-red-600 shrink-0" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                      −{v.points} pts
                    </span>
                    {expandedViolation === v.id ? (
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                    )}
                  </button>
                  {expandedViolation === v.id && (
                    <div className="px-4 py-3 border-t border-red-50 bg-red-50/30">
                      <p className="text-[#374151]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                        {v.detail}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Minor */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-amber-700" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Minor Violations
                </p>
              </div>
              {inspection.minorViolations.map((v) => (
                <div key={v.id} className="border border-[#E5E7EB] rounded-lg overflow-hidden mb-2">
                  <button
                    onClick={() => setExpandedViolation(expandedViolation === v.id ? null : v.id)}
                    className="w-full flex items-center gap-3 p-3.5 bg-white text-left hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer border-2 transition-colors ${corrected[v.id] ? "bg-green-500 border-green-500" : "border-[#D1D5DB]"}`}
                      onClick={(e) => { e.stopPropagation(); toggleCorrected(v.id); }}
                    >
                      {corrected[v.id] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`flex-1 ${corrected[v.id] ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`} style={{ fontSize: "13.5px" }}>
                      {v.title}
                    </span>
                    <span className="text-amber-600 shrink-0" style={{ fontSize: "12.5px", fontWeight: 600 }}>
                      −{v.points} pts
                    </span>
                    {expandedViolation === v.id ? (
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                    )}
                  </button>
                  {expandedViolation === v.id && (
                    <div className="px-4 py-3 border-t border-[#F3F4F6] bg-[#F9FAFB]">
                      <p className="text-[#374151]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                        {v.detail}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Positive Observations */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <h3 className="text-[#111827]">Positive Observations</h3>
            </div>
            <div className="space-y-2">
              {inspection.observations.map((obs, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  <p className="text-[#374151]" style={{ fontSize: "13.5px" }}>{obs}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Recommendations button */}
          {isMobile && (
            <button
              onClick={() => setRecsOpen(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 min-h-[48px] bg-blue-600 text-white rounded-xl font-medium"
              style={{ fontSize: "14px" }}
            >
              <Shield className="w-4 h-4" />
              View Pilot Recommendations
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Recommendations Sheet */}
      {isMobile && (
        <Sheet open={recsOpen} onOpenChange={setRecsOpen}>
          <SheetContent side="bottom" className="h-[85dvh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-[#111827]" style={{ fontSize: "16px", fontWeight: 600 }}>Pilot Recommendations</h3>
              </div>
              <p className="text-[#6B7280] mb-4" style={{ fontSize: "13px" }}>Suggested fixes before your next inspection.</p>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {(["all", "high", "medium", "low"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize shrink-0 min-h-[44px] ${
                      priorityFilter === p ? "bg-[#111827] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredRecs.map((rec, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold capitalize mb-2 ${priorityColors[rec.priority as keyof typeof priorityColors]}`}>
                      {rec.priority}
                    </span>
                    <p className="text-[#111827] font-medium" style={{ fontSize: "14px" }}>{rec.action}</p>
                    <p className="text-[#6B7280] mt-1" style={{ fontSize: "13px", lineHeight: 1.5 }}>{rec.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Recommendations panel - desktop */}
      <div className="hidden md:block w-80 border-l border-[#E5E7EB] bg-white p-6 overflow-y-auto shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-blue-600" />
          <p className="text-[#111827]" style={{ fontSize: "14px", fontWeight: 600 }}>
            Pilot Recommendations
          </p>
        </div>
        <p className="text-[#6B7280] mb-3" style={{ fontSize: "12.5px" }}>
          Suggested fixes before your next inspection.
        </p>

        <div className="flex gap-1 mb-4">
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
                priorityFilter === p
                  ? "bg-[#111827] text-white"
                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredRecs.map((rec, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
              <div className="flex items-start gap-2 mb-2">
                <span
                  className={`px-1.5 py-0.5 rounded border shrink-0 capitalize ${priorityColors[rec.priority as keyof typeof priorityColors]}`}
                  style={{ fontSize: "10.5px", fontWeight: 600 }}
                >
                  {rec.priority}
                </span>
              </div>
              <p className="text-[#111827] mb-1" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                {rec.action}
              </p>
              <p className="text-[#6B7280]" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                {rec.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
