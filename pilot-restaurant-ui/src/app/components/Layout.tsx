import { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/inspections", label: "Inspections", icon: ClipboardList },
  { to: "/readiness", label: "Checklist", icon: CheckSquare },
  { to: "/assistant", label: "Ask Pilot", icon: MessageSquare },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-0.5">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : ""}`}
              />
              <span style={{ fontSize: "14px", fontWeight: isActive ? 500 : 400 }}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-dvh md:h-screen bg-[#F7F8FA] overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-48 bg-white border-r border-[#E5E7EB] flex-col shrink-0">
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
        <nav className="flex-1 px-2 pb-4 overflow-y-auto">
          <NavLinks />
        </nav>
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

      {/* Mobile header with hamburger */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E7EB] shrink-0 safe-area-top">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex items-center gap-2 min-h-[44px] min-w-[44px] -ml-2 rounded-lg active:bg-[#F3F4F6]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-[#374151]" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
                <span className="text-[#111827]" style={{ fontSize: "16px", fontWeight: 600 }}>
                  Pilot
                </span>
              </div>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              <div className="px-4 py-5 border-b border-[#E5E7EB]">
                <span className="text-[#111827]" style={{ fontSize: "18px", fontWeight: 600 }}>
                  Menu
                </span>
              </div>
              <nav className="flex-1 px-2 py-4 overflow-y-auto">
                <NavLinks onNavigate={() => setMobileMenuOpen(false)} />
              </nav>
              <div className="px-4 py-4 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#E5E7EB] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[#374151]" style={{ fontSize: "12px", fontWeight: 600 }}>
                      MK
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#374151] truncate" style={{ fontSize: "14px", fontWeight: 500 }}>
                      Mike Kim
                    </p>
                    <p className="text-[#9CA3AF] truncate" style={{ fontSize: "12px" }}>
                      Sakura Ramen
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main content - with bottom padding on mobile for nav */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] flex items-center justify-around safe-area-bottom z-40">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-[56px] min-h-[56px] transition-colors ${
                isActive ? "text-blue-600" : "text-[#6B7280] active:text-blue-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : ""}`} />
                <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400 }}>
                  {item.label === "Overview" ? "Home" : item.label.length > 8 ? item.label.slice(0, 8) : item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to="/assistant"
          end={false}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-[56px] min-h-[56px] transition-colors ${
              isActive ? "text-blue-600" : "text-[#6B7280] active:text-blue-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <MessageSquare className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : ""}`} />
              <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400 }}>Ask</span>
            </>
          )}
        </NavLink>
      </nav>

      <Toaster position="top-center" />
    </div>
  );
}
