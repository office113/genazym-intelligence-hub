import { createContext, useContext, useState, ReactNode } from "react";

export interface StatusThresholds {
  vipSpend: number;
  vipAuctions: number;
  activeMin: number;
  activeMax: number;
  beginnerMin: number;
  beginnerMax: number;
}

const DEFAULT_THRESHOLDS: StatusThresholds = {
  vipSpend: 50000,
  vipAuctions: 5,
  activeMin: 3,
  activeMax: 999,
  beginnerMin: 1,
  beginnerMax: 2,
};

interface StatusThresholdsContextType {
  thresholds: StatusThresholds;
  setThresholds: (t: StatusThresholds) => void;
}

const StatusThresholdsContext = createContext<StatusThresholdsContextType>({
  thresholds: DEFAULT_THRESHOLDS,
  setThresholds: () => {},
});

export function StatusThresholdsProvider({ children }: { children: ReactNode }) {
  const [thresholds, setThresholds] = useState<StatusThresholds>(DEFAULT_THRESHOLDS);
  return (
    <StatusThresholdsContext.Provider value={{ thresholds, setThresholds }}>
      {children}
    </StatusThresholdsContext.Provider>
  );
}

export function useStatusThresholds() {
  return useContext(StatusThresholdsContext);
}

export interface CustomerStatus {
  label: string;
  bg: string;
  color: string;
}

export function getCustomerStatus(
  totalSpend: number,
  auctionCount: number,
  thresholds: StatusThresholds
): CustomerStatus {
  if (totalSpend >= thresholds.vipSpend || auctionCount >= thresholds.vipAuctions)
    return { label: "VIP", bg: "hsl(var(--accent) / 0.12)", color: "hsl(var(--gold-dark))" };
  if (auctionCount >= thresholds.activeMin)
    return { label: "פעיל", bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" };
  if (auctionCount >= thresholds.beginnerMin)
    return { label: "מתחיל", bg: "hsl(220, 40%, 92%)", color: "hsl(220, 45%, 40%)" };
  return { label: "חדש", bg: "hsl(200, 40%, 92%)", color: "hsl(200, 45%, 35%)" };
}
