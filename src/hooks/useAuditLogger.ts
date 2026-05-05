 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/lib/auth";
 
 export function useAuditLogger() {
   const { user, profile } = useAuth();
 
   const logAction = async (
     action: string,
     module: string,
     oldValue: any = null,
     newValue: any = null
   ) => {
     if (!user) return;
 
     try {
       await supabase.from("developer_audit_logs").insert({
         user_id: user.id,
         user_email: profile?.email || user.email,
         action,
         module,
         old_value: oldValue,
         new_value: newValue,
         user_agent: navigator.userAgent,
       });
     } catch (error) {
       console.error("Erro ao registrar log de auditoria:", error);
     }
   };
 
   return { logAction };
 }