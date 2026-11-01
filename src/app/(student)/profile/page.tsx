"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { User, ShieldCheck, Hash, AtSign, LogOut } from "lucide-react";
import { getStudentId, getStudentName } from "@/lib/config/auth";

export default function StudentProfilePage() {
  const { t } = useTranslation();
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentUsername, setStudentUsername] = useState("");

  useEffect(() => {
    setStudentName(getStudentName() || "Student");
    setStudentId(getStudentId() || "");
    if (typeof window !== "undefined") {
      setStudentUsername(localStorage.getItem("studentUsername") || "");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/student/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("studentId");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentUsername");
    localStorage.removeItem("studentDbId");
    window.location.href = "/";
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.profile")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("student.profileSettings")}</p>
      </div>

      <div className="bg-gray-100 rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{studentName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t("student.activeStudent") || "Active Student"}
              </span>
              <span className="text-xs text-gray-400">• GoWord Academy</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              <Hash className="w-3.5 h-3.5" />
              {t("student.studentId") || "Student ID"}
            </div>
            <p className="text-base font-bold text-gray-900 font-mono">{studentId || "--"}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              <AtSign className="w-3.5 h-3.5" />
              {t("login.username") || "Username"}
            </div>
            <p className="text-base font-bold text-gray-900">@{studentUsername || studentId}</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
