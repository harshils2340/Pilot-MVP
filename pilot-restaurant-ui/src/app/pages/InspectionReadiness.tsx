import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

interface Item {
  id: string;
  label: string;
}

const items: Item[] = [
  { id: "temps", label: "Food temperatures logged — hot (135°F+) and cold (41°F or below)" },
  { id: "thermometer", label: "Thermometer calibrated and available" },
  { id: "handwash", label: "Handwashing stations stocked — soap, paper towels, accessible" },
  { id: "no-bare-hands", label: "No bare-hand contact with ready-to-eat food" },
  { id: "gloves", label: "Gloves and utensils in use where required" },
  { id: "storage", label: "Food storage order correct — raw meats stored below ready-to-eat foods" },
  { id: "labels", label: "Date labels on all prepared and cooked foods" },
  { id: "sanitizer", label: "Sanitizer concentration tested and logged (200–400 ppm chlorine)" },
  { id: "surfaces", label: "Food-contact surfaces cleaned and sanitized" },
  { id: "non-contact", label: "Non-food-contact surfaces clean — hood exterior, shelving, equipment" },
  { id: "pest", label: "Pest control report on file and available" },
  { id: "hood", label: "Hood cleaning certificate available (within last 6 months)" },
  { id: "report", label: "Last inspection report posted or available on-site" },
  { id: "suppliers", label: "Food sourced from approved suppliers" },
  { id: "garbage", label: "Garbage receptacles covered, waste removed regularly" },
  { id: "floors", label: "Floors, walls, and ceiling clean and in good repair" },
  { id: "lighting", label: "Adequate lighting in kitchen and storage areas" },
  { id: "equipment", label: "Equipment in good working condition and repair" },
  { id: "chemicals", label: "Chemicals stored away from food and labeled" },
];

export function InspectionReadinessPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<"all" | "done" | "todo">("all");

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openNote = (id: string) => {
    setDraft(notes[id] ?? "");
    setEditingNote(id);
  };

  const saveNote = (id: string) => {
    setNotes((prev) => ({ ...prev, [id]: draft }));
    setEditingNote(null);
    setDraft("");
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const done = items.filter((i) => checked[i.id]).length;

  const filtered =
    filter === "all"
      ? items
      : filter === "done"
      ? items.filter((i) => checked[i.id])
      : items.filter((i) => !checked[i.id]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[#111827]">Inspection Checklist</h1>
          <p className="text-[#9CA3AF] mt-1" style={{ fontSize: "13.5px" }}>
            {done} of {items.length} checked
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "todo", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                filter === f ? "bg-[#111827] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-px">
        {filtered.map((item) => {
          const isChecked = checked[item.id];
          const hasNote = !!notes[item.id];
          const isEditing = editingNote === item.id;

          return (
            <div key={item.id} className="bg-white border border-[#F3F4F6] rounded-lg mb-1">
              <div className="flex items-start gap-3 px-4 py-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggle(item.id)}
                  className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderColor: isChecked ? "#22c55e" : "#D1D5DB",
                    backgroundColor: isChecked ? "#22c55e" : "transparent",
                  }}
                >
                  {isChecked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`${isChecked ? "line-through text-[#9CA3AF]" : "text-[#111827]"}`}
                    style={{ fontSize: "13.5px", lineHeight: 1.5 }}
                  >
                    {item.label}
                  </p>

                  {/* Existing note */}
                  {hasNote && !isEditing && (
                    <div className="mt-1.5 flex items-start gap-2 group">
                      <p className="text-[#6B7280] flex-1" style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
                        {notes[item.id]}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openNote(item.id)}
                          className="text-[#9CA3AF] hover:text-[#374151] transition-colors"
                          style={{ fontSize: "11.5px" }}
                        >
                          edit
                        </button>
                        <span className="text-[#D1D5DB]">·</span>
                        <button
                          onClick={() => deleteNote(item.id)}
                          className="text-[#9CA3AF] hover:text-red-400 transition-colors"
                          style={{ fontSize: "11.5px" }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Note editor */}
                  {isEditing && (
                    <div className="mt-2">
                      <textarea
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Add a note…"
                        className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] text-[#374151] placeholder-[#C4C9D4] resize-none focus:outline-none focus:border-blue-400 transition-colors"
                        style={{ fontSize: "13px", lineHeight: 1.5, minHeight: "64px" }}
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => saveNote(item.id)}
                          className="px-3 py-1 bg-[#111827] text-white rounded-lg transition-colors hover:bg-[#374151]"
                          style={{ fontSize: "12.5px" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingNote(null); setDraft(""); }}
                          className="px-3 py-1 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                          style={{ fontSize: "12.5px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Note button */}
                {!isEditing && !hasNote && (
                  <button
                    onClick={() => openNote(item.id)}
                    className="shrink-0 text-[#D1D5DB] hover:text-[#9CA3AF] transition-colors mt-0.5"
                    title="Add note"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-[#9CA3AF] py-8" style={{ fontSize: "14px" }}>
          {filter === "done" ? "No items completed yet." : filter === "todo" ? "All items done! 🎉" : "No items."}
        </p>
      )}
    </div>
  );
}
