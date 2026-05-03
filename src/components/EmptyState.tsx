import { ReactNode } from "react";

export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}