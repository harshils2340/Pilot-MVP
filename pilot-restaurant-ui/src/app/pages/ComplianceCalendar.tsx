import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Tag,
} from "lucide-react";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { useIsMobile } from "../components/ui/use-mobile";

interface ComplianceEvent {
  date: string;
  day: number;
  month: number;
  title: string;
  category: string;
  urgency: "urgent" | "soon" | "normal" | "done";
  owner: string;
  status: string;
  relatedDoc: string;
  description: string;
}

const events: ComplianceEvent[] = [
  {
    date: "Mar 10, 2026",
    day: 10,
    month: 3,
    title: "Pest Control Service Due",
    category: "Maintenance",
    urgency: "urgent",
    owner: "Mike Kim",
    status: "Action Required",
    relatedDoc: "Pest Control Report.pdf",
    description: "Schedule next pest control service with Terminix. Last service completed Feb 10.",
  },
  {
    date: "Apr 5, 2026",
    day: 5,
    month: 4,
    title: "Food Safety Certificate Renewal",
    category: "Certification",
    urgency: "soon",
    owner: "Mike Kim",
    status: "Upcoming",
    relatedDoc: "Food Safety Certificate.pdf",
    description: "ServSafe Food Manager Certification expires Apr 2026. Schedule exam renewal.",
  },
  {
    date: "Apr 14, 2026",
    day: 14,
    month: 4,
    title: "Grease Trap Cleaning Due",
    category: "Maintenance",
    urgency: "soon",
    owner: "Operations",
    status: "Upcoming",
    relatedDoc: "Grease Trap Service.pdf",
    description: "Quarterly grease trap service due. Contact CleanFlow Systems to schedule.",
  },
  {
    date: "May 12, 2026",
    day: 12,
    month: 5,
    title: "Hood Cleaning Required",
    category: "Maintenance",
    urgency: "normal",
    owner: "Operations",
    status: "Scheduled",
    relatedDoc: "Hood Cleaning Invoice.pdf",
    description: "Semi-annual hood and exhaust cleaning required per county health code.",
  },
  {
    date: "Jun 1, 2026",
    day: 1,
    month: 6,
    title: "Annual Health Inspection",
    category: "Inspection",
    urgency: "normal",
    owner: "Mike Kim",
    status: "Scheduled",
    relatedDoc: "Inspection Report.pdf",
    description: "Estimated window for next annual Santa Clara County health inspection.",
  },
  {
    date: "Jan 5, 2027",
    day: 5,
    month: 1,
    title: "Health Permit Renewal",
    category: "License",
    urgency: "normal",
    owner: "Mike Kim",
    status: "On Track",
    relatedDoc: "Health Permit.pdf",
    description: "Annual health permit renewal due. Apply through Santa Clara County portal.",
  },
];

const urgencyConfig = {
  urgent: { color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500", icon: AlertTriangle, iconColor: "text-red-500" },
  soon: { color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500", icon: Clock, iconColor: "text-amber-500" },
  normal: { color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500", icon: Clock, iconColor: "text-blue-400" },
  done: { color: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-500", icon: CheckCircle2, iconColor: "text-green-500" },
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function ComplianceCalendarPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<ComplianceEvent | null>(events[0]);
  const [currentMonth, setCurrentMonth] = useState(2); // March = index 2 (0-based)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const monthFiltered = events.filter((e) => e.month === currentMonth + 1 && !completedIds.has(`${e.title}-${e.date}`));

  const handleMarkCompleted = (event: ComplianceEvent) => {
    setCompletedIds((prev) => new Set(prev).add(`${event.title}-${event.date}`));
    setSelectedEvent(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Main */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0">
        <div className="max-w-2xl">
          <div className="mb-7">
            <h1 className="text-[#111827]">Compliance Calendar</h1>
            <p className="text-[#6B7280] mt-1" style={{ fontSize: "14px" }}>
              Upcoming deadlines and compliance events, automatically extracted from your documents.
            </p>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setCurrentMonth((m) => Math.max(0, m - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F7F8FA] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
            </button>
            <span className="text-[#111827]" style={{ fontSize: "14px", fontWeight: 500 }}>
              {monthNames[currentMonth]} 2026
            </span>
            <button
              onClick={() => setCurrentMonth((m) => Math.min(11, m + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F7F8FA] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {monthFiltered.length === 0 ? (
              <div className="p-8 text-center text-[#9CA3AF]" style={{ fontSize: "14px" }}>
                No events in {monthNames[currentMonth]} — use arrows to change month
              </div>
            ) : (
            monthFiltered.map((event, i) => {
              const cfg = urgencyConfig[event.urgency];
              const Icon = cfg.icon;
              const isSelected = selectedEvent?.title === event.title;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-blue-300 bg-blue-50 shadow-sm"
                      : "border-[#E5E7EB] bg-white hover:border-blue-200"
                  }`}
                >
                  {/* Date pill */}
                  <div className="shrink-0 text-center min-w-[52px]">
                    <div
                      className={`px-2 py-1.5 rounded-lg ${
                        event.urgency === "urgent"
                          ? "bg-red-50"
                          : event.urgency === "soon"
                          ? "bg-amber-50"
                          : "bg-[#F3F4F6]"
                      }`}
                    >
                      <p
                        className={`${
                          event.urgency === "urgent"
                            ? "text-red-600"
                            : event.urgency === "soon"
                            ? "text-amber-600"
                            : "text-[#374151]"
                        }`}
                        style={{ fontSize: "18px", fontWeight: 600, lineHeight: 1.1 }}
                      >
                        {event.day}
                      </p>
                      <p
                        className={`${
                          event.urgency === "urgent"
                            ? "text-red-500"
                            : event.urgency === "soon"
                            ? "text-amber-500"
                            : "text-[#9CA3AF]"
                        }`}
                        style={{ fontSize: "11px" }}
                      >
                        {monthNames[event.month - 1].slice(0, 3)}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[#111827]" style={{ fontSize: "14px", fontWeight: 500 }}>
                        {event.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${cfg.color}`}
                        style={{ fontSize: "11.5px" }}
                      >
                        <Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                        {event.status}
                      </span>
                      <span className="text-[#9CA3AF]" style={{ fontSize: "12px" }}>
                        {event.category}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
            )}
          </div>
        </div>
      </div>

      {/* Event Detail Panel - Sheet on mobile, side panel on desktop */}
      {isMobile ? (
        <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <SheetContent side="bottom" className="h-[85dvh] overflow-y-auto">
            {selectedEvent && (
              <div className="p-4">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-3 ${urgencyConfig[selectedEvent.urgency].color}`} style={{ fontSize: "12px" }}>
                  {(() => { const Icon = urgencyConfig[selectedEvent.urgency].icon; return <Icon className={`w-3 h-3 ${urgencyConfig[selectedEvent.urgency].iconColor}`} />; })()}
                  {selectedEvent.status}
                </div>
                <h3 className="text-[#111827] text-lg">{selectedEvent.title}</h3>
                <p className="text-[#6B7280] mt-1" style={{ fontSize: "13.5px" }}>{selectedEvent.date}</p>
                <p className="text-[#374151] my-5" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>{selectedEvent.description}</p>
                <div className="space-y-3 mb-5">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-[#9CA3AF] mt-0.5" />
                    <div>
                      <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Owner</p>
                      <p className="text-[#374151]" style={{ fontSize: "13.5px" }}>{selectedEvent.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Tag className="w-4 h-4 text-[#9CA3AF] mt-0.5" />
                    <div>
                      <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Category</p>
                      <p className="text-[#374151]" style={{ fontSize: "13.5px" }}>{selectedEvent.category}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-[#9CA3AF] mt-0.5" />
                    <div>
                      <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Related Document</p>
                      <p className="text-[#374151]" style={{ fontSize: "13.5px" }}>{selectedEvent.relatedDoc}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <button onClick={() => selectedEvent && handleMarkCompleted(selectedEvent)} className="w-full px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ fontSize: "13.5px" }}>Mark as Completed</button>
                  <button onClick={() => navigate("/documents")} className="w-full px-4 py-3 min-h-[44px] bg-[#F7F8FA] text-[#374151] rounded-lg hover:bg-[#EEEEF0] border border-[#E5E7EB] transition-colors" style={{ fontSize: "13.5px" }}>View Document</button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <div className="w-80 border-l border-[#E5E7EB] bg-white p-6 overflow-y-auto shrink-0">
        {selectedEvent ? (
          <>
            <div className="mb-5">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border mb-3 ${urgencyConfig[selectedEvent.urgency].color}`}
                style={{ fontSize: "12px" }}
              >
                {(() => {
                  const Icon = urgencyConfig[selectedEvent.urgency].icon;
                  return <Icon className={`w-3 h-3 ${urgencyConfig[selectedEvent.urgency].iconColor}`} />;
                })()}
                {selectedEvent.status}
              </div>
              <h3 className="text-[#111827]">{selectedEvent.title}</h3>
              <p className="text-[#6B7280] mt-1" style={{ fontSize: "13.5px" }}>
                {selectedEvent.date}
              </p>
            </div>

            <p className="text-[#374151] mb-5" style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
              {selectedEvent.description}
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#9CA3AF] mt-0.5" />
                <div>
                  <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Owner</p>
                  <p className="text-[#374151]" style={{ fontSize: "13.5px" }}>{selectedEvent.owner}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-[#9CA3AF] mt-0.5" />
                <div>
                  <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Category</p>
                  <p className="text-[#374151]" style={{ fontSize: "13.5px" }}>{selectedEvent.category}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-[#9CA3AF] mt-0.5" />
                <div>
                  <p className="text-[#9CA3AF]" style={{ fontSize: "11.5px" }}>Related Document</p>
                  <p className="text-[#374151]" style={{ fontSize: "13.5px" }}>{selectedEvent.relatedDoc}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => selectedEvent && handleMarkCompleted(selectedEvent)}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                style={{ fontSize: "13.5px" }}
              >
                Mark as Completed
              </button>
              <button
                onClick={() => navigate("/documents")}
                className="w-full px-4 py-2.5 bg-[#F7F8FA] text-[#374151] rounded-lg hover:bg-[#EEEEF0] border border-[#E5E7EB] transition-colors"
                style={{ fontSize: "13.5px" }}
              >
                View Document
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-[#9CA3AF]" style={{ fontSize: "13.5px" }}>Select an event to view details</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
