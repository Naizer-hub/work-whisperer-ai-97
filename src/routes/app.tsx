import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendMessage, clearHistory, ASSISTANT_MODES, type AssistantMode } from "@/lib/assistant.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Mail, FileText, ListChecks, Search, MessageSquare, Send, Trash2, LogOut, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({ meta: [{ title: "Aria — Assistant" }] }),
});

type Msg = { id: string; role: "user" | "assistant"; content: string; mode: string; created_at: string };

const MODE_META: Record<AssistantMode, { icon: typeof Mail; placeholder: string }> = {
  chat: { icon: MessageSquare, placeholder: "Ask Aria anything about your work…" },
  email: { icon: Mail, placeholder: "Describe the email you need (recipient, goal, tone)…" },
  meeting: { icon: FileText, placeholder: "Paste meeting notes or transcript…" },
  tasks: { icon: ListChecks, placeholder: "Describe the goal or project to plan…" },
  research: { icon: Search, placeholder: "What topic should I research?" },
};

function AppPage() {
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AssistantMode>("chat");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = useServerFn(sendMessage);
  const clear = useServerFn(clearHistory);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setAuthReady(true);
      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (rows) setMessages(rows as Msg[]);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode, sending]);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      mode,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const { reply } = await send({ data: { message: text, mode } });
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply,
          mode,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  async function onClear() {
    if (!confirm("Clear all your conversation history?")) return;
    try {
      await clear({});
      setMessages([]);
      toast.success("History cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function onSignOut() {
    await supabase.auth.signOut();
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border bg-surface">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
            <span className="font-display text-xl">Aria</span>
          </Link>
        </div>
        <div className="p-3 space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2">Modes</p>
          {(Object.keys(ASSISTANT_MODES) as AssistantMode[]).map((m) => {
            const Icon = MODE_META[m].icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {ASSISTANT_MODES[m].label}
              </button>
            );
          })}
        </div>
        <div className="mt-auto p-3 border-t border-border space-y-1">
          <Button variant="ghost" className="w-full justify-start" onClick={onClear}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear history
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={onSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur">
          <div>
            <h1 className="font-display text-2xl leading-none">{ASSISTANT_MODES[mode].label}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Aria · responsible AI · always verify important outputs
            </p>
          </div>
          {/* Mobile mode picker */}
          <div className="md:hidden">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as AssistantMode)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              {(Object.keys(ASSISTANT_MODES) as AssistantMode[]).map((m) => (
                <option key={m} value={m}>{ASSISTANT_MODES[m].label}</option>
              ))}
            </select>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <EmptyState mode={mode} onPick={(s) => setInput(s)} />
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Aria is thinking…
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="border-t border-border bg-background px-4 md:px-8 py-4"
        >
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-input bg-card shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-ring transition">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                rows={3}
                placeholder={MODE_META[mode].placeholder}
                className="border-0 resize-none focus-visible:ring-0 shadow-none bg-transparent"
              />
              <div className="flex items-center justify-between p-2 pt-0">
                <span className="text-xs text-muted-foreground px-2">⏎ to send · Shift + ⏎ for newline</span>
                <Button type="submit" size="sm" disabled={sending || !input.trim()}>
                  <Send className="h-4 w-4 mr-1.5" /> Send
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 shadow-[var(--shadow-soft)]">
          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 shrink-0 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
      <div className="flex-1 max-w-none text-foreground leading-relaxed [&_p]:my-2 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold">
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
}

const SUGGESTIONS: Record<AssistantMode, string[]> = {
  chat: [
    "What should I focus on in my first week as a new manager?",
    "Suggest a quick agenda for a 30-min 1:1.",
  ],
  email: [
    "Polite email to reschedule a client meeting to next Tuesday.",
    "Follow-up email after an interview, warm but professional.",
  ],
  meeting: [
    "Summarize: discussed Q3 launch, decided to delay by 2 weeks, Sarah owns marketing brief, open question on pricing tiers…",
  ],
  tasks: [
    "Plan the launch of an internal employee newsletter in 3 weeks.",
    "Break down: migrate our team docs from Notion to Confluence.",
  ],
  research: [
    "Overview of OKRs vs KPIs for a 20-person startup.",
    "Pros and cons of async-first vs hybrid meetings.",
  ],
};

function EmptyState({ mode, onPick }: { mode: AssistantMode; onPick: (s: string) => void }) {
  return (
    <div className="text-center py-10">
      <div className="mx-auto h-12 w-12 rounded-2xl mb-4" style={{ background: "var(--gradient-primary)" }} />
      <h2 className="font-display text-3xl">How can I help with {ASSISTANT_MODES[mode].label.toLowerCase()}?</h2>
      <p className="text-muted-foreground mt-2 text-sm">Try one of these to get started:</p>
      <div className="mt-6 grid gap-2 max-w-xl mx-auto">
        {SUGGESTIONS[mode].map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left rounded-xl border border-border bg-card hover:bg-accent transition-colors px-4 py-3 text-sm text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
