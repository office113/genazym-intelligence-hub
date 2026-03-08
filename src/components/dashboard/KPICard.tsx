import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  subtitle?: string;
  onClick?: () => void;
}

export default function KPICard({ label, value, trend, trendValue, subtitle, onClick }: KPICardProps) {
  return (
    <div className="kpi-card" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <div className="kpi-value">{value}</div>
          <div className="kpi-label">{label}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-1 opacity-70">{subtitle}</div>
          )}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-1 ${
            trend === "up" ? "kpi-trend-up" : trend === "down" ? "kpi-trend-down" : "text-muted-foreground text-xs"
          }`}>
            {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
            {trend === "neutral" && <Minus className="w-3.5 h-3.5" />}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
