import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/import")({
  head: () => ({ meta: [{ title: "Data Ingestion — SlopeCapital" }] }),
  component: ImportPage,
});

const SCHEMA_FIELDS = ["Date", "Snow Depth (cm)", "Resort ID", "Temperature (°C)", "Wind Speed (km/h)"];
const MOCK_COLUMNS = ["timestamp", "snow_cm", "location", "temp_c", "wind_kph", "humidity", "pressure_hpa"];

type Stage = "idle" | "uploading" | "mapping" | "validating" | "done";

function ImportPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({
    Date: "timestamp",
    "Snow Depth (cm)": "snow_cm",
    "Resort ID": "location",
    "Temperature (°C)": "temp_c",
    "Wind Speed (km/h)": "wind_kph",
  });
  const [validationOpen, setValidationOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (name: string) => {
    setFileName(name);
    setStage("uploading");
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 2000) * 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
      else setStage("mapping");
    };
    requestAnimationFrame(tick);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    simulateUpload(file?.name ?? "avalanche_center_2026.csv");
  };

  const onChoose = () => inputRef.current?.click();

  const reset = () => {
    setStage("idle");
    setFileName(null);
    setProgress(0);
  };

  const runVerification = () => {
    setValidationOpen(true);
    setStage("validating");
    setTimeout(() => setStage("done"), 2200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Data Pipeline"
        title="Custom Data Ingestion"
        description="Pipe proprietary weather, sentiment, or avalanche-center datasets into the SlopeCapital correlation engine."
      />

      {(stage === "idle" || stage === "uploading") && (
        <GlassCard className="p-0 overflow-hidden">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={onChoose}
            className={cn(
              "relative cursor-pointer rounded-xl m-5 border-2 border-dashed flex flex-col items-center justify-center text-center px-6 py-20 transition-all",
              dragging ? "border-glacier bg-glacier/5" : "border-border/60 hover:border-glacier/60 hover:bg-glacier/[0.03]",
            )}
          >
            <input ref={inputRef} type="file" hidden accept=".csv,.json" onChange={(e) => simulateUpload(e.target.files?.[0]?.name ?? "data.csv")} />
            <div className="h-16 w-16 rounded-2xl border border-glacier/40 bg-glacier/10 flex items-center justify-center mb-5">
              <UploadCloud className="h-7 w-7 text-glacier" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">Drag & drop CSV or JSON data here</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              e.g. hyper-local avalanche center data, custom snowpack sensors, or proprietary sentiment feeds.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono px-2 py-1 rounded border border-border/60">CSV</span>
              <span className="font-mono px-2 py-1 rounded border border-border/60">JSON</span>
              <span>· max 250MB</span>
            </div>

            {stage === "uploading" && (
              <div className="mt-8 w-full max-w-md text-left">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-glacier" />
                  <span className="font-mono truncate">{fileName}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="mt-2 h-1.5 bg-white/5 [&>div]:bg-glacier" />
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {(stage === "mapping" || stage === "validating" || stage === "done") && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-mint/10 border border-mint/40 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-mint" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Uploaded</div>
                <div className="mt-0.5 font-mono text-sm">{fileName} · 12,486 rows · 7 columns</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8" onClick={reset}>
              <X className="h-3.5 w-3.5 mr-1" /> Discard
            </Button>
          </div>

          <div className="p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Column Mapping</div>
            <div className="overflow-hidden rounded-xl border border-border/40">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-0 bg-white/[0.02] px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>SlopeCapital Schema</span><span /><span>Your File</span>
              </div>
              <ul className="divide-y divide-border/40">
                {SCHEMA_FIELDS.map((f) => (
                  <li key={f} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3">
                    <div className="font-medium text-sm">{f}</div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={mapping[f] ?? ""} onValueChange={(v) => setMapping((m) => ({ ...m, [f]: v }))}>
                      <SelectTrigger className="bg-transparent border-border/40 font-mono"><SelectValue placeholder="Select column…" /></SelectTrigger>
                      <SelectContent>{MOCK_COLUMNS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-9 border-border/60" onClick={reset}>Cancel</Button>
              <Button size="sm" className="h-9 bg-glacier text-primary-foreground hover:bg-glacier/90" onClick={runVerification}>Run Verification</Button>
            </div>
          </div>
        </GlassCard>
      )}

      <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{stage === "done" ? "Validation Complete" : "Validating Rows…"}</DialogTitle>
            <DialogDescription>
              {stage === "done"
                ? "All 12,486 rows pass schema validation. Ready to merge with the master dashboard."
                : "Running 12,486 rows against the SlopeCapital schema."}
            </DialogDescription>
          </DialogHeader>

          {stage === "validating" ? (
            <div className="py-6 flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-glacier" />
              <span className="font-mono text-muted-foreground">Checking types, ranges, timestamps…</span>
            </div>
          ) : (
            <div className="py-4 space-y-2">
              {["Schema match", "Timestamp parsing", "Range checks", "Deduplication"].map((step) => (
                <div key={step} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-mint" />
                  <span>{step}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">PASS</span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setValidationOpen(false)}>Close</Button>
            <Button
              size="sm"
              disabled={stage !== "done"}
              className="bg-mint text-primary-foreground hover:bg-mint/90"
              onClick={() => {
                setValidationOpen(false);
                toast.success("Dataset merged with Master Dashboard", { description: `${fileName} · 12,486 rows ingested` });
                reset();
              }}
            >
              Merge with Master Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}