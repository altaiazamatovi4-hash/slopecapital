import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";

export const Route = createFileRoute("/_app/methodology")({
  head: () => ({ meta: [{ title: "Methodology — SlopeCapital" }] }),
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Whitepaper · v2.4"
        title="Methodology"
        description="How SlopeCapital constructs, validates, and publishes the snow-equity correlation signals that power the platform."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="prose prose-invert max-w-none text-foreground/90 leading-relaxed">
          <GlassCard className="p-8 space-y-6 text-[15px]">
            <Section title="01 · The Thesis">
              <p>
                Strong early-season snow forecasts reliably precede short-term upticks in investor
                sentiment and stock prices for specific ski-related companies. SlopeCapital quantifies
                this propagation: from atmospheric model output, through retail and institutional
                sentiment shifts, into measurable price action across resort operators, equipment
                manufacturers, and winter hospitality equities.
              </p>
            </Section>

            <Section title="02 · Data Sources">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-glacier">
                <li><span className="font-mono">NOAA NWS</span> — daily snowfall measurements from 412 SNOTEL stations</li>
                <li><span className="font-mono">ECMWF / GFS</span> — 14-day ensemble forecasts, 9-km resolution</li>
                <li><span className="font-mono">OpenSnow</span> — resort-level snow reports and webcam telemetry</li>
                <li><span className="font-mono">NYSE / NASDAQ</span> — tick-level price and volume for 24 ski-exposed tickers</li>
                <li><span className="font-mono">Bloomberg / Reuters / X</span> — news flow and social sentiment, weighted by source authority</li>
              </ul>
            </Section>

            <Section title="03 · Signal Construction">
              <p>
                For each resort we compute a daily <em>snow anomaly</em> as the standardised deviation
                of observed accumulation versus a 10-year rolling seasonal baseline. Anomalies are
                aggregated to a regional index, then matched to ticker baskets through a static
                exposure map (e.g. <span className="font-mono text-glacier">MTN</span> is 62% Rockies,
                18% Sierras, 12% Northeast, 8% PNW).
              </p>
              <p>
                The headline correlation is a Pearson <span className="font-mono">r</span> between
                the rolling-30-day snow anomaly and the rolling-30-day cumulative return, computed
                week-over-week and Bonferroni-corrected for multiple comparisons.
              </p>
            </Section>

            <Section title="04 · Findings">
              <blockquote className="border-l-2 border-glacier pl-4 italic text-foreground/95">
                Across 2014–2025, a one-standard-deviation positive snow forecast surprise was followed
                by a mean <span className="text-mint not-italic font-mono">+1.8%</span> excess return on
                Resort Operators over the subsequent 10 trading days, with a hit-rate of 64%.
              </blockquote>
              <p>
                Equipment manufacturers respond on a longer lag (≈ 18 days) and with lower magnitude,
                consistent with the inventory-cycle hypothesis. Hospitality equities show the strongest
                pre-season response, peaking in late November.
              </p>
            </Section>

            <Section title="05 · Limitations & Disclosures">
              <p>
                Results are descriptive, not predictive. Past correlations do not guarantee future
                results. SlopeCapital is a research platform — nothing on this site constitutes investment
                advice, an offer to sell, or a solicitation to buy any security.
              </p>
            </Section>
          </GlassCard>
        </article>

        <aside className="space-y-4">
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">At a glance</div>
            <dl className="mt-3 space-y-2.5 text-sm">
              {[
                ["Universe", "24 tickers"],
                ["Resorts tracked", "32"],
                ["History", "2014 — Present"],
                ["Backtest periods", "11 seasons"],
                ["Mean lag", "9 days"],
                ["Top region", "Rockies"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono">{v}</dd>
                </div>
              ))}
            </dl>
          </GlassCard>
          <GlassCard>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Citation</div>
            <p className="mt-3 text-xs text-foreground/80 leading-relaxed">
              <span className="font-mono">SlopeCapital Research (2026).</span> Snow-Equity Propagation in
              Ski-Exposed Public Markets. Working Paper No. 14.
            </p>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-glacier mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}