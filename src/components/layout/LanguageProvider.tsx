"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Locale = "en" | "ar";

interface LanguageContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
  children, 
  initialLocale 
}: { 
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Update local state
    setLocaleState(newLocale);
    
    // Force Next.js to re-fetch Server Components and update layout.tsx
    router.refresh();
  };

  // Sync state if initialLocale changes due to SSR navigation
  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  // Sync document direction immediately on client side for snappier feedback
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
