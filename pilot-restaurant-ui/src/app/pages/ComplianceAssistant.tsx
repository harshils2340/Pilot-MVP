import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  ChefHat,
  Mic,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  list?: string[];
  meta?: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi Mike 👋 I'm your Pilot compliance assistant. I have access to your documents, inspection history, and Santa Clara County requirements for Sakura Ramen. How can I help you today?",
    timestamp: "9:41 AM",
  },
  {
    id: "2",
    role: "user",
    content: "What permits do I need for my restaurant in San Jose?",
    timestamp: "9:42 AM",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Based on Santa Clara County requirements for your location, you need the following permits and certifications:",
    list: [
      "Health Permit — issued by Santa Clara County Environmental Health",
      "Food Safety Manager Certification — required for at least 1 person on staff",
      "Business License — City of San Jose",
      "Grease Interceptor Maintenance — quarterly service required",
      "Annual Hood Cleaning — per California Health & Safety Code",
    ],
    meta: "Your Health Permit is current through Jan 5, 2027. Food Safety Certificate expires Apr 2026.",
    timestamp: "9:42 AM",
  },
  {
    id: "4",
    role: "user",
    content: "When does my pest control service expire?",
    timestamp: "9:43 AM",
  },
  {
    id: "5",
    role: "assistant",
    content:
      "Based on your uploaded Pest Control Report, here's what I found:",
    list: [
      "Last service completed: Feb 10, 2026 by Terminix",
      "Next service recommended: Mar 10, 2026",
      "Service type: Preventative — Indoor treatment",
    ],
    meta: "Your pest control service is due in 6 days. I've added a reminder to your Compliance Calendar.",
    timestamp: "9:43 AM",
  },
];

const suggestedQuestions = [
  "What was flagged in my last inspection?",
  "How can I improve my inspection score?",
  "When is my food safety certificate expiring?",
  "What temperature should I hold hot foods at?",
  "Show me all documents expiring this month",
];

const simulatedResponses: Record<string, Omit<Message, "id" | "timestamp">> = {
  "what was flagged in my last inspection?": {
    role: "assistant",
    content: "Your Feb 24, 2026 inspection received a score of 81 (Grade B). Three violations were flagged:",
    list: [
      "Major: Improper food temperature control (−4 pts) — hot soup observed at 118°F",
      "Minor: Handwashing station supplies missing (−2 pts) — rear station had no soap/towels",
      "Minor: Non-food contact surfaces dirty (−2 pts) — grease buildup on cookline hood",
    ],
    meta: "Tip: Fixing these three items could bring your score above 90. Check the Inspection Analysis screen for detailed recommendations.",
  },
  "how can i improve my inspection score?": {
    role: "assistant",
    content: "Based on your last inspection, here are the highest-impact actions to improve your score:",
    list: [
      "Log food temperatures at every shift — this alone prevents the biggest deductions",
      "Restock handwashing stations daily and check at shift start",
      "Add cookline cleaning to your nightly closing checklist",
      "Keep a food temperature log visible for inspectors",
    ],
    meta: "Completing these steps could bring your score from 81 to 95+.",
  },
  "when is my food safety certificate expiring?": {
    role: "assistant",
    content: "Your Food Safety Manager Certificate (ServSafe) expires in April 2026.",
    list: [
      "Issued: April 2025",
      "Expires: April 2026",
      "Holder: Mike Kim",
      "Renewal: Schedule ServSafe exam at a certified testing center",
    ],
    meta: "I've flagged this on your Compliance Calendar. You have approximately 5 weeks to renew.",
  },
  "what temperature should i hold hot foods at?": {
    role: "assistant",
    content: "You must hold hot foods at 135°F or above to stay in compliance with food safety regulations.",
    list: [
      "Minimum hot holding: 135°F (57°C)",
      "Temperature danger zone: 41°F–135°F — food cannot be in this range for more than 4 hours",
      "Use a calibrated thermometer and log temperatures at each shift",
    ],
    meta: "Your last inspection noted soup at 118°F — keeping hot foods above 135°F would have avoided that violation.",
  },
  "show me all documents expiring this month": {
    role: "assistant",
    content: "Here are documents expiring in March 2026:",
    list: [
      "Pest Control Service — due Mar 10, 2026 (Terminix)",
    ],
    meta: "I've added these to your Compliance Calendar. Consider scheduling the pest control service this week.",
  },
};

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function ComplianceAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const key = text.toLowerCase().trim();
      let response = simulatedResponses[key];
      if (!response) {
        const partial = Object.keys(simulatedResponses).find((k) =>
          key.includes(k.split(" ")[0]) || k.split(" ").some((w) => key.includes(w))
        );
        response = partial ? simulatedResponses[partial] : undefined;
      }
      const fallback = {
        role: "assistant" as const,
        content:
          "I can help with that. Based on Santa Clara County requirements and your uploaded documents, let me look into this for you. For the most accurate information, you may also want to check directly with Santa Clara County Environmental Health.",
      };

      const assistantMsg: Message = {
        ...(response || fallback),
        id: String(Date.now() + 1),
        timestamp: formatTime(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMsg]);
    }, 1200);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar suggestions */}
      <div className="w-64 border-r border-[#E5E7EB] bg-white p-5 overflow-y-auto flex flex-col gap-5">
        <div>
          <p className="text-[#9CA3AF] mb-3" style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Suggested Questions
          </p>
          <div className="space-y-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-[#F7F8FA] hover:bg-blue-50 hover:text-blue-700 text-[#374151] transition-colors border border-transparent hover:border-blue-100"
                style={{ fontSize: "13px" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[#9CA3AF] mb-3" style={{ fontSize: "11.5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Your Documents
          </p>
          <div className="space-y-1.5">
            {[
              { name: "Health Permit", status: "Active", color: "text-green-600" },
              { name: "Pest Control Report", status: "Due Soon", color: "text-amber-600" },
              { name: "Inspection Report", status: "Reviewed", color: "text-blue-600" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F7F8FA]">
                <span className="text-[#374151]" style={{ fontSize: "12.5px" }}>{doc.name}</span>
                <span className={doc.color} style={{ fontSize: "11px" }}>{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#F7F8FA]">
        {/* Chat header */}
        <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[#111827]" style={{ fontSize: "14px", fontWeight: 600 }}>
              Pilot Compliance Assistant
            </p>
            <p className="text-[#9CA3AF]" style={{ fontSize: "12px" }}>
              Powered by your documents · Santa Clara County regulations
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[#9CA3AF]" style={{ fontSize: "12px" }}>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[72%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white border border-[#E5E7EB] text-[#111827] rounded-bl-md"
                }`}
              >
                <p
                  className={msg.role === "user" ? "text-white" : "text-[#111827]"}
                  style={{ fontSize: "14px", lineHeight: 1.6 }}
                >
                  {msg.content}
                </p>

                {msg.list && (
                  <ul className="mt-2.5 space-y-1.5">
                    {msg.list.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <span className="text-[#374151]" style={{ fontSize: "13.5px" }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {msg.meta && (
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                    <p className="text-[#6B7280]" style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
                      💡 {msg.meta}
                    </p>
                  </div>
                )}

                <p
                  className={`mt-1.5 ${msg.role === "user" ? "text-blue-200" : "text-[#9CA3AF]"}`}
                  style={{ fontSize: "11px" }}
                >
                  {msg.timestamp}
                </p>
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white" style={{ fontSize: "11px", fontWeight: 600 }}>MK</span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start gap-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#D1D5DB] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#D1D5DB] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#D1D5DB] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-[#E5E7EB] px-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl px-4 py-3 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Ask about your compliance requirements…"
                className="w-full bg-transparent text-[#111827] placeholder-[#9CA3AF] focus:outline-none"
                style={{ fontSize: "14px" }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[#9CA3AF] mt-2 text-center" style={{ fontSize: "11.5px" }}>
            Pilot uses your uploaded documents and county regulations to answer questions.
          </p>
        </div>
      </div>
    </div>
  );
}
