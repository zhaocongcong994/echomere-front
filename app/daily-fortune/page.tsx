"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RotateCw, Trash2, FileText, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BottomDock, ProductHeader } from "@/components/echomere-chrome";

interface Profile {
  id: string;
  name: string | null;
  gender: string;
  birthDateTime: string;
  isPrimary: boolean;
  type: string;
}

interface Report {
  id: string;
  profileId: string;
  profileName: string;
  title: string;
  summary: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

export default function DeepReportPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingProfileId, setGeneratingProfileId] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [pendingRegenerate, setPendingRegenerate] = useState<Report | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  async function fetchData() {
    try {
      const [reportsRes, profilesRes] = await Promise.all([
        apiFetch("/reports"),
        apiFetch("/profiles"),
      ]);
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (profilesRes.ok) setProfiles(await profilesRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = window.setInterval(fetchData, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const generateReport = async (profileId: string) => {
    setGeneratingProfileId(profileId);
    try {
      const res = await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify({ profileId }),
      });
      if (res.ok) {
        setShowCreateDialog(false);
        await fetchData();
      }
    } finally {
      setGeneratingProfileId(null);
    }
  };

  const deleteReport = async (id: string) => {
    setDeletingReportId(id);
    try {
      const res = await apiFetch(`/reports/${id}`, { method: "DELETE" });
      if (res.ok) await fetchData();
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleCardClick = (report: Report) => {
    if (report.status === "pending") {
      window.alert("报告正在生成中，请生成后查看。");
      return;
    }
    if (report.status === "failed") {
      window.alert("报告生成失败，请尝试重新生成。");
      return;
    }
    router.push(`/daily-fortune/${report.id}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen product-page deep-report-page bg-stone-50">
      <ProductHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium">深度报告</h1>
            <p className="text-sm text-stone-500">大运流年与五行分析，一览命运轨迹</p>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" /> 新增报告
          </Button>
        </div>

        {reports.length === 0 ? (
          <div className="space-y-6">
            <p className="text-stone-500">当前还没有生成报告，请选择一个档案开始生成。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-lg font-medium">{p.name || "未命名"}</h2>
                    <p className="text-xs text-stone-400 mt-1">
                      {p.type === "self" ? "自己" : "他人"} · {p.gender === "male" ? "男" : p.gender === "female" ? "女" : "其他"}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(p.birthDateTime).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    disabled={generatingProfileId === p.id}
                    onClick={() => generateReport(p.id)}
                  >
                    {generatingProfileId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    确认生成报告
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm relative group"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => handleCardClick(report)}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">{report.profileName || "未命名"}</h2>
                    {report.status === "pending" && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        生成中
                      </span>
                    )}
                    {report.status === "failed" && (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        失败
                      </span>
                    )}
                    {report.status === "completed" && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        已完成
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 mt-2 line-clamp-2">
                    {report.summary || "八字深度报告"}
                  </p>
                  <p className="text-xs text-stone-400 mt-3">
                    生成时间：{new Date(report.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={generatingProfileId === report.profileId}
                    onClick={() => setPendingRegenerate(report)}
                  >
                    <RotateCw className="w-4 h-4" /> 重新生成
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="删除报告"
                    disabled={deletingReportId === report.id}
                    onClick={() => deleteReport(report.id)}
                  >
                    {deletingReportId === report.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-stone-400" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateDialog && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateDialog(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-100 p-6 shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium mb-2">生成深度报告</h2>
            <p className="text-sm text-stone-500 mb-4">选择一个档案，生成大运流年与五行分析报告。</p>
            <div className="space-y-3">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left bg-stone-50 hover:bg-stone-100 rounded-xl p-4 transition-colors"
                  disabled={generatingProfileId === p.id}
                  onClick={() => generateReport(p.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.name || "未命名"}</div>
                      <div className="text-xs text-stone-400 mt-1">
                        {new Date(p.birthDateTime).toLocaleString("zh-CN")}
                      </div>
                    </div>
                    {generatingProfileId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                    ) : (
                      <Plus className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
                <ChevronLeft className="w-4 h-4" /> 取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingRegenerate && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
          onClick={() => setPendingRegenerate(null)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-100 p-6 shadow-lg max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium mb-2">确认重新生成？</h2>
            <p className="text-sm text-stone-500 mb-4">
              重新生成会覆盖「{pendingRegenerate.profileName || "未命名"}」的现有报告。
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setPendingRegenerate(null)}>
                取消
              </Button>
              <Button
                disabled={generatingProfileId === pendingRegenerate.profileId}
                onClick={() => generateReport(pendingRegenerate.profileId)}
              >
                {generatingProfileId === pendingRegenerate.profileId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "确认"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomDock />
    </div>
  );
}
