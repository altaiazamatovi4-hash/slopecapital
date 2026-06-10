import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-8">
      <div className="space-y-2 max-w-3xl">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.22em] text-glacier font-medium">{eyebrow}</div>
        )}
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}