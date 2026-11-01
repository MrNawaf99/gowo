"use client";
import { useTranslation } from "@/i18n/useTranslation";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, LogIn, Lock, User, ShieldAlert } from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

export default function TeacherLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/auth/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || t("login.errInvalidCredentials"));
        setIsLoggingIn(false);
        return;
      }

      // Success!
      localStorage.setItem("teacherId", data.teacher.id);
      localStorage.setItem("teacherName", data.teacher.name);
      localStorage.setItem("teacherUsername", data.teacher.username);
      router.push("/teacher/dashboard");
    } catch (err) {
      console.error("Teacher login error:", err);
      setError(t("login.errLoginFailed"));
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="bg-gray-100 p-8 rounded-3xl shadow-sm border border-gray-200 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("nav.back")}
          </Link>
          <LanguageToggle />
        </div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("login.teacherLogin")}</h1>
          <p className="text-sm text-gray-500">{t("login.signInToManage")}</p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm mb-6 font-medium flex items-center gap-2.5 border border-red-200">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("login.username")}</label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl ps-10 pe-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                placeholder={t("login.enterUsername")}
                required
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("login.password")}</label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl ps-10 pe-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                placeholder={t("login.enterPassword")}
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isLoggingIn || !username.trim() || !password.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 flex justify-center items-center gap-2 mt-4 shadow-sm"
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : (t("login.signIn") || "Login")}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            {t("login.invitationOnlyNotice") || "GoWord Academy is an invitation-only learning system. Teacher accounts are provisioned exclusively by academy administration."}
          </p>
        </div>
      </div>
    </div>
  );
}
