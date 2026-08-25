"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Menu, X, Loader2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [question, setQuestion] = useState("");

  const isLoggedIn = !!user;

  const handleAsk = () => {
    const q = question || "我的年度运势如何？";
    const chatUrl = `/chat?question=${encodeURIComponent(q)}`;
    if (isLoggedIn) {
      router.push(chatUrl);
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(chatUrl)}`);
    }
  };

  const handleCTA = () => {
    if (isLoggedIn) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold tracking-tight">MetaSight</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-stone-600">
            <span className="hover:text-stone-900 cursor-pointer">AI 分析</span>
            <span
              className="hover:text-stone-900 cursor-pointer"
              onClick={() => router.push("/blog")}
            >
              博客
            </span>
            <Dialog>
              <DialogTrigger className="hover:text-stone-900 cursor-pointer bg-transparent border-none p-0 text-inherit">
                文档
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>关于 MetaSight</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                  <p>
                    MetaSight（元见）是一款 AI 命理分析产品，通过解读命盘与星象，帮助用户把传统命理智慧转化为可落地的行动建议。
                  </p>
                  <p>
                    目前支持八字运势分析与共情倾听两种模式。所有 AI 解读在测试期均无限次开放。
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            ) : isLoggedIn ? (
              <>
                <span className="text-sm text-stone-600">
                  {user?.name || user?.email || user?.phone}
                </span>
                <Button size="sm" onClick={() => router.push("/chat")}>
                  进入 Chat
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  退出
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                登录
              </Button>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 px-4 py-4 space-y-3 text-sm text-stone-600">
            <div>AI 分析</div>
            <div onClick={() => { router.push("/blog"); setMobileMenuOpen(false); }}>博客</div>
            <div>文档</div>
            <div className="pt-2 flex gap-3">
              {isLoggedIn ? (
                <>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push("/chat")}>
                    进入 Chat
                  </Button>
                  <Button size="sm" className="flex-1" onClick={logout}>
                    退出
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push("/login")}>
                  登录
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-xs tracking-[0.2em] text-stone-400 mb-6">新一代 AI 命理系统</p>
        <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
          观象入元，见心知命
        </h1>
        <p className="text-stone-500 max-w-md mb-2">
          解读命盘与星象，将它们转化为你下一步的行动建议
        </p>
        <p className="text-xs text-stone-400 mb-10">东方命理 · 西方占星</p>

        <Button size="lg" className="rounded-full px-8 mb-12" onClick={handleCTA}>
          {isLoggedIn ? "进入 MetaSight" : "获取我的命盘分析"}
        </Button>

        <div className="w-full max-w-2xl">
          <div className="relative">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="要不要离开这份工作？"
              className="h-14 pl-6 pr-16 rounded-full border-stone-200 bg-white shadow-sm text-base"
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            />
            <Button
              size="icon"
              className="absolute right-2 top-2 rounded-full"
              onClick={handleAsk}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-stone-400 mt-4">每一次问答，都是一次自我觉知</p>
        </div>
      </main>

      <footer className="border-t border-stone-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-stone-400">
          <span>© 2026 MetaSight Clone</span>
        </div>
      </footer>
    </div>
  );
}
