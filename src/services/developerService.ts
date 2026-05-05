 import { supabase } from "@/integrations/supabase/client";
 
 export const developerService = {
   async getSystemStats() {
     const [users, os, depts, pros, errors] = await Promise.all([
       supabase.from("profiles").select("id", { count: "exact", head: true }),
       supabase.from("ordens_servico").select("id", { count: "exact", head: true }),
       supabase.from("departments").select("id", { count: "exact", head: true }),
       supabase.from("profiles").select("id", { count: "exact", head: true }).not("cargo", "is", null),
       supabase.from("system_error_logs").select("id", { count: "exact", head: true }).eq("status", "open"),
     ]);
 
     return {
       totalUsers: users.count || 0,
       totalOS: os.count || 0,
       totalDepts: depts.count || 0,
       totalPros: pros.count || 0,
       openErrors: errors.count || 0,
     };
   },
 
   async getDesignSettings() {
     const { data, error } = await supabase
       .from("app_settings")
       .select("value")
       .eq("key", "theme.settings")
       .maybeSingle();
     
     if (error) throw error;
     return data?.value || {};
   },

   async saveDesignSettings(settings: any) {
     const { error } = await supabase
       .from("app_settings")
       .upsert({ key: "theme.settings", value: settings }, { onConflict: "key" });
     
     if (error) throw error;
   },
 
    async getAuditLogs(filters?: { limit?: number; startDate?: string; endDate?: string }) {
      let query = supabase
        .from("developer_audit_logs")
        .select(`
          *,
          profiles:user_id (nome, email)
        `)
        .order("created_at", { ascending: false });

      if (filters?.limit) query = query.limit(filters.limit);
      if (filters?.startDate) query = query.gte("created_at", filters.startDate);
      if (filters?.endDate) query = query.lte("created_at", filters.endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data.map(log => ({
        ...log,
        user_email: (log.profiles as any)?.email || "Sistema",
        user_nome: (log.profiles as any)?.nome || "Sistema"
      }));
    },

    async logAction(action: string, mod: string, details: any = {}) {
      const { error } = await supabase.rpc("log_developer_action", {
        p_action: action,
        p_module: mod,
        p_details: details
      });
      if (error) console.error("Erro ao registrar auditoria:", error);
    },

    async getErrorLogs(filters?: { limit?: number }) {
      let query = supabase
        .from("system_error_logs")
        .select(`
          *,
          profiles:user_id (nome, email)
        `)
        .order("created_at", { ascending: false });

      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async createBackup(name: string, type: string, data: any) {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("system_backups").insert({
        name,
        config_type: type,
        data,
        created_by: userData.user?.id
      });
      if (error) throw error;
      await this.logAction("CREATE_BACKUP", "BACKUP", { name, type });
    },

    async listBackups(type?: string) {
      let query = supabase.from("system_backups").select("*").order("created_at", { ascending: false });
      if (type) query = query.eq("config_type", type);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

   async executeSQL(query: string) {
     // This would normally call an edge function since standard supabase client can't run raw SQL
     // For now, we will use a dedicated RPC if available or simulate for UI testing
     const { data, error } = await supabase.rpc('execute_dev_sql', { sql_query: query });
     if (error) throw error;
     return data;
   },

   async getSystemModules() {
     const { data, error } = await supabase
       .from("developer_settings")
       .select("*")
       .eq("setting_type", "module_toggle");
     if (error) throw error;
     return data;
   },

   async toggleModule(id: string, active: boolean) {
     const { error } = await supabase
       .from("developer_settings")
       .update({ is_active: active })
       .eq("id", id);
     if (error) throw error;
   },

   async forcePasswordReset(targetUserId: string, requestedBy: string) {
     const { error } = await supabase
       .from("password_reset_requests")
       .insert({
         target_user_id: targetUserId,
         requested_by: requestedBy,
         status: 'pending'
       });
     if (error) throw error;
   },

   async getAllUsersDetailed() {
     const { data, error } = await supabase
       .from("profiles")
       .select(`
         *,
         user_roles (role)
       `);
     if (error) throw error;
     return data;
   }
 };