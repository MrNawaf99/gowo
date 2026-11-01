"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpenText, User, Loader2 } from "lucide-react";
import { AppLayout, NavItem } from "./AppLayout";
import { useTranslation } from "@/i18n/useTranslation";
import { getStudentId } from "@/lib/config/auth";

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const studentId = getStudentId();
    if (!studentId) {
      router.replace("/login/student");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const studentNavItems = useMemo<NavItem[]>(() => [
    { name: t("nav.teachers"), href: "/teachers", icon: Users },
    { name: t("nav.grammar"), href: "/grammar", icon: BookOpenText },
    { name: t("nav.profile"), href: "/profile", icon: User },
  ], [t]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-gray-500 font-medium">{t("state.loading")}</p>
      </div>
    );
  }

  return (
    <AppLayout navItems={studentNavItems} title={t("home.appTitle")}>
      {children}
    </AppLayout>
  );
}
