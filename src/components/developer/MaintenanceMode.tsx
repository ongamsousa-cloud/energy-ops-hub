 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { AlertTriangle, Save, RefreshCw, Bell } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "@/components/ui/sonner";

 export default function MaintenanceMode() {
   const [active, setActive] = useState(false);
   const [message, setMessage] = useState("");
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);

   useEffect(() => {
     fetchStatus();
   }, []);

   const fetchStatus = async () => {
     setLoading(true);
     try {
       const { data } = await supabase
         .from("system_maintenance")
         .select("*")
         .order('created_at', { ascending: false })
         .limit(1)
         .maybeSingle();
       
       if (data) {
         setActive(data.is_maintenance_mode);
         setMessage(data.message || "");
       }
     } finally {
       setLoading(false);
     }
   };

   const handleSave = async () => {
     setSaving(true);
     try {
       const { error } = await supabase
         .from("system_maintenance")
         .insert({
           is_maintenance_mode: active,
           message: message,
           allowed_roles: ['developer']
         });
       
       if (error) throw error;
       toast.success(`Modo manutenção ${active ? 'ATIVADO' : 'DESATIVADO'} globalmente.`);
     } catch (e) {
       toast.error("Erro ao propagar estado.");
     } finally {
       setSaving(false);
     }
   };

   return (
     <Card className="border-amber-200 bg-amber-50/10 shadow-lg">
       <CardHeader>
         <div className="flex justify-between items-start">
           <div>
             <CardTitle className="flex items-center gap-2 text-amber-700">
               <Bell className="h-5 w-5" /> Controle de Manutenção Global
             </CardTitle>
             <CardDescription>Gerencie o acesso ao sistema durante atualizações críticas.</CardDescription>
           </div>
           <Button variant="ghost" size="icon" onClick={fetchStatus}>
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
         </div>
       </CardHeader>
       <CardContent className="space-y-6">
         <div className="flex items-center justify-between p-5 border border-amber-200 rounded-xl bg-white shadow-sm">
           <div className="space-y-0.5">
             <Label className="text-amber-900 font-black text-lg">MODO DE MANUTENÇÃO</Label>
             <p className="text-sm text-amber-700">Ao ativar, apenas desenvolvedores poderão realizar login.</p>
           </div>
           <Switch 
             checked={active} 
             onCheckedChange={setActive}
             className="data-[state=checked]:bg-amber-600"
           />
         </div>

         <div className="space-y-2">
           <Label className="font-bold">Mensagem para os Usuários</Label>
           <div className="relative">
             <Textarea 
               placeholder="O sistema está em manutenção programada. Voltaremos em breve." 
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               className="min-h-[120px] bg-white border-amber-200 focus:ring-amber-500"
             />
             <div className="absolute bottom-2 right-2">
               <AlertTriangle className={`h-4 w-4 ${active ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
             </div>
           </div>
         </div>

         <div className="flex justify-end pt-4">
           <Button 
             onClick={handleSave} 
             disabled={saving || loading}
             variant={active ? "destructive" : "outline"}
             className={active ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-800 hover:bg-amber-100"}
           >
             {saving ? "Processando..." : (
               <><Save className="h-4 w-4 mr-2" /> PROPAGAR ESTADO PARA TODO O SISTEMA</>
             )}
           </Button>
         </div>
       </CardContent>
     </Card>
   );
 }