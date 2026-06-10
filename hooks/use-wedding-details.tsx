import React, { createContext, useContext, useState } from 'react';

export type EventType = 'marriage' | 'engagement';

export interface EventDetails {
  date: string; // ISO string format for easy transfer/storage
  venue: string;
  time: string;
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
}

const WeddingDetailsContext = createContext<WeddingDetailsContextType | null>(null);

export function WeddingDetailsProvider({ children }: { children: React.ReactNode }) {
  const [activeEvent, setActiveEvent] = useState<EventType>('marriage');
  const [coupleNames, setCoupleNames] = useState('Amar & Syamimie');
  
  const [marriage, setMarriage] = useState<EventDetails>({
    date: '2027-08-08T11:00:00.000Z',
    venue: "De'Emerald Garden, Banting",
    time: "11:00 AM",
  });

  const [engagement, setEngagement] = useState<EventDetails>({
    date: '2026-12-12T15:00:00.000Z',
    venue: "Syamimie's Residence, Shah Alam",
    time: "3:00 PM",
  });

  const updateMarriage = (details: Partial<EventDetails>) => {
    setMarriage(prev => ({ ...prev, ...details }));
  };

  const updateEngagement = (details: Partial<EventDetails>) => {
    setEngagement(prev => ({ ...prev, ...details }));
  };

  const updateCoupleNames = (names: string) => {
    setCoupleNames(names);
  };

  return (
    <WeddingDetailsContext.Provider value={{
      activeEvent,
      setActiveEvent,
      marriage,
      updateMarriage,
      engagement,
      updateEngagement,
      coupleNames,
      updateCoupleNames,
    }}>
      {children}
    </WeddingDetailsContext.Provider>
  );
}

export function useWeddingDetails() {
  const context = useContext(WeddingDetailsContext);
  if (!context) {
    throw new Error('useWeddingDetails must be used within a WeddingDetailsProvider');
  }
  return context;
}
