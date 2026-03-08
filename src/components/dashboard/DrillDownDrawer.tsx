import { X } from "lucide-react";
import { ReactNode } from "react";

interface DrillDownDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export default function DrillDownDrawer({ open, onClose, title, children, width = "w-[520px]" }: DrillDownDrawerProps) {
  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div
        className={`fixed top-0 left-0 h-screen ${width} bg-card z-50 overflow-y-auto animate-slide-in border-r border-border`}
        style={{ boxShadow: "var(--shadow-drawer)" }}
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}
