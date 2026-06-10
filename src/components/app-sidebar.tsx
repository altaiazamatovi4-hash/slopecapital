import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GitCompare,
  Mountain,
  Gauge,
  BookOpen,
  Snowflake,
  FlaskConical,
  Bell,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/correlation", label: "Correlation Matrix", icon: GitCompare },
  { to: "/deep-dive", label: "Resort × Ticker", icon: Mountain },
  { to: "/sentiment", label: "Sentiment Engine", icon: Gauge },
  { to: "/sandbox", label: "Scenario Sandbox", icon: FlaskConical },
  { to: "/alerts", label: "Alert Engine", icon: Bell },
  { to: "/import", label: "Data Ingestion", icon: Upload },
  { to: "/methodology", label: "Methodology", icon: BookOpen },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-2 border-r border-border/60 bg-sidebar/40 backdrop-blur-xl px-4 py-6 sticky top-0 h-screen">
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-lg bg-glacier/40 blur-md" />
          <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-glacier to-[oklch(0.65_0.18_250)] flex items-center justify-center">
            <Snowflake className="h-5 w-5 text-[oklch(0.15_0.03_260)]" strokeWidth={2.5} />
          </div>
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">SlopeCapital</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Snow × Equities</div>
        </div>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-glacier/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-glacier glow-glacier" />
              )}
              <Icon className={cn("h-4 w-4", active && "text-glacier")} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-6 border-t border-border/60">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-mint opacity-75 pulse-ring" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          <span>Live data — Q4 2026</span>
        </div>
        <div className="mt-2 font-mono text-[10px] text-muted-foreground/70">v2.4.1 · build 26.11</div>
      </div>
    </aside>
  );
}