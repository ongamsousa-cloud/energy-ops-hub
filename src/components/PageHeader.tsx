import { ReactNode } from "react";

export default function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 border-b border-border pb-4">
      {/* Print-only Logo */}
      <div className="hidden print:flex items-center gap-3 mb-6">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        <div>
          <div className="text-sm font-bold uppercase tracking-wider">Energia · Operações</div>
          <div className="text-[10px] text-muted-foreground">Gestão de Serviços Elétricos</div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 print:hidden">{actions}</div>}
      </div>
    </div>
  );
}