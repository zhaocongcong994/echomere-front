"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ProductHeader } from "@/components/echomere-chrome";

interface WuxingAnalysis {
  scores: Record<string, number>;
  ranking: Array<{ element: string; score: number }>;
  dayMasterElement: string;
  bodyStrength: string;
  xiYongShen: { xi: string[]; ji: string[] };
  overview: string;
  dayMasterAnalysis: string;
  detail: string;
}

interface DayunItem {
  干支?: string;
  十神?: string;
  起运年份?: number;
  起运年龄?: number;
  index?: number;
  relation?: string;
  rating?: string;
  comprehensive?: string;
}

interface ReportContent {
  dayun?: {
    summary?: string;
    startInfo?: { 起运年龄?: number; 起运详情?: string };
    list?: DayunItem[];
  };
  wuxingAnalysis?: WuxingAnalysis;
}

interface ReportDetail {
  id: string;
  profileId: string;
  profileName: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  content?: ReportContent;
}

function renderMultiline(text?: string) {
  if (!text) return null;
  return text.split("\n").map((line, i) => (
    <p key={i} className={line.startsWith("▸") || line.startsWith("  •") ? "pl-2" : ""}>
      {line}
    </p>
  ));
}

export default function DeepReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/reports/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setReport(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <ProductHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-stone-500">报告不存在或无法访问</p>
          <Button className="mt-4" onClick={() => router.push("/daily-fortune")}>
            返回深度报告首页
          </Button>
        </main>
      </div>
    );
  }

  const content = report.content;
  const wuxing = content?.wuxingAnalysis;
  const dayun = content?.dayun;
  const dayunList = dayun?.list || [];

  return (
    <div className="min-h-screen product-page deep-report-detail-page bg-stone-50">
      <ProductHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/daily-fortune")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-medium">深度报告</h1>
            <p className="text-sm text-stone-500">
              {report.profileName || "未命名"} · {new Date(report.updatedAt).toLocaleString("zh-CN")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {wuxing && (
            <section className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">五行分析</h2>
              <div className="grid grid-cols-5 gap-3 mb-4">
                {wuxing.ranking?.map((item) => (
                  <div
                    key={item.element}
                    className="text-center p-3 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="text-2xl font-medium">{item.element}</div>
                    <div className="text-xs text-stone-500 mt-1">{item.score}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm text-stone-600">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                  <p className="font-medium">命局概览</p>
                  <p className="leading-relaxed">{wuxing.overview}</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                  <p className="font-medium">日主分析</p>
                  <p className="leading-relaxed whitespace-pre-line">{wuxing.dayMasterAnalysis}</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-2">
                  <p className="font-medium">五行详解</p>
                  <div className="leading-relaxed space-y-1">{renderMultiline(wuxing.detail)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="font-medium">喜用神</p>
                    <p>{wuxing.xiYongShen?.xi?.join("、") || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="font-medium">忌神</p>
                    <p>{wuxing.xiYongShen?.ji?.join("、") || "—"}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {dayun && (
            <section className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">大运流年</h2>
              <p className="text-sm text-stone-500 mb-4">{dayun.summary}</p>
              {dayun.startInfo?.起运年龄 !== undefined && (
                <p className="text-sm text-stone-500 mb-4">
                  起运年龄：{dayun.startInfo.起运年龄} 岁
                  {dayun.startInfo.起运详情 ? ` · ${dayun.startInfo.起运详情}` : ""}
                </p>
              )}

              {dayunList.length > 0 && (
                <div className="space-y-3">
                  {dayunList.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-base">
                          第{item.index || index + 1}步大运 · {item.干支 || "—"}
                          {item.十神 && (
                            <span className="text-sm text-stone-500 ml-2">{item.十神}</span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400">
                          {item.rating && <span className="mr-2">{item.rating}等运</span>}
                          {item.起运年份 !== undefined && `${item.起运年份} 年起`}
                          {item.起运年龄 !== undefined && ` · ${item.起运年龄} 岁`}
                        </div>
                      </div>
                      {item.relation && (
                        <p className="text-sm text-stone-600 leading-relaxed mb-2">
                          {item.relation}
                        </p>
                      )}
                      {item.comprehensive && (
                        <p className="text-sm text-stone-500 leading-relaxed">
                          {item.comprehensive}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {!content && (
          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm text-center">
            <p className="text-stone-500">报告内容为空或尚未生成完成。</p>
          </div>
        )}
      </main>
    </div>
  );
}
