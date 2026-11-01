"use client";
import { useTranslation } from "@/i18n/useTranslation";
import Link from "next/link";
import { BookOpenText, LayoutDashboard } from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();

  // If a user goes to root and they already have a session, maybe we don't auto redirect yet 
  // so they can switch roles, or maybe we do. Let's keep it simple: manual click always.

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-gray-100 p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="flex justify-end mb-2">
          <LanguageToggle />
        </div>
        <h1 className="text-3xl font-bold text-center text-primary mb-2">{t("home.appTitle")}</h1>
        <p className="text-gray-500 text-center mb-8">{t("home.selectRole")}</p>
        
        <div className="space-y-4">
          <Link 
            href="/login/student"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <div className="bg-primary/10 p-3 rounded-lg text-primary group-hover:scale-110 transition-transform">
              <BookOpenText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{t("home.studentRole")}</h2>
              <p className="text-sm text-gray-500">{t("home.studentDesc")}</p>
            </div>
          </Link>
          
          <Link 
            href="/login/teacher"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <div className="bg-primary/10 p-3 rounded-lg text-primary group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{t("home.teacherRole")}</h2>
              <p className="text-sm text-gray-500">{t("home.teacherDesc")}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
