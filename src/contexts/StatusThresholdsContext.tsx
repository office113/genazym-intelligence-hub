import { createContext, useContext, useState, ReactNode } from "react";

export interface StatusThresholds {
  vipSpend: number;
  vipAuctions: number;
  activeSpend: number;
  activeAuctions: number;
  beginnerSpend: number;
  beginnerAuctions: number;
}

const DEFAULT_THRESHOLDS: StatusThresholds = {
  vipSpend: 50000,
  vipAuctions: 10,
  activeSpend: 10000,
  activeAuctions: 5,
  beginnerSpend: 0,
  beginnerAuctions: 1,
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

/** Check thresholds in descending order: VIP → Active → Beginner → New */
export function getCustomerStatus(
  totalSpend: number,
  auctionCount: number,
  thresholds: StatusThresholds
): CustomerStatus {
  // VIP: highest tier
  if (totalSpend >= thresholds.vipSpend || auctionCount >= thresholds.vipAuctions)
    return { label: "VIP", bg: "hsl(var(--accent) / 0.12)", color: "hsl(var(--gold-dark))" };
  // Active: mid tier
  if (totalSpend >= thresholds.activeSpend || auctionCount >= thresholds.activeAuctions)
    return { label: "פעיל", bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" };
  // Beginner: entry tier (any participation)
  if (totalSpend > thresholds.beginnerSpend || auctionCount >= thresholds.beginnerAuctions)
    return { label: "מתחיל", bg: "hsl(220, 40%, 92%)", color: "hsl(220, 45%, 40%)" };
  // New: no participation
  return { label: "חדש", bg: "hsl(200, 40%, 92%)", color: "hsl(200, 45%, 35%)" };
}
