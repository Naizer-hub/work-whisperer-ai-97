import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Mail, FileText, ListChecks, Search, MessageSquare, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Aria — AI Workplace Assistant" },
      {
        name: "description",
        content:
          "Aria helps you draft emails, summarize meetings, plan tasks, and research — all in one calm, AI-powered workspace.",
      },
    ],
  }),
});

const features = [
  { icon: Mail, title: "Email Drafting", desc: "Write clear, professional emails in the right tone — every time." },
  { icon: FileText, title: "Meeting Summaries", desc: "Turn raw notes into TL;DRs, decisions, and action items." },
  { icon: ListChecks, title: "Task Planning", desc: "Break goals into prioritized, owner-ready action plans." },
  { icon: Search, title: "Research Assist", desc: "Get balanced overviews with key points and trade-offs." },
  { icon: MessageSquare, title: "Open Chat", desc: "Ask anything about your workday and iterate freely." },
  { icon: Sparkles, title: "Responsible AI", desc: "Built-in uncertainty flags and verification reminders." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
            <span className="font-display text-xl">Aria</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt=""
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover opacity-60 -z-10"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/40 to-background" />
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered workplace assistant
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-tight text-foreground">
            Your calm, capable<br />assistant for work.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Aria drafts emails, summarizes meetings, plans tasks, and helps you research —
            so you can focus on the work that matters.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="shadow-[var(--shadow-glow)]">Start using Aria</Button></Link>
            <a href="#features"><Button size="lg" variant="outline">See features</Button></a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground flex justify-between">
          <span>© Aria — built for thoughtful work.</span>
          <span>AI outputs may be inaccurate. Verify before sending.</span>
        </div>
      </footer>
    </div>
  );
}
