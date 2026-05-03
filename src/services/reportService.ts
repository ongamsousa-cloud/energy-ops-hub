 import ApiService from "./apiService";
 import { supabase } from "@/integrations/supabase/client";
 
 class ReportService extends ApiService {
   async registrarExportacao(reportType: string, filters: any) {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return null;
 
     const { data, error } = await supabase.from("report_exports").insert({
       report_type: reportType,
       requested_by: user.id,
       filters,
       status: "pending",
     }).select().single();
 
     if (error) {
       console.error("Error registering report export:", error);
       return null;
     }
 
     return data;
   }
 
   async completarExportacao(exportId: string, fileUrl: string) {
     const { error } = await supabase
       .from("report_exports")
       .update({
         file_url: fileUrl,
         status: "completed",
         completed_at: new Date().toISOString(),
       })
       .eq("id", exportId);
 
     return !error;
   }
 }
 
 export const reportService = new ReportService();