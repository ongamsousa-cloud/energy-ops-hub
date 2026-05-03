import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  iniciada: "bg-info/10 text-info border-info/20",
  em_andamento: "bg-info/10 text-info border-info/20",
  finalizada: "bg-warning/10 text-warning border-warning/20",
  aguardando_revisao: "bg-warning/10 text-warning border-warning/20",
  em_revisao: "bg-warning/10 text-warning border-warning/20",
  correcao_solicitada: "bg-warning/10 text-warning border-warning/20",
  corrigida: "bg-info/10 text-info border-info/20",
  aprovada: "bg-success/10 text-success border-success/20",
  reprovada: "bg-destructive/10 text-destructive border-destructive/20",
  faturada: "bg-success/10 text-success border-success/20",
  cancelada: "bg-muted text-muted-foreground border-border",
  rascunho: "bg-muted text-muted-foreground border-border",
  aberta: "bg-info/10 text-info border-info/20",
  planejamento: "bg-muted text-muted-foreground border-border",
  execucao: "bg-info/10 text-info border-info/20",
  pausada: "bg-warning/10 text-warning border-warning/20",
  aguardando_material: "bg-warning/10 text-warning border-warning/20",
  aguardando_aprovacao: "bg-warning/10 text-warning border-warning/20",
  concluida: "bg-success/10 text-success border-success/20",
  pendente: "bg-warning/10 text-warning border-warning/20",
  aprovado: "bg-success/10 text-success border-success/20",
  reprovado: "bg-destructive/10 text-destructive border-destructive/20",
  correcao: "bg-warning/10 text-warning border-warning/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", cls)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}