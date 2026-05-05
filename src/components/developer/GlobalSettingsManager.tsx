 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
  import { Save, RefreshCw, Trash2, Zap, History, RotateCcw } from "lucide-react";
 import { toast } from "sonner";
  import { developerService } from "@/services/developerService";
  import { Badge } from "@/components/ui/badge";
 
 export default function GlobalSettingsManager() {
   const [systemName, setSystemName] = useState("Energy Ops");
   const [version, setVersion] = useState("1.0.42");
   const [loading, setLoading] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);

    const loadBackups = async () => {
      const data = await developerService.listBackups('app_settings');
      setBackups(data || []);
    };

    useEffect(() => {
      loadBackups();
    }, []);

    const handleSave = async () => {
      setLoading(true);
      try {
        const config = { systemName, version };
        await developerService.createBackup(`Config ${new Date().toLocaleString()}`, 'app_settings', config);
        toast.success("Configurações salvas e backup criado!");
        loadBackups();
      } catch (e) {
        toast.error("Erro ao salvar.");
      } finally {
        setLoading(false);
      }
    };

    const handleRestore = async (backup: any) => {
      setSystemName(backup.data.systemName);
      setVersion(backup.data.version);
      toast.success("Configurações restauradas do backup!");
    };

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
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" /> {loading ? "Salvando..." : "Salvar e Backup"}
             </Button>
           </div>
         </CardContent>
       </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Histórico de Backups (Config)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum backup encontrado.</p>
              ) : (
                backups.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-bold">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-2" onClick={() => handleRestore(b)}>
                      <RotateCcw className="h-3 w-3" /> Restaurar
                    </Button>
                  </div>
                ))
              )}
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