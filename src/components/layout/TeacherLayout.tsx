"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, ClipboardList, User, Loader2 } from "lucide-react";
import { AppLayout, NavItem } from "./AppLayout";
import { useTranslation } from "@/i18n/useTranslation";
import { getTeacherId } from "@/lib/config/auth";

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      router.replace("/login/teacher");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const teacherNavItems = useMemo<NavItem[]>(() => [
    { name: t("nav.dashboard"), href: "/teacher/dashboard", icon: LayoutDashboard },
    { name: t("nav.lessons"), href: "/teacher/lessons", icon: BookOpen },
    { name: t("nav.results"), href: "/teacher/results", icon: ClipboardList },
    { name: t("nav.profile"), href: "/teacher/profile", icon: User },
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
    <AppLayout navItems={teacherNavItems} title={t("nav.teacherPortal")}>
      {children}
    </AppLayout>
  );
}
