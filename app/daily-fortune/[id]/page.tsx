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
  assessment: string;
}

interface DayunItem {
  startYear?: number;
  startAge?: number;
  ganZhi?: string;
  tenGod?: string;
  diShi?: string;
  liunianList?: Array<{
    year: number;
    age?: number;
    ganZhi?: string;
    tenGod?: string;
    diShi?: string;
  }>;
}

interface ReportContent {
  dayun?: {
    direction?: string;
    startAge?: number;
    jiaoyunYear?: number;
    dayun?: DayunItem[];
    tongyun?: DayunItem[];
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
  const dayunList = dayun?.list || dayun?.dayun || [];

  return (
    <div className="min-h-screen product-page deep-report-detail-page bg-stone-50">
      <ProductHeader />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/daily-fortune")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-medium">{report.title || "八字深度报告"}</h1>
            <p className="text-sm text-stone-500">
              {report.profileName || "未命名"} · {new Date(report.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
        </div>

        {wuxing && (
          <section className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-6">
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
            <div className="space-y-2 text-sm text-stone-600">
              <p>
                <span className="font-medium">日主五行：</span>
                {wuxing.dayMasterElement}
              </p>
              <p>
                <span className="font-medium">身强身弱：</span>
                {wuxing.bodyStrength}
              </p>
              <p>
                <span className="font-medium">喜用神：</span>
                {wuxing.xiYongShen?.xi?.join("、") || "—"}
              </p>
              <p>
                <span className="font-medium">忌神：</span>
                {wuxing.xiYongShen?.ji?.join("、") || "—"}
              </p>
              <p className="leading-relaxed">{wuxing.assessment}</p>
            </div>
          </section>
        )}

        {dayun && (
          <section className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-4">大运流年</h2>
            <div className="flex flex-wrap gap-2 mb-4 text-sm text-stone-600">
              {dayun.direction && <span>顺逆：{dayun.direction}</span>}
              {dayun.startAge !== undefined && <span>起运年龄：{dayun.startAge} 岁</span>}
              {dayun.jiaoyunYear && <span>交运年份：{dayun.jiaoyunYear}</span>}
            </div>

            {dayunList.length > 0 && (
              <div className="space-y-3">
                {dayunList.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-base">
                        {item.ganZhi || "—"}
                        {item.tenGod && (
                          <span className="text-sm text-stone-500 ml-2">{item.tenGod}</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400">
                        {item.startYear !== undefined && `${item.startYear} 年起`}
                        {item.startAge !== undefined && ` · ${item.startAge} 岁`}
                      </div>
                    </div>
                    {item.liunianList && item.liunianList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.liunianList.slice(0, 10).map((ly) => (
                          <span
                            key={ly.year}
                            className="text-xs px-2 py-1 rounded bg-white border border-stone-100 text-stone-600"
                          >
                            {ly.year} {ly.ganZhi}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {!content && (
          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm text-center">
            <p className="text-stone-500">报告内容为空或尚未生成完成。</p>
          </div>
        )}
      </main>
    </div>
  );
}
