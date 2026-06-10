import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESORTS, TICKERS } from "@/lib/mock";
import { Bell, Plus, Trash2, Save, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alert Engine — SlopeCapital" }] }),
  component: AlertsPage,
});

type Rule = {
  id: string;
  name: string;
  region: string;
  op: ">" | "<" | "=";
  cm: number;
  days: number;
  ticker: string;
  side: "Above" | "Below";
  sma: "SMA-20" | "SMA-50";
  action: "Webhook" | "Email" | "UI Notification";
  active: boolean;
};

const SEED: Rule[] = [
  { id: "r1", name: "Rockies Powder Surge → MTN", region: "Rockies", op: ">", cm: 45, days: 5, ticker: "MTN", side: "Above", sma: "SMA-20", action: "UI Notification", active: true },
  { id: "r2", name: "Alps Thin → ALPN Short Trigger", region: "Alps", op: "<", cm: 8, days: 7, ticker: "ALPN", side: "Below", sma: "SMA-50", action: "Email", active: false },
];

const REGIONS = Array.from(new Set(RESORTS.map((r) => r.region)));

function emptyRule(): Rule {
  return { id: crypto.randomUUID(), name: "Untitled Signal", region: "Rockies", op: ">", cm: 30, days: 7, ticker: "MTN", side: "Above", sma: "SMA-20", action: "UI Notification", active: true };
}

function AlertsPage() {
  const [rules, setRules] = useState<Rule[]>(SEED);
  const [draft, setDraft] = useState<Rule | null>(null);

  const startNew = () => setDraft(emptyRule());
  const saveDraft = () => {
    if (!draft) return;
    setRules((r) => {
      const exists = r.some((x) => x.id === draft.id);
      return exists ? r.map((x) => x.id === draft.id ? draft : x) : [draft, ...r];
    });
    setDraft(null);
    toast.success("Signal saved", { description: draft.name });
  };
  const edit = (rule: Rule) => setDraft({ ...rule });
  const remove = (id: string) => {
    setRules((r) => r.filter((x) => x.id !== id));
    toast.success("Signal deleted");
  };
  const toggle = (id: string) => setRules((r) => r.map((x) => x.id === id ? { ...x, active: !x.active } : x));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Automation"
        title="Alert Logic Engine"
        description="Wire snowfall forecasts into actionable trading signals. Compose multi-clause IFTTT rules with inline operators."
        actions={!draft && <Button size="sm" className="h-8 gap-1.5 bg-glacier text-primary-foreground hover:bg-glacier/90" onClick={startNew}><Plus className="h-3.5 w-3.5" /> Create New Signal</Button>}
      />

      {draft && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-glacier/15 border border-glacier/40 flex items-center justify-center">
                <Zap className="h-4 w-4 text-glacier" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Signal Builder</div>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="mt-0.5 bg-transparent border-0 px-0 h-auto text-lg font-semibold tracking-tight focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setDraft(null)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
              <Button size="sm" className="h-8 bg-glacier text-primary-foreground hover:bg-glacier/90" onClick={saveDraft}><Save className="h-3.5 w-3.5 mr-1" /> Save Signal</Button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <ClauseRow index="IF">
              <Token>
                <Select value={draft.region} onValueChange={(v) => setDraft({ ...draft, region: v })}>
                  <SelectTrigger className="w-44 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Token>
              <span className="text-muted-foreground text-sm">forecast predicts</span>
              <Token>
                <Select value={draft.op} onValueChange={(v) => setDraft({ ...draft, op: v as Rule["op"] })}>
                  <SelectTrigger className="w-16 bg-transparent border-border/50 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent>{[">", "<", "="].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </Token>
              <Input type="number" value={draft.cm} onChange={(e) => setDraft({ ...draft, cm: +e.target.value })} className="w-20 bg-transparent border-border/50 font-mono" />
              <span className="text-muted-foreground text-sm">cm of snow over</span>
              <Input type="number" value={draft.days} onChange={(e) => setDraft({ ...draft, days: +e.target.value })} className="w-20 bg-transparent border-border/50 font-mono" />
              <span className="text-muted-foreground text-sm">days.</span>
            </ClauseRow>

            <ClauseRow index="AND">
              <Token>
                <Select value={draft.ticker} onValueChange={(v) => setDraft({ ...draft, ticker: v })}>
                  <SelectTrigger className="w-44 bg-transparent border-border/50 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent>{TICKERS.map((t) => <SelectItem key={t.symbol} value={t.symbol}>${t.symbol}</SelectItem>)}</SelectContent>
                </Select>
              </Token>
              <span className="text-muted-foreground text-sm">is trading</span>
              <Token>
                <Select value={draft.side} onValueChange={(v) => setDraft({ ...draft, side: v as Rule["side"] })}>
                  <SelectTrigger className="w-28 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Above", "Below"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Token>
              <span className="text-muted-foreground text-sm">its</span>
              <Token>
                <Select value={draft.sma} onValueChange={(v) => setDraft({ ...draft, sma: v as Rule["sma"] })}>
                  <SelectTrigger className="w-28 bg-transparent border-border/50 font-mono"><SelectValue /></SelectTrigger>
                  <SelectContent>{["SMA-20", "SMA-50"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Token>
              <span className="text-muted-foreground text-sm">.</span>
            </ClauseRow>

            <ClauseRow index="THEN">
              <span className="text-muted-foreground text-sm">Trigger</span>
              <Token>
                <Select value={draft.action} onValueChange={(v) => setDraft({ ...draft, action: v as Rule["action"] })}>
                  <SelectTrigger className="w-44 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Webhook", "Email", "UI Notification"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </Token>
              <span className="text-muted-foreground text-sm">.</span>
            </ClauseRow>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Active Signals · {rules.filter((r) => r.active).length}/{rules.length}</div>
            <div className="mt-0.5 text-lg font-semibold">Rule library</div>
          </div>
        </div>

        {rules.length === 0 && !draft ? (
          <EmptyState onCreate={startNew} />
        ) : (
          <ul className="divide-y divide-border/40">
            {rules.map((r) => (
              <li key={r.id} className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
                <Switch checked={r.active} onCheckedChange={() => toggle(r.id)} className="data-[state=checked]:bg-mint" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground font-mono truncate">
                    {r.region} {r.op} {r.cm}cm / {r.days}d · ${r.ticker} {r.side} {r.sma} → {r.action}
                  </div>
                </div>
                <span className={cn("font-mono text-[10px] px-2 py-0.5 rounded-full border", r.active ? "bg-mint/10 text-mint border-mint/40" : "bg-white/5 text-muted-foreground border-border")}>
                  {r.active ? "LIVE" : "PAUSED"}
                </span>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => edit(r)}>Edit</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-bear" onClick={() => remove(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function ClauseRow({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-white/[0.02] p-3">
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-glacier px-2 py-1 rounded bg-glacier/10 border border-glacier/30">{index}</span>
      {children}
    </div>
  );
}

function Token({ children }: { children: React.ReactNode }) {
  return <div className="[&_button]:h-9 [&_button]:rounded-md">{children}</div>;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-glacier/10 border border-glacier/40 flex items-center justify-center mb-4">
        <Bell className="h-6 w-6 text-glacier" />
      </div>
      <h3 className="text-lg font-semibold">No signals yet</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Compose your first weather-conditioned trading signal. Mix forecast clauses with technical conditions.
      </p>
      <Button size="sm" className="mt-5 h-9 bg-glacier text-primary-foreground hover:bg-glacier/90" onClick={onCreate}>
        <Plus className="h-4 w-4 mr-1.5" /> Create New Signal
      </Button>
    </div>
  );
}