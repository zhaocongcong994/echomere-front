"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Star, Trash2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getCurrentDayun, parseBazi, type ProfileRecord } from "@/lib/bazi-profile";

const YEARS = Array.from({ length: 100 }, (_, i) => 2026 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    gender: "male",
    year: 1990,
    month: 1,
    day: 15,
    hour: 12,
    minute: 30,
    type: "others",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProfiles = useCallback(async () => {
    const res = await apiFetch("/profiles");
    if (res.ok) {
      const data = await res.json();
      setProfiles(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/profiles")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (cancelled) return;
        setProfiles(data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createProfile = async () => {
    setSubmitting(true);
    const res = await apiFetch("/profiles", {
      method: "POST",
      body: JSON.stringify({ ...form, isPrimary: true }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDialogOpen(false);
      fetchProfiles();
    }
  };

  const setPrimary = async (id: string) => {
    await apiFetch(`/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isPrimary: true }),
    });
    fetchProfiles();
  };

  const deleteProfile = async (id: string) => {
    await apiFetch(`/profiles/${id}`, { method: "DELETE" });
    fetchProfiles();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100">
        <div className="max-w-[1500px] mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-medium">我的命盘</span>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 py-8 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight">我的命盘</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="lg" className="h-11 px-5 text-base" />}>
              <Plus className="w-4 h-4 mr-1" /> 新增档案
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增命盘档案</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>称呼</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：小明" />
                </div>
                <div>
                  <Label>关系</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as string })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">自己</SelectItem>
                      <SelectItem value="others">他人</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>性别</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as string })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男</SelectItem>
                      <SelectItem value="female">女</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>年</Label>
                    <Select value={String(form.year)} onValueChange={(v) => setForm({ ...form, year: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>月</Label>
                    <Select value={String(form.month)} onValueChange={(v) => setForm({ ...form, month: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>日</Label>
                    <Select value={String(form.day)} onValueChange={(v) => setForm({ ...form, day: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>时</Label>
                    <Select value={String(form.hour)} onValueChange={(v) => setForm({ ...form, hour: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {HOURS.map((h) => <SelectItem key={h} value={String(h)}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>分</Label>
                    <Select value={String(form.minute)} onValueChange={(v) => setForm({ ...form, minute: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {MINUTES.map((m) => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={createProfile} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存并设为主命盘"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {profiles.length === 0 && (
            <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
              <h2 className="font-medium">还没有命盘档案</h2>
              <p className="mt-2 text-sm text-stone-400">点击右上角新增档案，完成排盘后即可在这里查看详情。</p>
            </div>
          )}
          {profiles.map((p) => {
            const bazi = parseBazi(p);
            const currentDayun = bazi ? getCurrentDayun(bazi) : undefined;
            const pillars = bazi?.chart?.fourPillars;
            return (
              <article
                key={p.id}
                onClick={() => router.push(`/profiles/${p.id}`)}
                className="group cursor-pointer bg-white rounded-3xl border border-stone-200/70 p-5 md:p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl md:text-3xl font-medium">{p.name || "未命名"}</h2>
                      {p.isPrimary && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    </div>
                    <p className="text-sm text-stone-400 mt-1.5">
                      {p.type === "self" ? "自己" : "他人"} · {p.gender === "male" ? "男" : p.gender === "female" ? "女" : "其他"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="text-stone-500"
                      aria-label={`查看${p.name || "未命名"}的命盘详情`}
                      onClick={(event) => { event.stopPropagation(); router.push(`/profiles/${p.id}`); }}
                    >
                      <span className="hidden sm:inline">查看详情</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {!p.isPrimary && (
                      <Button variant="ghost" size="icon" aria-label="设为主命盘" onClick={(event) => { event.stopPropagation(); setPrimary(p.id); }}>
                        <Star className="w-4 h-4 text-stone-400" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label="删除命盘" onClick={(event) => { event.stopPropagation(); deleteProfile(p.id); }}>
                      <Trash2 className="w-4 h-4 text-stone-400" />
                    </Button>
                  </div>
                </div>
                {bazi && (
                  <div className="mt-6 pt-6 border-t border-stone-100">
                    <div className="grid grid-cols-4 gap-2 md:gap-3">
                      {(["year", "month", "day", "hour"] as const).map((key, index) => {
                        const fallback = [bazi.year, bazi.month, bazi.day, bazi.hour][index];
                        const pillar = pillars?.[key];
                        return (
                          <div key={key} className="rounded-2xl bg-stone-50 px-2 py-3 md:p-4 text-center">
                            <div className="text-[11px] text-stone-400">{["年柱", "月柱", "日柱", "时柱"][index]}</div>
                            <div className="mt-1.5 text-xl md:text-2xl font-medium tracking-wider">
                              {pillar ? `${pillar.stem}${pillar.branch}` : fallback}
                            </div>
                            <div className="mt-1 text-[11px] md:text-xs text-stone-500 truncate">
                              {key === "day" ? "日主" : pillar?.tenGod || "—"}{pillar?.diShi ? ` · ${pillar.diShi}` : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-stone-500">
                      <span>日主：{bazi.dayMaster.gan}{bazi.dayMaster.zhi}（{bazi.dayMaster.wuxing}） · {bazi.genderLabel}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(p.birthDateTime).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-1.5 md:gap-2">
                      {Object.entries(bazi.wuxing).map(([element, value]) => (
                        <div key={element} className="rounded-xl border border-stone-100 px-2 py-2 text-center">
                          <div className="text-xs text-stone-400">{element}</div>
                          <div className="text-sm font-medium mt-0.5">{value}</div>
                        </div>
                      ))}
                    </div>

                    {(currentDayun || bazi.chart?.relations.length) && (
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
                        {currentDayun && (
                          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">
                            当前大运 {currentDayun.ganZhi} · {currentDayun.tenGod}
                          </span>
                        )}
                        {bazi.chart?.relations.slice(0, 3).map((relation, index) => (
                          <span key={`${relation.description}-${index}`} className="rounded-full bg-stone-100 px-3 py-1.5">
                            {relation.description}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
                  <span className="text-stone-400">
                    {bazi?.engine ? `${bazi.engine.name} ${bazi.engine.version}` : "完整八字命盘"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-stone-700 group-hover:text-black">
                    查看完整命盘 <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
