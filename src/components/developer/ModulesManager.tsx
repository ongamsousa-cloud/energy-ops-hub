 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { toast } from "sonner";
 import { developerService } from "@/services/developerService";
 import { LayoutGrid, Info } from "lucide-react";

 export default function ModulesManager() {
   const [modules, setModules] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     loadModules();
   }, []);

   const loadModules = async () => {
     try {
       const data = await developerService.getSystemModules();
       setModules(data || []);
     } catch (e: any) {
       toast.error("Erro ao carregar módulos");
     } finally {
       setLoading(false);
     }
   };

   const handleToggle = async (id: string, currentStatus: boolean) => {
     try {
       await developerService.toggleModule(id, !currentStatus);
       setModules(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
       toast.success("Status do módulo atualizado");
     } catch (e: any) {
       toast.error("Erro ao atualizar módulo");
     }
   };

   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" /> Controle de Módulos</CardTitle>
           <CardDescription>Ative ou desative funcionalidades globais do sistema em tempo real.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {modules.map((m) => (
               <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                 <div className="space-y-0.5">
                   <Label className="text-base font-semibold">{m.setting_value.name}</Label>
                   <p className="text-sm text-muted-foreground">{m.description}</p>
                 </div>
                 <Switch 
                   checked={m.is_active} 
                   onCheckedChange={() => handleToggle(m.id, m.is_active)}
                 />
               </div>
             ))}
           </div>

           <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
             <Info className="h-5 w-5 mt-0.5 shrink-0" />
             <p className="text-sm italic">
               Nota: Desativar um módulo não apaga os dados, apenas remove o acesso às funcionalidades na interface para os usuários.
             </p>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }