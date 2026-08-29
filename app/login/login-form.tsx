"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { apiFetch, isFrontendPreview } from "@/lib/api";
import { BrandLockup, ProductHeader } from "@/components/echomere-chrome";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "preview@echomere.local", code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "验证码错误，测试期固定为 123456");
        setLoading(false);
        return;
      }

      const { token, user } = await res.json();
      login(token, user);

      if (isFrontendPreview()) {
        router.push("/onboarding");
        return;
      }

      const callback = searchParams.get("callbackUrl") || "/chat";

      // 检查是否已创建主命盘档案
      const profileRes = await apiFetch("/profile");
      const profileData = await profileRes.json().catch(() => ({}));
      if (!profileData?.primaryProfile) {
        router.push(`/onboarding?callbackUrl=${encodeURIComponent(callback)}`);
        return;
      }

      router.push(callback);
    } catch {
      setError("网络异常，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen product-page auth-page flex flex-col bg-stone-50">
      <ProductHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="auth-card w-full max-w-sm bg-white rounded-2xl border border-stone-100 p-8 shadow-sm">
        <div className="auth-card__brand"><BrandLockup /></div>

        <h1 className="text-xl font-medium text-center mb-2">邀请码登录</h1>
        <p className="text-sm text-stone-500 text-center mb-6">
          输入账号与邀请码，继续访问洄映
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">邀请码</Label>
            <Input
              id="code"
              type="text"
              placeholder="请输入邀请码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "验证并进入"}
          </Button>
        </form>

        <p className="text-xs text-stone-400 text-center mt-6">
          邀请码仅限本人使用，请勿分享
        </p>
      </div>
      </main>
    </div>
  );
}
