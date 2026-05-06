 import { supabase } from "@/integrations/supabase/client";
 
 import { OSStatus } from "@/shared/status/os-status";

class OSService {
   async updateStatus(osId: string, status: OSStatus, userId: string, details: {
     action?: string;
     comentario?: string;
     from_department_id?: string;
     to_department_id?: string;
     payload?: any;
   } = {}) {
     const { data: currentOS, error: fetchError } = await supabase
       .from("ordens_servico")
       .select("operational_status, department_id")
       .eq("id", osId)
       .single();

     if (fetchError) throw fetchError;

     const { error: updateError } = await supabase
       .from("ordens_servico")
       .update({
         operational_status: status,
         updated_at: new Date().toISOString()
       })
       .eq("id", osId);

     if (updateError) throw updateError;

     // Log the change in os_audit_logs
     await supabase.from("os_audit_logs").insert({
       os_id: osId,
       user_id: userId,
       status_anterior: currentOS?.operational_status,
       status_novo: status,
       comentario: details.comentario || "",
       action: details.action || 'status_change',
       from_department_id: details.from_department_id || currentOS?.department_id,
       to_department_id: details.to_department_id,
       payload: details.payload || {}
     });
   }

   async getOS(osId: string) {
     const { data, error } = await supabase
       .from("ordens_servico")
       .select(`
         *,
         obra:obras(nome),
         equipe:equipes(nome),
         supervisor:employees!supervisor_id(full_name),
         gestor:employees!gestor_responsavel_id(full_name),
         atividades:os_atividades(*),
         materiais:os_materials(*),
         evidencias:os_evidences(*)
       `)
       .eq("id", osId)
       .single();

    if (error) throw error;
    return data;
  }

  async canStartWorkOrder(osId: string, userId: string): Promise<{
    can_start: boolean;
    blocked_by: string[];
    message: string;
  }> {
    const blocked_by: string[] = [];
    
    // 1. Fetch OS and User data
    const { data: os, error: osError } = await supabase
      .from("ordens_servico")
      .select(`
        *,
        department:departments(id),
        profissional:profiles!ordens_servico_profissional_id_fkey(id, department_id)
      `)
      .eq("id", osId)
      .single();

    if (osError || !os) {
      return { can_start: false, blocked_by: ["os_not_found"], message: "Ordem de Serviço não encontrada." };
    }

    // 2. Status check
    const status = (os.operational_status || os.status || "").toLowerCase();
    if (status !== "pronta_para_execucao") {
      blocked_by.push("invalid_status");
    }

    // 3. User association and permissions
     if (os.profissional_id !== userId) {
       blocked_by.push("user_not_assigned");
     }

     // 3.1. Fetch User Profile for further checks
     const { data: profile } = await supabase.from("profiles").select("department_id").eq("id", userId).single();
     const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
     const userRoles = roles?.map(r => r.role) || [];

     // 3.2 Department check
     if (os.department_id && profile?.department_id !== os.department_id && !userRoles.includes('admin')) {
       blocked_by.push("invalid_department");
     }

     // 3.3 Role check (must have 'campo' or be admin/supervisor)
     if (!userRoles.some(r => ['campo', 'supervisor', 'admin', 'gestor', 'developer'].includes(r))) {
       blocked_by.push("no_field_permission");
     }
       invalid_department: "Você não pertence ao departamento responsável por esta OS.",
       no_field_permission: "Seu perfil não possui permissão para execução de campo.",

    // 4. Non-conformities check
    const { data: nc } = await supabase
      .from("non_conformities")
      .select("id, severity")
      .eq("os_id", osId)
      .in("status", ["aberta", "em_correcao", "reaberta"]);

    if (nc && nc.length > 0) {
      blocked_by.push("open_non_conformities");
      if (nc.some(n => n.severity === "critica" || n.severity === "alta")) {
        blocked_by.push("critical_non_conformities");
      }
    }

    // 5. Materials check (all planned must have been released)
    const { data: reservations } = await supabase
      .from("material_reservations")
      .select("status")
      .eq("os_id", osId);
    
    if (reservations?.some(r => r.status === "solicitado" || r.status === "reservado")) {
      blocked_by.push("materials_not_released");
    }

    const messages: Record<string, string> = {
      invalid_status: "A OS não está no status 'Pronta para Execução'.",
      user_not_assigned: "Você não é o profissional atribuído a esta OS.",
      open_non_conformities: "Existem não conformidades abertas para esta OS.",
      critical_non_conformities: "Existem pendências críticas de conformidade.",
       materials_not_released: "Existem materiais pendentes de liberação no estoque.",
       invalid_department: "Você não pertence ao departamento responsável por esta OS.",
       no_field_permission: "Seu perfil não possui permissão para execução de campo."
     };

    const can_start = blocked_by.length === 0;
    
    return {
      can_start,
      blocked_by,
      message: can_start ? "Liberação confirmada. Pode iniciar o trabalho." : messages[blocked_by[0]] || "Acesso bloqueado por pendências operacionais."
    };
  }
}

  export const osService = new OSService();
