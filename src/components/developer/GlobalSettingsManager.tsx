 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Save, RefreshCw, Trash2, Zap } from "lucide-react";
 import { toast } from "sonner";
 
 export default function GlobalSettingsManager() {
   const [systemName, setSystemName] = useState("Energy Ops");
   const [version, setVersion] = useState("1.0.42");
   const [loading, setLoading] = useState(false);

   const handleForceUpdate = () => {
     const newVersion = (parseFloat(version) + 0.01).toFixed(2);
     setVersion(newVersion);
     toast.success(`Versão atualizada para ${newVersion}. Todos os clientes serão notificados para recarregar.`);
     // In a real scenario, we'd save this to DB and have clients poll/listen for it
   };

   const handleClearCache = () => {
     toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
       loading: 'Limpando cache global...',
       success: 'Cache de todos os usuários limpo com sucesso!',
       error: 'Erro ao limpar cache',
     });
   };

   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
           <CardTitle>Configurações Globais do Sistema</CardTitle>
           <CardDescription>Parâmetros fundamentais de funcionamento da plataforma.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Nome do Sistema</Label>
               <Input value={systemName} onChange={(e) => setSystemName(e.target.value)} />
             </div>
             <div className="space-y-2">
               <Label>Versão Atual da Build</Label>
               <div className="flex gap-2">
                 <Input value={version} readOnly className="bg-muted" />
                 <Button variant="outline" size="icon" onClick={handleForceUpdate} title="Incrementar Versão">
                   <RefreshCw className="h-4 w-4" />
                 </Button>
               </div>
             </div>
           </div>
           <div className="flex items-center justify-between p-4 border rounded-lg">
             <div className="space-y-0.5">
               <Label>Cadastro Público</Label>
               <p className="text-xs text-muted-foreground">Permitir que novos usuários se registrem sozinhos.</p>
             </div>
             <Switch />
           </div>
           <div className="flex justify-end">
             <Button onClick={() => toast.success("Configurações salvas!")}>
               <Save className="h-4 w-4 mr-2" /> Salvar Configurações
             </Button>
           </div>
         </CardContent>
       </Card>

       <Card className="border-amber-200 bg-amber-50/10">
         <CardHeader>
           <CardTitle className="text-amber-700 flex items-center gap-2"><Zap className="h-5 w-5" /> Ações de Manutenção Crítica</CardTitle>
           <CardDescription>Operações que impactam todos os usuários ativos no sistema.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex flex-wrap gap-4">
             <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={handleForceUpdate}>
               <RefreshCw className="h-4 w-4 mr-2" /> Forçar Atualização em Todos os Clientes
             </Button>
             <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={handleClearCache}>
               <Trash2 className="h-4 w-4 mr-2" /> Limpar Cache Global de Sessões
             </Button>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }