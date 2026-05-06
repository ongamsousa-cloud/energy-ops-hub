 export const OS_OPERATIONAL_STATUS = [
   "pendente",
   "aguardando_aprovacao_departamento",
   "aguardando_liberacao_estoque",
   "material_reservado",
   "material_liberado",
   "aguardando_confirmacao_retirada",
   "pronta_para_execucao",
   "iniciada",
   "em_deslocamento",
   "chegou_ao_local",
   "em_execucao",
   "aguardando_validacao_supervisor",
   "correcao_solicitada",
   "corrigida",
   "aprovada_supervisor",
   "aguardando_medicao",
   "medida",
   "aguardando_financeiro",
   "faturavel",
   "faturada",
   "aguardando_auditoria",
   "aprovada_auditoria",
   "reprovada_auditoria",
   "concluida",
   "cancelada"
 ] as const;
 
 export type OSStatus = (typeof OS_OPERATIONAL_STATUS)[number];
 
 export const OS_STATUS_LABELS: Record<OSStatus, string> = {
   pendente: "Pendente",
   aguardando_aprovacao_departamento: "Aguardando aprovação do departamento",
   aguardando_liberacao_estoque: "Aguardando liberação do estoque",
   material_reservado: "Material reservado",
   material_liberado: "Material liberado",
   aguardando_confirmacao_retirada: "Aguardando confirmação de retirada",
   pronta_para_execucao: "Pronta para execução",
   iniciada: "Iniciada",
   em_deslocamento: "Em deslocamento",
   chegou_ao_local: "Chegou ao local",
   em_execucao: "Em execução",
   aguardando_validacao_supervisor: "Aguardando validação do supervisor",
   correcao_solicitada: "Correção solicitada",
   corrigida: "Corrigida",
   aprovada_supervisor: "Aprovada pelo supervisor",
   aguardando_medicao: "Aguardando medição",
   medida: "Medida",
   aguardando_financeiro: "Aguardando financeiro",
   faturavel: "Faturável",
   faturada: "Faturada",
   aguardando_auditoria: "Aguardando auditoria",
   aprovada_auditoria: "Aprovada na auditoria",
   reprovada_auditoria: "Reprovada na auditoria",
   concluida: "Concluída",
   cancelada: "Cancelada"
 };
 
 export const OS_ALLOWED_TRANSITIONS: Record<OSStatus, OSStatus[]> = {
   pendente: ["aguardando_aprovacao_departamento", "cancelada"],
   aguardando_aprovacao_departamento: ["aguardando_liberacao_estoque", "pronta_para_execucao", "cancelada"],
   aguardando_liberacao_estoque: ["material_reservado", "cancelada"],
   material_reservado: ["material_liberado", "cancelada"],
   material_liberado: ["aguardando_confirmacao_retirada"],
   aguardando_confirmacao_retirada: ["pronta_para_execucao"],
   pronta_para_execucao: ["iniciada", "cancelada"],
   iniciada: ["em_deslocamento"],
   em_deslocamento: ["chegou_ao_local"],
   chegou_ao_local: ["em_execucao"],
   em_execucao: ["aguardando_validacao_supervisor"],
   aguardando_validacao_supervisor: ["correcao_solicitada", "aprovada_supervisor"],
   correcao_solicitada: ["corrigida"],
   corrigida: ["aguardando_validacao_supervisor"],
   aprovada_supervisor: ["aguardando_medicao", "aguardando_financeiro", "aguardando_auditoria"],
   aguardando_medicao: ["medida"],
   medida: ["aguardando_financeiro"],
   aguardando_financeiro: ["faturavel"],
   faturavel: ["faturada"],
   faturada: ["aguardando_auditoria"],
   aguardando_auditoria: ["aprovada_auditoria", "reprovada_auditoria", "concluida"],
   aprovada_auditoria: ["concluida", "aguardando_financeiro"],
   reprovada_auditoria: ["correcao_solicitada"],
   concluida: [],
   cancelada: []
 };
 
 export function canTransitionOS(currentStatus: OSStatus, nextStatus: OSStatus): boolean {
   return OS_ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
 }
 
 // Legacy export for backward compatibility during migration
 export const OS_STATUS_FLOW = Object.entries(OS_STATUS_LABELS).reduce((acc, [key, label]) => {
   acc[key as OSStatus] = { 
     label, 
     next: OS_ALLOWED_TRANSITIONS[key as OSStatus] 
   };
   return acc;
 }, {} as Record<OSStatus, { label: string; next?: OSStatus[] }>);