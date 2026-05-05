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
       .from("design_system_settings")
       .select("*")
       .eq("is_active", true)
       .maybeSingle();
     
     if (error) throw error;
     return data;
   },
 
   async saveDesignSettings(settings: any, userId: string) {
     const { data, error } = await supabase
       .from("design_system_settings")
       .upsert({ ...settings, updated_by: userId, is_active: true });
     
     if (error) throw error;
     return data;
   },
 
   async getAuditLogs(limit = 50) {
     const { data, error } = await supabase
       .from("developer_audit_logs")
       .select("*")
       .order("created_at", { ascending: false })
       .limit(limit);
     
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