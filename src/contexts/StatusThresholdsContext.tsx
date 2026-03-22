import { createContext, useContext, useState, ReactNode } from "react";

// ─── Condition-based Rules Engine ───

export type RuleParameter = "totalWins" | "winAuctionCount" | "maxBid";
export type RuleOperator = ">" | ">=" | "<" | "<=" | "=";
export type ConditionConnector = "OR" | "AND";

export interface RuleCondition {
  id: string;
  parameter: RuleParameter;
  operator: RuleOperator;
  value: number;
}

export interface StatusRule {
  key: string;
  label: string;
  conditions: RuleCondition[];
  connector: ConditionConnector; // how conditions within this status are combined
}

export const PARAMETER_LABELS: Record<RuleParameter, string> = {
  totalWins: "סך זכיות ($)",
  winAuctionCount: "מס׳ מכירות שזכה בהן",
  maxBid: "ביד מקסימלי ($)",
};

export const OPERATOR_LABELS: Record<RuleOperator, string> = {
  ">": ">",
  ">=": "≥",
  "<": "<",
  "<=": "≤",
  "=": "=",
};

// ─── Defaults ───

const uid = () => Math.random().toString(36).slice(2, 8);

const DEFAULT_RULES: StatusRule[] = [
  {
    key: "vip",
    label: "VIP",
    connector: "OR",
    conditions: [
      { id: uid(), parameter: "totalWins", operator: ">=", value: 50000 },
      { id: uid(), parameter: "winAuctionCount", operator: ">=", value: 10 },
    ],
  },
  {
    key: "active",
    label: "פעיל",
    connector: "OR",
    conditions: [
      { id: uid(), parameter: "totalWins", operator: ">=", value: 10000 },
      { id: uid(), parameter: "winAuctionCount", operator: ">=", value: 5 },
    ],
  },
  {
    key: "beginner",
    label: "מתחיל",
    connector: "OR",
    conditions: [
      { id: uid(), parameter: "winAuctionCount", operator: ">=", value: 1 },
    ],
  },
];

// ─── Context ───

interface StatusThresholdsContextType {
  rules: StatusRule[];
  setRules: (r: StatusRule[]) => void;
}

const StatusThresholdsContext = createContext<StatusThresholdsContextType>({
  rules: DEFAULT_RULES,
  setRules: () => {},
});

export function StatusThresholdsProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<StatusRule[]>(DEFAULT_RULES);
  return (
    <StatusThresholdsContext.Provider value={{ rules, setRules }}>
      {children}
    </StatusThresholdsContext.Provider>
  );
}

export function useStatusThresholds() {
  return useContext(StatusThresholdsContext);
}

// ─── Customer data shape expected by the engine ───

export interface CustomerMetrics {
  totalWins: number;       // lifetime sum of win values ($)
  winAuctionCount: number; // unique auctions where customer won
  maxBid: number;          // highest single bid ever placed
}

// ─── Status output ───

export interface CustomerStatus {
  label: string;
  bg: string;
  color: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  vip: { bg: "hsl(var(--accent) / 0.12)", color: "hsl(var(--gold-dark))" },
  active: { bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" },
  beginner: { bg: "hsl(220, 40%, 92%)", color: "hsl(220, 45%, 40%)" },
};

const NEW_STATUS: CustomerStatus = { label: "חדש", bg: "hsl(200, 40%, 92%)", color: "hsl(200, 45%, 35%)" };

function evalCondition(c: RuleCondition, metrics: CustomerMetrics): boolean {
  const val = metrics[c.parameter];
  switch (c.operator) {
    case ">": return val > c.value;
    case ">=": return val >= c.value;
    case "<": return val < c.value;
    case "<=": return val <= c.value;
    case "=": return val === c.value;
    default: return false;
  }
}

/** Check rules top-to-bottom, assign first match */
export function getCustomerStatus(
  metrics: CustomerMetrics,
  rules: StatusRule[]
): CustomerStatus {
  for (const rule of rules) {
    if (rule.conditions.length === 0) continue;
    const results = rule.conditions.map(c => evalCondition(c, metrics));
    const match = rule.connector === "OR"
      ? results.some(Boolean)
      : results.every(Boolean);
    if (match) {
      const style = STATUS_STYLES[rule.key] || STATUS_STYLES.beginner;
      return { label: rule.label, ...style };
    }
  }
  return NEW_STATUS;
}

// ─── Legacy adapter (keeps old call-sites working during migration) ───

/** @deprecated Use getCustomerStatus(metrics, rules) instead */
export function getCustomerStatusLegacy(
  totalSpend: number,
  auctionCount: number,
  rules: StatusRule[]
): CustomerStatus {
  return getCustomerStatus(
    { totalWins: totalSpend, winAuctionCount: auctionCount, maxBid: 0 },
    rules
  );
}
