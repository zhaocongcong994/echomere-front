"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { apiFetch } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Menu,
  X,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Home,
  ArrowUp,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";
import { BottomDock, BrandLockup, EchoMark } from "@/components/echomere-chrome";

const RECOMMENDED_QUESTIONS: Record<string, string[]> = {
  suiyuan: ["天生适合做什么", "这个offer该不该接", "我的桃花运怎么样", "我的桃花运怎么样", "最近感觉不太顺"],
  kanyun: ["分析一下我今年的年度运势", "我的桃花运怎么样", "今年适合换工作吗", "我的财运如何"],
  qingting: ["最近压力好大", "感觉人生没有方向", "和家里人关系很紧张", "最近总是睡不好"],
  wenshi: ["这个 offer 该不该接", "要不要离开这份工作", "今年适合创业吗", "和 TA 合适吗"],
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: string;
  thinkingSummary?: string;
  routeReason?: string;
}

interface Conversation {
  id: string;
  mode: string;
  title: string;
  updatedAt: string;
}

function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("suiyuan");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeProfileName, setActiveProfileName] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchActiveProfileName();
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!pendingDelete) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deletingConversationId) {
        setPendingDelete(null);
        setDeleteError(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingDelete, deletingConversationId]);

  useEffect(() => {
    const q = searchParams.get("question");
    if (!q) {
      sessionStorage.removeItem("_ms_autosend_lock");
      return;
    }
    if (!user) return;
    if (sessionStorage.getItem("_ms_autosend_lock")) return;
    sessionStorage.setItem("_ms_autosend_lock", "1");
    const decoded = decodeURIComponent(q);
    // 清除 URL query，避免刷新重复发送
    router.replace("/chat");
    // 使用 setTimeout 确保 input 已更新且组件已渲染
    setTimeout(() => sendMessage(decoded), 0);
  // `sendMessage` intentionally reads the latest conversation state after the
  // query has been consumed; including it would retrigger the one-shot send.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, router]);

  async function fetchConversations() {
    const res = await apiFetch("/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  }

  async function fetchActiveProfileName() {
    try {
      const res = await apiFetch("/profile");
      if (!res.ok) return;

      const data = await res.json();
      setActiveProfileName(data.primaryProfile?.name?.trim() || "");
    } catch {
      setActiveProfileName("");
    }
  }

  const loadConversation = async (id: string) => {
    const res = await apiFetch(`/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setCurrentConversationId(data.id);
    setMode(data.mode);
    setMessages(
      data.messages.map((m: Message) => ({
        ...m,
        routeReason: m.toolCalls ? extractRouteReason(m.toolCalls) : undefined,
      }))
    );
    setSidebarOpen(false);
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setMode("suiyuan");
  };

  const deleteConversation = async () => {
    if (!pendingDelete) return;

    const { id } = pendingDelete;
    setDeletingConversationId(id);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        setDeleteError(result?.error || "删除失败，请稍后重试。");
        return;
      }

      setConversations((current) => current.filter((conversation) => conversation.id !== id));
      if (currentConversationId === id) startNewChat();
      setPendingDelete(null);
    } catch {
      setDeleteError("网络异常，暂时无法删除，请重试。");
    } finally {
      setDeletingConversationId(null);
    }
  };

  const extractRouteReason = (): string | undefined => {
    try {
      return undefined;
    } catch {
      return undefined;
    }
  };

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setInput("");

    const userMessage: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await apiFetch("/chat/stream", {
        method: "POST",
        body: JSON.stringify({
          mode,
          message: text,
          conversationId: currentConversationId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content:
              err.error === "NO_PROFILE"
                ? "看运需要先建立命盘档案，请先去设置页创建。"
                : `请求失败：${err.error || "未知错误"}`,
          },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        thinkingSummary: "思考了片刻",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (!reader) {
        setLoading(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const eventLine = block.split("\n").find((l) => l.startsWith("event:"));
          const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;

          const event = eventLine.slice(6).trim();
          const data = JSON.parse(dataLine.slice(5));

          if (event === "meta") {
            setCurrentConversationId(data.conversationId);
            assistantMessage.toolCalls = JSON.stringify(data.toolCalls);
            assistantMessage.routeReason = data.routeReason;
            fetchConversations();
          }

          if (event === "chunk") {
            assistantMessage.content += data.content || "";
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMessage.id ? { ...assistantMessage } : m))
            );
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "网络异常，请重试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  const renderToolCalls = (msg: Message) => {
    if (!msg.toolCalls) return null;
    try {
      const calls = JSON.parse(msg.toolCalls) as Array<{
        name: string;
        parameters?: unknown;
        result?: {
          ganZhi?: string;
          shiShen?: string;
          naYin?: string;
          year?: number;
          originalName?: string;
          changedName?: string;
          originalNumber?: number;
          changedNumber?: number;
          changingYaos?: number[];
          yaos?: Array<{ index: number; type: string; yin: boolean; changing: boolean }>;
        };
      }>;

      const kanyunCalls = calls.filter((c) => c.name === "查询命盘" || c.name === "查询时间流");
      const hexagramCall = calls.find((c) => c.name === "起卦服务");

      return (
        <div className="space-y-2 my-3">
          {msg.routeReason && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-700">
              {msg.routeReason}
            </div>
          )}

          {kanyunCalls.map((call, i) => (
            <div key={i} className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-2 text-sm">
              <div className="font-medium text-stone-700">{call.name}</div>
              {call.name === "查询时间流" && call.result && (
                <div className="text-stone-500 text-xs mt-1">
                  {call.result.year}年流年{call.result.ganZhi}{call.result.shiShen}
                  {call.result.naYin}
                </div>
              )}
            </div>
          ))}

          {hexagramCall && hexagramCall.result && (
            <div className="bg-stone-50 border border-stone-100 rounded-lg px-4 py-3 text-sm">
              <div className="font-medium text-stone-700 mb-2">
                起卦结果：{hexagramCall.result.originalName}（第 {hexagramCall.result.originalNumber} 卦）
                {hexagramCall.result.changingYaos && hexagramCall.result.changingYaos.length > 0 && (
                  <span className="text-stone-500 ml-2">
                    → 变卦 {hexagramCall.result.changedName}，动爻 {hexagramCall.result.changingYaos.join(", ")}
                  </span>
                )}
              </div>
              <div className="flex gap-2 text-xs">
                {hexagramCall.result.yaos?.map((y) => (
                  <div
                    key={y.index}
                    className={`px-2 py-1 rounded ${
                      y.changing ? "bg-stone-200 text-stone-800" : "bg-white text-stone-500"
                    }`}
                  >
                    {y.index}爻 {y.type}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="chat-page h-screen flex bg-white">
      {/* Sidebar */}
      <aside
        className={`chat-sidebar${sidebarCollapsed ? " is-collapsed" : ""} fixed inset-y-0 left-0 z-40 w-72 bg-stone-50 border-r border-stone-100 transform transition-transform duration-200 md:translate-x-0 md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="chat-sidebar__brand border-b border-stone-100">
          <BrandLockup />
          <button
            type="button"
            className="chat-sidebar__collapse hidden md:grid"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "展开左侧导航" : "收起左侧导航"}
            title={sidebarCollapsed ? "展开导航" : "收起导航"}
          >
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="chat-sidebar__actions">
          <Button variant="outline" className="chat-sidebar__button w-full justify-start" onClick={() => router.push("/")}>
            <Home className="w-4 h-4" /> <span className="chat-sidebar__label">返回首页</span>
          </Button>
          <Button variant="outline" className="chat-sidebar__button w-full justify-start" onClick={startNewChat}>
            <MessageCircle className="w-4 h-4" /> <span className="chat-sidebar__label">新对话</span>
          </Button>
        </div>

        <div className="chat-sidebar__section-title text-xs font-medium text-stone-400">对话记录</div>
        <div className="chat-sidebar__history overflow-y-auto flex-1 pb-4 space-y-1">
          {conversations.map((c) => (
            <div key={c.id} className="chat-history-item">
              <button
                onClick={() => loadConversation(c.id)}
                className={`chat-history-main text-left px-3 py-2 text-sm transition-colors ${
                  currentConversationId === c.id ? "is-active" : ""
                }`}
              >
                <div className="truncate">{c.title}</div>
                <div className="text-xs text-stone-400">
                  {c.mode === "kanyun" ? "看运" : c.mode === "qingting" ? "倾听" : c.mode === "wenshi" ? "问事" : "随缘"}
                </div>
              </button>
              <button
                type="button"
                className="chat-history-delete"
                aria-label={`删除对话：${c.title}`}
                title="删除对话"
                disabled={deletingConversationId === c.id}
                onClick={() => {
                  setDeleteError(null);
                  setPendingDelete(c);
                }}
              >
                {deletingConversationId === c.id
                  ? <Loader2 className="animate-spin" />
                  : <Trash2 />}
              </button>
            </div>
          ))}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {pendingDelete && (
        <div
          className="chat-delete-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingConversationId) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
        >
          <section
            className="chat-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-delete-dialog-title"
            aria-describedby="chat-delete-dialog-description"
          >
            <div className="chat-delete-dialog__icon" aria-hidden="true"><Trash2 /></div>
            <h2 id="chat-delete-dialog-title">是否确定删除？</h2>
            <p id="chat-delete-dialog-description">
              对话“{pendingDelete.title}”及其中的全部消息将被永久删除，无法恢复。
            </p>
            {deleteError && <p className="chat-delete-dialog__error" role="alert">{deleteError}</p>}
            <div className="chat-delete-dialog__actions">
              <button
                type="button"
                className="chat-delete-dialog__cancel"
                disabled={Boolean(deletingConversationId)}
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteError(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="chat-delete-dialog__confirm"
                disabled={Boolean(deletingConversationId)}
                onClick={deleteConversation}
              >
                {deletingConversationId ? <><Loader2 className="animate-spin" /> 正在删除</> : "确定删除"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Main */}
      <main className="chat-main flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-stone-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs text-emerald-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              聊天服务正常，随时为你解惑
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-600 hidden md:inline">{activeProfileName || "当前档案"}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="chat-empty-state h-full flex flex-col items-center justify-center px-4 text-center">
              <h1 className="text-3xl md:text-5xl font-light">
                {activeProfileName || "你好"}
              </h1>
              <p className="chat-empty-copy text-stone-500">
                以八字与星盘为双重映照，<br />
                于时间的回响中，辨认此刻的自己。
              </p>

              <div className="chat-empty-composer w-full max-w-2xl">
                <div className="relative chat-composer">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="心有所问，洄映为答…"
                    className="h-12 pr-14 rounded-full border-stone-200 bg-stone-50 chat-composer-input"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 chat-composer-send"
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                  >
                    <ArrowUp className="w-[17px] h-[17px]" strokeWidth={1.45} />
                  </Button>
                </div>
              </div>

              <div className="chat-empty-suggestions flex flex-wrap justify-center gap-2 max-w-xl">
                {(RECOMMENDED_QUESTIONS[mode as keyof typeof RECOMMENDED_QUESTIONS] || []).map((q, index) => (
                  <button
                    key={`${q}-${index}`}
                    onClick={() => sendMessage(q)}
                    className="px-4 py-2 rounded-full bg-stone-50 border border-stone-100 text-sm text-stone-600 hover:bg-stone-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-50 text-stone-800 border border-stone-100"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="chat-answer-brand mb-2 text-stone-400">
                        <EchoMark />
                        <span>洄映</span>
                      </div>
                    )}

                    {msg.role === "assistant" && msg.thinkingSummary && (
                      <div className="mb-3">
                        <button
                          onClick={() => setExpandedThinking(expandedThinking === msg.id ? null : msg.id)}
                          className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
                        >
                          {expandedThinking === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          思考了片刻
                        </button>
                        {expandedThinking === msg.id && (
                          <div className="mt-1 text-xs text-stone-400 bg-white rounded p-2 border border-stone-100">
                            {msg.thinkingSummary}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.role === "assistant" && renderToolCalls(msg)}

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.role === "assistant" && msg.content && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-200/60">
                        <button className="text-stone-400 hover:text-stone-600">
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button className="text-stone-400 hover:text-stone-600">
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm text-stone-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 洄映正在思考…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <>
            <Separator />

            <div className="p-4 bg-white">
              <div className="max-w-3xl mx-auto">
                <div className="relative chat-composer">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="心有所问，洄映为答…"
                    className="h-12 pr-14 rounded-full border-stone-200 bg-stone-50 chat-composer-input"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 chat-composer-send"
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                  >
                    <ArrowUp className="w-[17px] h-[17px]" strokeWidth={1.45} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        <BottomDock />

      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
