"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "seller" | "buyer" | "both";

export interface InquiryData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  role?: UserRole;
  category?: string;
}

export interface RegistrationData {
  name: string;
  company: string;
  phone: string;
  email: string;
  category: string;
  role: UserRole;
}

interface AppContextType {
  isRegisterModalOpen: boolean;
  registerModalRole: UserRole | null;
  openRegisterModal: (role?: UserRole) => void;
  closeRegisterModal: () => void;
  /** Opens registration modal pre-selected as seller */
  openSellerModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inquiries: InquiryData[];
  addInquiry: (inquiry: InquiryData) => void;
  registrations: RegistrationData[];
  addRegistration: (data: RegistrationData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Delegate modal control to AuthContext
  const { openAuthModal } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);

  // Bridge: always open LOGIN step first; after OTP, if is_registered=false the modal
  // automatically advances to the registration form (with role pre-filled).
  const openRegisterModal = (role?: UserRole) => {
    openAuthModal("login", role as "seller" | "buyer" | "both" | undefined);
  };

  const closeRegisterModal = () => {
    // No-op: AuthContext manages its own close
  };

  const addInquiry = (inquiry: InquiryData) => {
    setInquiries((prev) => [...prev, inquiry]);
  };

  const addRegistration = (data: RegistrationData) => {
    setRegistrations((prev) => [...prev, data]);
  };

  return (
    <AppContext.Provider
      value={{
        // These are no longer used but kept for API compatibility
        isRegisterModalOpen: false,
        registerModalRole: null,
        openRegisterModal,
        closeRegisterModal,
        openSellerModal: () => openRegisterModal("seller"),
        searchQuery,
        setSearchQuery,
        inquiries,
        addInquiry,
        registrations,
        addRegistration,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
