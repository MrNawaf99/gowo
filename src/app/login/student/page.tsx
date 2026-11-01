"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, GraduationCap, Lock, User, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

export default function StudentLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    setError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || t("login.errInvalidCredentials"));
        setIsLoggingIn(false);
        return;
      }

      // Store authenticated session identifiers
      const student = data.student;
      localStorage.setItem("studentId", student.studentId || student.id);
      localStorage.setItem("studentName", student.name);
      localStorage.setItem("studentUsername", student.username);
      localStorage.setItem("studentDbId", student.id);

      router.push("/teachers");
    } catch (err) {
      console.error("Student login failed:", err);
      setError(t("login.errLoginFailed"));
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="bg-gray-100 p-8 rounded-3xl shadow-sm border border-gray-200 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("nav.back")}
          </Link>
          <LanguageToggle />
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t("login.studentLogin") || t("login.studentAccess")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("login.studentSignInSubtitle") || t("login.enterNameToContinue")}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm mb-6 font-medium flex items-center gap-2.5 border border-red-200">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("login.studentIdentifier")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl ps-10 pe-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                placeholder={t("login.egJohnDoe")}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("login.password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl ps-10 pe-10 py-3 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                placeholder={t("login.enterPassword")}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || !identifier.trim() || !password.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-60 flex justify-center items-center gap-2 mt-2 shadow-sm"
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : (t("login.studentLogin") || t("common.continue"))}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            {t("login.studentInvitationNotice")}
          </p>
        </div>
      </div>
    </div>
  );
}
