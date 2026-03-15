import { useState } from "react";

type Brand = "genazym" | "zaidy";

interface ChurnCustomer {
  name: string;
  email: string;
  bidsInPrev: number;
  involvementType: "מוקדם" | "לייב" | "גם וגם";
  lotsInvolved: number;
  maxBidAmount: string;
  wonInPrev: boolean;
  firstBidEver: string;
}

interface ChurnBarData {
  sale: string;
  saleNumber: number;
  notReturned: number;
  prevSale: string;
  prevInvolved: number;
  customers: ChurnCustomer[];
}

interface InvolvedCustomer {
  name: string;
  email: string;
  status: "מעורב" | "זוכה";
  bids: number;
  involvementType: "מוקדם" | "לייב" | "גם וגם";
  lotsInvolved: number;
  maxBidAmount: string;
  firstBidEver: string;
  lotsWon?: number;
  totalWinAmount?: string;
}

interface InvolvedBarData {
  sale: string;
  saleNumber: number;
  involved: number;
  winners: number;
  customers: InvolvedCustomer[];
}

export type {
  Brand,
  ChurnCustomer,
  ChurnBarData,
  InvolvedCustomer,
  InvolvedBarData,
};

export function usePastSales() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [brand, setBrand] = useState<Brand>("genazym");
  const [churnDrawerOpen, setChurnDrawerOpen] = useState(false);
  const [churnDrawerData, setChurnDrawerData] = useState<ChurnBarData | null>(null);
  const [involvedDrawerOpen, setInvolvedDrawerOpen] = useState(false);
  const [involvedDrawerData, setInvolvedDrawerData] = useState<InvolvedBarData | null>(null);
  const [involvedDrawerType, setInvolvedDrawerType] = useState<"involved" | "winners">("involved");
  const [hoveredChurnBar, setHoveredChurnBar] = useState<number | null>(null);
  const [churnSearch, setChurnSearch] = useState("");
  const [churnFilter, setChurnFilter] = useState<string>("all");
  const [involvedSearch, setInvolvedSearch] = useState("");
  const [involvedFilter, setInvolvedFilter] = useState<string>("all");

  const brandLabel = brand === "genazym" ? "גנזים" : "זיידי";

  const openSaleDrawer = (sale: any) => {
    setDrawerData(sale);
    setDrawerOpen(true);
  };

  const handleChurnBarClick = (data: ChurnBarData) => {
    setChurnDrawerData(data);
    setChurnDrawerOpen(true);
  };

  const handleInvolvedBarClick = (data: InvolvedBarData) => {
    setInvolvedDrawerData(data);
    setInvolvedDrawerType("involved");
    setInvolvedDrawerOpen(true);
  };

  const closeChurnDrawer = () => {
    setChurnDrawerOpen(false);
    setChurnSearch("");
    setChurnFilter("all");
  };

  const closeInvolvedDrawer = () => {
    setInvolvedDrawerOpen(false);
    setInvolvedSearch("");
    setInvolvedFilter("all");
  };

  return {
    activeTab,
    setActiveTab,
    brand,
    setBrand,
    brandLabel,
    drawerOpen,
    setDrawerOpen,
    drawerData,
    openSaleDrawer,
    churnDrawerOpen,
    churnDrawerData,
    handleChurnBarClick,
    closeChurnDrawer,
    churnSearch,
    setChurnSearch,
    churnFilter,
    setChurnFilter,
    involvedDrawerOpen,
    involvedDrawerData,
    involvedDrawerType,
    setInvolvedDrawerType,
    handleInvolvedBarClick,
    closeInvolvedDrawer,
    hoveredChurnBar,
    setHoveredChurnBar,
    involvedSearch,
    setInvolvedSearch,
    involvedFilter,
    setInvolvedFilter,
  };
}
