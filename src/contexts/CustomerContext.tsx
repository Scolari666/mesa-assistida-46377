import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { unmaskPhone } from "@/lib/format";

export interface IdentifiedCustomer {
  phone: string;
  fullName: string;
}

interface CustomerContextType {
  customer: IdentifiedCustomer | null;
  loading: boolean;
  lookupByPhone: (phone: string) => Promise<IdentifiedCustomer | null>;
  identify: (customer: IdentifiedCustomer) => void;
  clearCustomer: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEY = "porks_customer";

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<IdentifiedCustomer | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as IdentifiedCustomer) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (customer) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [customer]);

  const lookupByPhone = async (phone: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("find_customer_by_phone", {
        p_phone: unmaskPhone(phone),
      });
      if (error || !data) return null;
      const record = data as { phone: string; full_name: string };
      return { phone: record.phone, fullName: record.full_name };
    } finally {
      setLoading(false);
    }
  };

  const identify = (next: IdentifiedCustomer) => setCustomer(next);
  const clearCustomer = () => setCustomer(null);

  return (
    <CustomerContext.Provider value={{ customer, loading, lookupByPhone, identify, clearCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};
