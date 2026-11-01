"use client";
import { useTranslation } from "@/i18n/useTranslation";

import { useEffect, useState } from "react";
import { getTeacherId, getStudentId, getStudentName  } from "@/lib/config/auth";
import { getTeacherProfile, TeacherProfile } from "@/lib/services/teacherService";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getTeacherProfile(getTeacherId());
      setProfile(data);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("nav.profile")}</h1>
      <div className="bg-gray-100 rounded-xl border border-gray-200 shadow-sm p-6 max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("common.name")}</label>
            <input type="text" disabled className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-900 font-medium" value={profile?.name || t("state.loading")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("common.username")}</label>
            <input type="text" disabled className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-900 font-medium" value={profile?.username || t("state.loading")} />
          </div>
        </div>
      </div>
    </div>
  );
}
