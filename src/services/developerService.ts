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
   }
 };