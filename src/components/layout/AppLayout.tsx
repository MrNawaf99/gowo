"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LucideIcon, LogOut, Globe } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "./LanguageProvider";
import { useTranslation } from "@/i18n/useTranslation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface AppLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}

export function AppLayout({ children, navItems, title }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await Promise.allSettled([
        fetch("/api/auth/student/logout", { method: "POST" }),
        fetch("/api/auth/teacher/logout", { method: "POST" }),
      ]);
    } catch {}
    localStorage.removeItem("teacherId");
    localStorage.removeItem("teacherName");
    localStorage.removeItem("teacherUsername");
    localStorage.removeItem("studentId");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentUsername");
    localStorage.removeItem("studentDbId");
    window.location.href = "/";
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-gray-100 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-primary tracking-tight">{title}</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-gray-600 hover:text-primary hover:bg-gray-200"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-gray-500")} />
                  {item.name}
                </Link>
              );
            })}
            
            <button 
              onClick={() => setLocale(locale === "en" ? "ar" : "en")} 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-200 transition-all border border-transparent cursor-pointer"
            >
              <Globe className="w-4 h-4" /> {locale === "en" ? "العربية" : "English"}
            </button>

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all ms-2 border border-red-100 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> {t("nav.logout")}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button onClick={toggleMenu} className="md:hidden p-2 text-gray-600 focus:outline-none bg-gray-100 rounded-lg active:bg-gray-200">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={closeMenu}>
          <div 
            className="absolute top-16 inset-x-0 bg-gray-100 shadow-xl border-b border-gray-200 p-4 space-y-2"
            onClick={e => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all",
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-700 bg-gray-50 hover:bg-gray-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
                  {item.name}
                </Link>
              );
            })}

            <button 
              onClick={() => {
                setLocale(locale === "en" ? "ar" : "en");
                closeMenu();
              }} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all text-gray-700 bg-gray-50 hover:bg-gray-200 w-full mt-2"
            >
              <Globe className="w-5 h-5 text-gray-500" /> {locale === "en" ? "العربية" : "English"}
            </button>

            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all text-red-600 bg-red-50 hover:bg-red-100 w-full mt-2">
              <LogOut className="w-5 h-5 text-red-600" /> {t("nav.logout")}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
