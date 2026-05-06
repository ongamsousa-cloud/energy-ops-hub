import { cn } from "@/lib/utils";

 const statusConfig: Record<string, { label: string; class: string }> = {
   // Flow OS
   pendente: { label: "Pendente", class: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
   aguardando_aprovacao_departamento: { label: "Aguard. Depto", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
   aguardando_liberacao_estoque: { label: "Aguard. Estoque", class: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
   material_liberado: { label: "Material Liberado", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
   pronta_para_execucao: { label: "Pronta Execução", class: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
   iniciada: { label: "Iniciada", class: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
   em_deslocamento: { label: "Em Deslocamento", class: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
   chegou_ao_local: { label: "No Local", class: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
   em_execucao: { label: "Em Execução", class: "bg-blue-600/10 text-blue-700 border-blue-600/20" },
   aguardando_validacao_supervisor: { label: "Valid. Supervisor", class: "bg-amber-600/10 text-amber-700 border-amber-600/20" },
   correcao_solicitada: { label: "Correção", class: "bg-red-500/10 text-red-600 border-red-500/20" },
   corrigida: { label: "Corrigida", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
   aprovada_supervisor: { label: "Aprov. Supervisor", class: "bg-green-500/10 text-green-600 border-green-500/20" },
   aguardando_medicao: { label: "Aguard. Medição", class: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
   medida: { label: "Medida", class: "bg-emerald-600/10 text-emerald-700 border-emerald-600/20" },
   aguardando_financeiro: { label: "Aguard. Financeiro", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
   faturavel: { label: "Faturável", class: "bg-green-600/10 text-green-700 border-green-600/20" },
   faturada: { label: "Faturada", class: "bg-green-700/20 text-green-800 border-green-700/30" },
   aguardando_auditoria: { label: "Aguard. Auditoria", class: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
   aprovada_auditoria: { label: "Aprov. Auditoria", class: "bg-green-600/20 text-green-800 border-green-600/30" },
   reprovada_auditoria: { label: "Reprov. Auditoria", class: "bg-red-700/10 text-red-800 border-red-700/20" },
   concluida: { label: "Concluída", class: "bg-green-600 text-white border-green-700" },
   cancelada: { label: "Cancelada", class: "bg-slate-300 text-slate-600 border-slate-400" },
   
   // Legacy/Other mappings for compatibility
   atribuida: { label: "Atribuída", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
   pausada: { label: "Pausada", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
   em_andamento: { label: "Em Andamento", class: "bg-blue-600/10 text-blue-700 border-blue-600/20" },
 };

export default function StatusBadge({ status }: { status: string }) {
   const config = statusConfig[status.toLowerCase()] || { 
     label: status.replace(/_/g, " "), 
     class: "bg-muted text-muted-foreground border-border" 
   };

  return (
     <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", config.class)}>
       {config.label}
    </span>
  );
}