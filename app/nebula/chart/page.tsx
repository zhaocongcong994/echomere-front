"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

/** 兼容旧链接：完整八字命盘已归入“我的命盘”。 */
export default function LegacyNebulaChartRedirect() {
  const router = useRouter();

  useEffect(() => {
    apiFetch("/profile")
      .then((response) => response.json())
      .then((data) => {
        const profileId = data?.primaryProfile?.id;
        router.replace(profileId ? `/profiles/${profileId}` : "/profiles");
      })
      .catch(() => router.replace("/profiles"));
  }, [router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3 bg-stone-50">
      <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      <p className="text-sm text-stone-500">正在前往我的命盘…</p>
    </div>
  );
}
