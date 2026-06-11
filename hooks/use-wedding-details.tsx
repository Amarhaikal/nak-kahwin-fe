import React, { createContext, useContext, useState } from "react";

export type EventType = "marriage" | "engagement";

export interface EventDetails {
  date: string; // ISO string format for easy transfer/storage
  venue: string;
  time: string;
}

export interface BudgetItem {
  allocated: number;
  spent: number;
}

export interface BudgetDetails {
  total: number;
  place: BudgetItem;
  catering: BudgetItem;
  clothes: BudgetItem;
  ring: BudgetItem;
  others: BudgetItem;
}

export interface SavingEntry {
  id: string;
  month: string;
  amount: number;
  by: "him" | "her"; // 'him' = Groom (user, editable), 'her' = Bride (partner, read-only)
}

interface WeddingDetailsContextType {
  activeEvent: EventType;
  setActiveEvent: (type: EventType) => void;
  marriage: EventDetails;
  updateMarriage: (details: Partial<EventDetails>) => void;
  engagement: EventDetails;
  updateEngagement: (details: Partial<EventDetails>) => void;
  coupleNames: string;
  updateCoupleNames: (names: string) => void;
  budget: BudgetDetails;
  updateBudgetCategory: (
    category: keyof Omit<BudgetDetails, "total">,
    details: Partial<BudgetItem>,
  ) => void;
  updateTotalBudgetLimit: (total: number) => void;
  savings: SavingEntry[];
  addSaving: (month: string, amount: number) => void;
  deleteSaving: (id: string) => void;
}

const WeddingDetailsContext = createContext<WeddingDetailsContextType | null>(
  null,
);

export function WeddingDetailsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeEvent, setActiveEvent] = useState<EventType>("marriage");
  const [coupleNames, setCoupleNames] = useState("Amar & Syamimie");

  const [marriage, setMarriage] = useState<EventDetails>({
    date: "2027-08-08T11:00:00.000Z",
    venue: "De'Emerald Garden, Banting",
    time: "11:00 AM",
  });

  const [engagement, setEngagement] = useState<EventDetails>({
    date: "2026-12-12T15:00:00.000Z",
    venue: "Syamimie's House",
    time: "3:00 PM",
  });

  const [marriageBudget, setMarriageBudget] = useState<BudgetDetails>({
    total: 20000,
    place: { allocated: 6500, spent: 0 },
    catering: { allocated: 6000, spent: 0 },
    clothes: { allocated: 1500, spent: 0 },
    ring: { allocated: 1500, spent: 0 },
    others: { allocated: 3500, spent: 0 },
  });

  const [engagementBudget, setEngagementBudget] = useState<BudgetDetails>({
    total: 5000,
    place: { allocated: 2000, spent: 0 },
    catering: { allocated: 1000, spent: 0 },
    clothes: { allocated: 0, spent: 0 },
    ring: { allocated: 600, spent: 0 },
    others: { allocated: 1400, spent: 0 },
  });

  const budget = activeEvent === "marriage" ? marriageBudget : engagementBudget;

  const [savings, setSavings] = useState<SavingEntry[]>([
    { id: "1", month: "June 2026", amount: 1200, by: "him" },
    { id: "2", month: "June 2026", amount: 500, by: "her" },
    { id: "3", month: "May 2026", amount: 800, by: "him" },
    { id: "4", month: "May 2026", amount: 3000, by: "her" },
    { id: "5", month: "April 2026", amount: 1000, by: "him" },
    { id: "6", month: "February 2026", amount: 1000, by: "him" },
    { id: "7", month: "January 2026", amount: 1000, by: "him" },
    { id: "8", month: "December 2025", amount: 1000, by: "him" },
    { id: "9", month: "November 2025", amount: 1000, by: "him" },
    { id: "10", month: "October 2025", amount: 1000, by: "him" },
    { id: "11", month: "September 2025", amount: 1000, by: "him" },
    { id: "12", month: "August 2025", amount: 1000, by: "him" },
  ]);

  const updateMarriage = (details: Partial<EventDetails>) => {
    setMarriage((prev) => ({ ...prev, ...details }));
  };

  const updateEngagement = (details: Partial<EventDetails>) => {
    setEngagement((prev) => ({ ...prev, ...details }));
  };

  const updateCoupleNames = (names: string) => {
    setCoupleNames(names);
  };

  const updateBudgetCategory = (
    category: keyof Omit<BudgetDetails, "total">,
    details: Partial<BudgetItem>,
  ) => {
    const setBudget =
      activeEvent === "marriage" ? setMarriageBudget : setEngagementBudget;
    setBudget((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...details,
      },
    }));
  };

  const updateTotalBudgetLimit = (total: number) => {
    const setBudget =
      activeEvent === "marriage" ? setMarriageBudget : setEngagementBudget;
    setBudget((prev) => ({
      ...prev,
      total,
    }));
  };

  const addSaving = (month: string, amount: number) => {
    const newSaving: SavingEntry = {
      id: Date.now().toString(),
      month,
      amount,
      by: "him", // Default to Groom (him) bcs the logged in user is the groom
    };
    setSavings((prev) => [newSaving, ...prev]);
  };

  const deleteSaving = (id: string) => {
    setSavings((prev) => prev.filter((saving) => saving.id !== id));
  };

  return (
    <WeddingDetailsContext.Provider
      value={{
        activeEvent,
        setActiveEvent,
        marriage,
        updateMarriage,
        engagement,
        updateEngagement,
        coupleNames,
        updateCoupleNames,
        budget,
        updateBudgetCategory,
        updateTotalBudgetLimit,
        savings,
        addSaving,
        deleteSaving,
      }}
    >
      {children}
    </WeddingDetailsContext.Provider>
  );
}

export function useWeddingDetails() {
  const context = useContext(WeddingDetailsContext);
  if (!context) {
    throw new Error(
      "useWeddingDetails must be used within a WeddingDetailsProvider",
    );
  }
  return context;
}
