"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  Clock3,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  getCurrentDayun,
  parseBazi,
  type PillarKey,
  type ProfileRecord,
} from "@/lib/bazi-profile";

const PILLAR_LABELS: Record<PillarKey, string> = {
  year: "年柱",
  month: "月柱",
  day: "日柱",
  hour: "时柱",
};

function LoadingState() {
  return (
    <div className="h-screen flex items-center justify-center bg-stone-50">
      <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
    </div>
  );
}

function ProfileDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/profiles/${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <LoadingState />;

  const bazi = profile ? parseBazi(profile) : null;
  if (notFound || !profile || !bazi) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-medium">没有找到这份命盘</h1>
        <p className="mt-2 text-sm text-stone-500">档案可能已被删除，或当前账号无权查看。</p>
        <Button className="mt-5" onClick={() => router.push("/profiles")}>返回我的命盘</Button>
      </div>
    );
  }

  const currentDayun = getCurrentDayun(bazi);
  const birthDate = new Date(profile.birthDateTime);
  const fourPillars = bazi.chart?.fourPillars;
  const fallbackPillars = { year: bazi.year, month: bazi.month, day: bazi.day, hour: bazi.hour };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/profiles")} aria-label="返回我的命盘">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-medium">命盘详情</span>
          </div>
          <span className="text-xs text-stone-400">
            {bazi.engine ? `${bazi.engine.name} ${bazi.engine.version}` : "八字命盘"}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-5">
        <section className="rounded-3xl border border-stone-200/70 bg-white p-5 md:p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-medium">{profile.name || "未命名"}</h1>
                {profile.isPrimary && <Star className="w-5 h-5 fill-amber-500 text-amber-500" />}
              </div>
              <p className="mt-2 text-sm text-stone-500">
                {profile.type === "self" ? "自己" : "他人"} · {profile.gender === "male" ? "男" : profile.gender === "female" ? "女" : "其他"} · {bazi.genderLabel}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {birthDate.toLocaleDateString("zh-CN")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="w-4 h-4" />
                {birthDate.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
              {profile.birthLocation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {profile.birthLocation}
                </span>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-4 gap-2 md:gap-4">
            {(Object.keys(PILLAR_LABELS) as PillarKey[]).map((key) => {
              const pillar = fourPillars?.[key];
              return (
                <div key={key} className={`rounded-2xl p-3 md:p-5 text-center ${key === "day" ? "bg-stone-900 text-white" : "bg-stone-50"}`}>
                  <div className={`text-[11px] md:text-xs ${key === "day" ? "text-white/55" : "text-stone-400"}`}>{PILLAR_LABELS[key]}</div>
                  <div className="mt-2 text-2xl md:text-3xl font-medium tracking-wider">
                    {pillar ? `${pillar.stem}${pillar.branch}` : fallbackPillars[key]}
                  </div>
                  <div className={`mt-1.5 text-[11px] md:text-xs ${key === "day" ? "text-white/65" : "text-stone-500"}`}>
                    {key === "day" ? "日主" : pillar?.tenGod || "—"}{pillar?.diShi ? ` · ${pillar.diShi}` : ""}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-stone-600">
            <span className="rounded-full bg-stone-100 px-3 py-1.5">日主 {bazi.dayMaster.gan} · {bazi.dayMaster.wuxing}</span>
            {bazi.lunarDate && (
              <span className="rounded-full bg-stone-100 px-3 py-1.5">
                农历 {bazi.lunarDate.year}年{bazi.lunarDate.month}月{bazi.lunarDate.day}
              </span>
            )}
            {currentDayun && (
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">
                当前大运 {currentDayun.ganZhi} · {currentDayun.tenGod}
              </span>
            )}
          </div>
        </section>

        {fourPillars && (
          <section className="rounded-3xl border border-stone-200/70 bg-white p-5 md:p-7 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-medium">四柱详解</h2>
              <p className="mt-1 text-sm text-stone-400">查看十神、藏干、纳音、十二长生、神煞与空亡</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(Object.keys(PILLAR_LABELS) as PillarKey[]).map((key) => {
                const pillar = fourPillars[key];
                return (
                  <div key={key} className="rounded-2xl border border-stone-100 bg-stone-50/60 p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-stone-400">{PILLAR_LABELS[key]}</div>
                        <div className="mt-1 text-2xl font-medium">{pillar.stem}{pillar.branch}</div>
                      </div>
                      <div className="text-right text-xs leading-5 text-stone-500">
                        <div>{key === "day" ? "日主" : pillar.tenGod || "—"} · {pillar.diShi || "—"}</div>
                        <div>{pillar.naYin || "无纳音"}{pillar.kongWang.isKong ? " · 空亡" : ""}</div>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-stone-100 pt-3">
                      <div className="text-[11px] text-stone-400">藏干</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {pillar.hiddenStems.map((hidden) => (
                          <span key={`${key}-${hidden.stem}-${hidden.qiType}`} className="rounded-lg bg-white border border-stone-100 px-2.5 py-1.5 text-xs">
                            {hidden.stem} · {hidden.tenGod} <span className="text-stone-400">{hidden.qiType}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 min-h-5 text-xs text-stone-500">
                      {pillar.shenSha.length > 0 ? `神煞：${pillar.shenSha.join("、")}` : "神煞：—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-stone-200/70 bg-white p-5 md:p-7 shadow-sm">
            <h2 className="text-lg font-medium">五行分布</h2>
            <p className="mt-1 text-sm text-stone-400">基于四柱干支与藏干的加权统计</p>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {Object.entries(bazi.wuxing).map(([element, value]) => (
                <div key={element} className="rounded-2xl border border-stone-100 bg-stone-50 p-3 text-center">
                  <div className="text-lg font-medium">{element}</div>
                  <div className="mt-1 text-xs text-stone-400">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 text-sm text-stone-600">
              <div className="flex justify-between"><span>身强弱参考</span><span>{bazi.bodyStrength || "—"}</span></div>
              <div className="flex justify-between gap-4"><span>喜神参考</span><span>{bazi.xiYongShen?.xi.join("、") || "—"}</span></div>
              <div className="flex justify-between gap-4"><span>忌神参考</span><span>{bazi.xiYongShen?.ji.join("、") || "—"}</span></div>
            </div>
            {bazi.assessment?.warning && (
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{bazi.assessment.warning}</p>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200/70 bg-white p-5 md:p-7 shadow-sm">
            <h2 className="text-lg font-medium">命盘关系</h2>
            <p className="mt-1 text-sm text-stone-400">天干地支之间的合、冲、刑、害等关系</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {bazi.chart?.relations.length ? bazi.chart.relations.map((relation, index) => (
                <span key={`${relation.description}-${index}`} className="rounded-full bg-stone-100 px-3 py-2 text-sm text-stone-600">
                  {relation.description}
                </span>
              )) : <span className="text-sm text-stone-400">未见显著合冲刑害</span>}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs text-stone-400">胎元</div>
                <div className="mt-1 text-xl font-medium">{bazi.chart?.taiYuan || "—"}</div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-xs text-stone-400">命宫</div>
                <div className="mt-1 text-xl font-medium">{bazi.chart?.mingGong || "—"}</div>
              </div>
            </div>
            {bazi.chart?.trueSolarTimeInfo && (
              <div className="mt-4 rounded-2xl border border-stone-100 px-4 py-3 text-xs leading-5 text-stone-500">
                真太阳时校正：{bazi.chart.trueSolarTimeInfo.originalTime || "原时间"} → {bazi.chart.trueSolarTimeInfo.trueSolarTime || "校正时间"}
                {typeof bazi.chart.trueSolarTimeInfo.correctionMinutes === "number" ? `（${bazi.chart.trueSolarTimeInfo.correctionMinutes} 分钟）` : ""}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-stone-200/70 bg-white p-5 md:p-7 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-medium">大运排布</h2>
              <p className="mt-1 text-sm text-stone-400">{bazi.dayun ? `${bazi.dayun.startAgeDetail}，约 ${bazi.dayun.startAge} 岁起运` : "暂无大运数据"}</p>
            </div>
            <span className="text-xs text-stone-400">当前年份 {new Date().getFullYear()}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(bazi.dayun?.list ?? []).map((item) => {
              const isCurrent = currentDayun?.startYear === item.startYear;
              return (
                <div key={`${item.startYear}-${item.ganZhi}`} className={`rounded-2xl border p-4 ${isCurrent ? "border-amber-200 bg-amber-50/70" : "border-stone-100 bg-stone-50/60"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-medium">{item.ganZhi}</div>
                      <div className="mt-1 text-xs text-stone-500">{item.tenGod}{item.diShi ? ` · ${item.diShi}` : ""}</div>
                    </div>
                    {isCurrent && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-800">当前</span>}
                  </div>
                  <div className="mt-3 text-xs text-stone-400">{item.startYear} 年起 · {item.startAge} 岁</div>
                  <div className="mt-1 text-xs text-stone-400">{item.naYin || ""}</div>
                  {item.shenSha && item.shenSha.length > 0 && (
                    <div className="mt-3 border-t border-stone-100 pt-2 text-[11px] leading-5 text-stone-500">{item.shenSha.join("、")}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <p className="px-2 text-center text-xs leading-5 text-stone-400">
          命盘、干支、十神、大运等为确定性排盘数据；喜忌与事件判断属于解释性分析，应结合全盘综合研判。
        </p>
      </main>
    </div>
  );
}

export default function ProfileDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProfileDetailContent />
    </Suspense>
  );
}
