import { NavLink, Outlet } from "react-router";
import { Toaster } from "./ui/sonner";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  ClipboardList,
  CheckSquare,
  MessageSquare,
  ChefHat,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/inspections", label: "Inspections", icon: ClipboardList },
  { to: "/readiness", label: "Checklist", icon: CheckSquare },
  { to: "/assistant", label: "Ask Pilot", icon: MessageSquare },
];

export function Layout() {
  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-48 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#111827]" style={{ fontSize: "16px", fontWeight: 600 }}>
              Pilot
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 pb-4">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : ""}`}
                    />
                    <span style={{ fontSize: "13.5px", fontWeight: isActive ? 500 : 400 }}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#E5E7EB] rounded-full flex items-center justify-center shrink-0">
              <span className="text-[#374151]" style={{ fontSize: "11px", fontWeight: 600 }}>
                MK
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[#374151] truncate" style={{ fontSize: "13px", fontWeight: 500 }}>
                Mike Kim
              </p>
              <p className="text-[#9CA3AF] truncate" style={{ fontSize: "11px" }}>
                Sakura Ramen
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
