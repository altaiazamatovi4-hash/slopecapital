import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function ExportButton({ label = "Export CSV" }: { label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 border-border/60 bg-white/[0.02] hover:bg-glacier/10 hover:text-glacier hover:border-glacier/40"
      onClick={() =>
        toast.success("Report exported", {
          description: `slopecapital_${Date.now().toString(36)}.csv · 248 rows`,
        })
      }
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}