import { createContext, useContext, useState, ReactNode } from "react";

interface CustomerCardContextType {
  customerEmail: string | null;
  openCustomerCard: (email: string) => void;
  closeCustomerCard: () => void;
}

const CustomerCardContext = createContext<CustomerCardContextType>({
  customerEmail: null,
  openCustomerCard: () => {},
  closeCustomerCard: () => {},
});

export function CustomerCardProvider({ children }: { children: ReactNode }) {
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  const openCustomerCard = (email: string) => {
    if (email && email !== "floor_crowd@aa.co") {
      setCustomerEmail(email);
    }
  };

  const closeCustomerCard = () => setCustomerEmail(null);

  return (
    <CustomerCardContext.Provider value={{ customerEmail, openCustomerCard, closeCustomerCard }}>
      {children}
    </CustomerCardContext.Provider>
  );
}

export const useCustomerCard = () => useContext(CustomerCardContext);
