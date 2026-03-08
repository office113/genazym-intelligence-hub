import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  History,
  Gavel,
  Target,
  Users,
  UserCheck,
  UserPlus,
  BookOpen,
  Activity,
} from "lucide-react";

const navItems = [
  { label: "מכירות עבר", path: "/past-sales", icon: History },
  { label: "מכירה נוכחית", path: "/current-sale", icon: Gavel },
  { label: "טרגוט", path: "/targeting", icon: Target },
  { label: "לקוחות", path: "/customers", icon: Users },
  { label: "מפקידים", path: "/consignors", icon: UserCheck },
  { label: "נרשמים", path: "/registrants", icon: UserPlus },
  { label: "ספרים", path: "/books", icon: BookOpen },
  { label: "פעילות", path: "/activity", icon: Activity },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-screen w-56 flex-shrink-0 z-30 flex flex-col"
        style={{ background: "hsl(var(--sidebar-background))" }}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b"
          style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <h1 className="text-lg font-bold tracking-wide font-display"
            style={{ color: "hsl(var(--sidebar-primary))" }}>
            GENAZYM
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-item relative ${isActive ? "sidebar-item-active" : ""}`}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t text-xs"
          style={{
            borderColor: "hsl(var(--sidebar-border))",
            color: "hsl(var(--sidebar-muted))"
          }}>
          <div>Genazym Intelligence</div>
          <div className="mt-0.5 opacity-60">v2.0</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-56 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
