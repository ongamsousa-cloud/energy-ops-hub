 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import PageHeader from "@/components/PageHeader";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Slider } from "@/components/ui/slider";
 import { Badge } from "@/components/ui/badge";
 import { 
   Activity, Database, Palette, Terminal, AlertTriangle, CheckCircle2, 
   RefreshCcw, Save, Trash2, ShieldAlert, Zap, Search, Clock
 } from "lucide-react";
 import { toast } from "sonner";
 import { saveThemePrimary } from "@/hooks/useAppTheme";
 
 export default function DevDashboard() {
   const [counts, setCounts] = useState<any>({});
   const [loading, setLoading] = useState(false);
   const [primaryHsl, setPrimaryHsl] = useState({ h: 0, s: 72, l: 51 });
   const [healthIssues, setHealthIssues] = useState<any[]>([]);
   const [logs, setLogs] = useState<any[]>([]);
   const [checkingHealth, setCheckingHealth] = useState(false);
 
   const loadStats = async () => {
     const { data: users } = await supabase.from("profiles").select("count");
     const { data: os } = await supabase.from("ordens_servico").select("count");
     const { data: logsData } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(20);
     const { data: theme } = await supabase.from("app_settings").select("value").eq("key", "theme.primary_color").maybeSingle();
 
     setCounts({
       users: users?.[0]?.count || 0,
       os: os?.[0]?.count || 0,
     });
     if (logsData) setLogs(logsData);
     if (theme?.value) {
       const v = theme.value as any;
       if (v.h !== undefined) setPrimaryHsl({ h: v.h, s: v.s, l: v.l });
     }
   };
 
   const checkHealth = async () => {
     setCheckingHealth(true);
     const issues = [];
 
     // 1. OS sem departamento
     const { data: osNoDept } = await supabase.from("ordens_servico").select("id").is("department_id", null);
     if (osNoDept?.length) {
       issues.push({ 
         id: "os-no-dept", 
         title: "OS sem departamento", 
         count: osNoDept.length, 
         severity: "high",
         action: "Fix: Assign to general dept"
       });
     }
 
     // 2. Perfis inativos
     const { data: inactiveUsers } = await supabase.from("profiles").select("id").eq("ativo", false);
     if (inactiveUsers?.length) {
       issues.push({ 
         id: "inactive-users", 
         title: "Usuários pendentes", 
         count: inactiveUsers.length, 
         severity: "medium",
         action: "Review approvals"
       });
     }
 
     setHealthIssues(issues);
     setCheckingHealth(false);
   };
 
   const handleSaveTheme = async () => {
     try {
       setLoading(true);
       await saveThemePrimary(primaryHsl.h, primaryHsl.s, primaryHsl.l);
       toast.success("Design System atualizado com sucesso!");
     } catch (e: any) {
       toast.error(e.message);
     } finally {
       setLoading(false);
     }
   };
 
   const runFix = async (issueId: string) => {
     setLoading(true);
     if (issueId === "os-no-dept") {
       const { data: firstDept } = await supabase.from("departments").select("id").limit(1).maybeSingle();
       if (firstDept) {
         await supabase.from("ordens_servico").update({ department_id: firstDept.id }).is("department_id", null);
         toast.success("OS vinculadas ao primeiro departamento encontrado.");
       }
     }
     await checkHealth();
     setLoading(false);
   };
 
   useEffect(() => {
     loadStats();
     checkHealth();
   }, []);
 
   return (
     <div className="space-y-6">
       <PageHeader 
         title="Developer Dashboard" 
         description="Controle sistêmico, auditoria e manutenção do Design System."
         actions={
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => { loadStats(); checkHealth(); }}>
               <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar Dados
             </Button>
           </div>
         }
       />
 
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="bg-primary/5 border-primary/20">
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Usuários Totais</p>
                 <h3 className="text-2xl font-bold">{counts.users}</h3>
               </div>
               <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                 <Activity className="h-5 w-5 text-primary" />
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Ordens de Serviço</p>
                 <h3 className="text-2xl font-bold">{counts.os}</h3>
               </div>
               <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                 <Database className="h-5 w-5" />
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Saúde do Sistema</p>
                 <h3 className="text-2xl font-bold">{healthIssues.length === 0 ? "100%" : `${100 - healthIssues.length * 10}%`}</h3>
               </div>
               <div className={`h-10 w-10 rounded-full flex items-center justify-center ${healthIssues.length === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                 <Activity className="h-5 w-5" />
               </div>
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Modo Dev</p>
                 <Badge className="bg-emerald-500 hover:bg-emerald-600">ATIVO</Badge>
               </div>
               <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <Zap className="h-5 w-5" />
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       <Tabs defaultValue="health" className="w-full">
         <TabsList className="grid w-full grid-cols-4 mb-8">
           <TabsTrigger value="health" className="gap-2">
             <Activity className="h-4 w-4" /> Saúde & Fixes
           </TabsTrigger>
           <TabsTrigger value="design" className="gap-2">
             <Palette className="h-4 w-4" /> Design System
           </TabsTrigger>
           <TabsTrigger value="logs" className="gap-2">
             <Terminal className="h-4 w-4" /> Logs de Auditoria
           </TabsTrigger>
           <TabsTrigger value="db" className="gap-2">
             <Database className="h-4 w-4" /> Console DB
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="health" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <ShieldAlert className="h-5 w-5 text-primary" /> Diagnóstico de Integridade
               </CardTitle>
               <CardDescription>Varredura de inconsistências no banco de dados.</CardDescription>
             </CardHeader>
             <CardContent>
               {checkingHealth ? (
                 <div className="py-8 text-center animate-pulse">Analizando banco de dados...</div>
               ) : healthIssues.length === 0 ? (
                 <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                   <CheckCircle2 className="h-12 w-12 text-success" />
                   <div>
                     <h4 className="font-semibold text-lg">Sistema Saudável</h4>
                     <p className="text-muted-foreground">Nenhuma inconsistência crítica detectada no momento.</p>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {healthIssues.map(issue => (
                     <div key={issue.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                       <div className="flex items-center gap-3">
                         <AlertTriangle className={`h-5 w-5 ${issue.severity === 'high' ? 'text-destructive' : 'text-warning'}`} />
                         <div>
                           <p className="font-medium">{issue.title}</p>
                           <p className="text-xs text-muted-foreground">{issue.count} registros afetados</p>
                         </div>
                       </div>
                       <Button size="sm" variant="outline" onClick={() => runFix(issue.id)} disabled={loading}>
                         Corrigir Automaticamente
                       </Button>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="design" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle>Global Design Tokens</CardTitle>
               <CardDescription>Ajuste as variáveis de cor e estilo do sistema em tempo real.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <Label>Matiz Primária (Hue: {primaryHsl.h})</Label>
                     </div>
                     <Slider 
                       value={[primaryHsl.h]} 
                       max={360} 
                       step={1} 
                       onValueChange={([v]) => setPrimaryHsl(p => ({ ...p, h: v }))}
                     />
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <Label>Saturação (Sat: {primaryHsl.s}%)</Label>
                     </div>
                     <Slider 
                       value={[primaryHsl.s]} 
                       max={100} 
                       step={1} 
                       onValueChange={([v]) => setPrimaryHsl(p => ({ ...p, s: v }))}
                     />
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between">
                       <Label>Luminosidade (Lum: {primaryHsl.l}%)</Label>
                     </div>
                     <Slider 
                       value={[primaryHsl.l]} 
                       max={100} 
                       step={1} 
                       onValueChange={([v]) => setPrimaryHsl(p => ({ ...p, l: v }))}
                     />
                   </div>
                 </div>
                 <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-muted/10">
                   <p className="text-sm text-muted-foreground mb-4">Preview do Componente</p>
                   <div className="space-y-4 w-full max-w-[200px]">
                     <Button className="w-full">Botão Primário</Button>
                     <Button variant="outline" className="w-full">Botão Outline</Button>
                     <div className="h-10 w-full rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                       PRIMARY BOX
                     </div>
                   </div>
                 </div>
               </div>
               <div className="flex justify-end pt-4 border-t">
                 <Button onClick={handleSaveTheme} disabled={loading} className="gap-2">
                   <Save className="h-4 w-4" /> Salvar Alterações
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="logs" className="space-y-4">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0">
               <div>
                 <CardTitle>Atividade do Sistema</CardTitle>
                 <CardDescription>Últimas ações realizadas por usuários.</CardDescription>
               </div>
               <Search className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="space-y-0 relative">
                 <div className="absolute left-4 top-0 bottom-0 w-px bg-border ml-[-0.5px]"></div>
                 {logs.map((log, idx) => (
                   <div key={log.id} className="relative pl-10 pb-6 last:pb-0">
                     <div className="absolute left-0 top-1.5 h-8 w-8 rounded-full bg-background border flex items-center justify-center z-10">
                       <Clock className="h-4 w-4 text-muted-foreground" />
                     </div>
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-semibold">{log.acao}</span>
                         <Badge variant="outline" className="text-[10px] uppercase">{log.modulo || "Sistema"}</Badge>
                       </div>
                       <p className="text-xs text-muted-foreground">
                         {new Date(log.created_at).toLocaleString('pt-BR')}
                       </p>
                       {log.dados && (
                         <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-x-auto max-w-full">
                           {JSON.stringify(log.dados, null, 2)}
                         </pre>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="db" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle>Monitoramento de Queries</CardTitle>
               <CardDescription>Status das conexões e performance (Modo Leitura).</CardDescription>
             </CardHeader>
             <CardContent className="h-[300px] flex items-center justify-center border-dashed border-2 rounded-lg text-muted-foreground italic">
               Interface de console protegida. Use logs de auditoria para rastreamento.
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }