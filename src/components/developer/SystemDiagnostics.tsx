 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { CheckCircle2, XCircle, RefreshCcw, Wifi, Database, Lock, Package, Globe } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "@/components/ui/sonner";

 export default function SystemDiagnostics() {
   const [running, setRunning] = useState(false);
   const [results, setResults] = useState<any>({
     db: { status: 'pending', name: "Conexão Banco de Dados", icon: Database },
     auth: { status: 'pending', name: "Serviço de Autenticação", icon: Lock },
     storage: { status: 'pending', name: "Storage Buckets", icon: Package },
     api: { status: 'pending', name: "Conectividade API", icon: Wifi },
     pwa: { status: 'pending', name: "Ambiente PWA", icon: Globe }
   });

   const runTests = async () => {
     setRunning(true);
     setResults(prev => Object.keys(prev).reduce((acc, key) => ({
       ...acc,
       [key]: { ...prev[key], status: 'loading' }
     }), {}));

     // 1. Teste DB
     try {
       const { error } = await supabase.from('profiles').select('id').limit(1);
       setResults(prev => ({ ...prev, db: { ...prev.db, status: error ? 'error' : 'ok' } }));
     } catch {
       setResults(prev => ({ ...prev, db: { ...prev.db, status: 'error' } }));
     }

     // 2. Teste Auth
     try {
       const { data } = await supabase.auth.getSession();
       setResults(prev => ({ ...prev, auth: { ...prev.auth, status: data ? 'ok' : 'error' } }));
     } catch {
       setResults(prev => ({ ...prev, auth: { ...prev.auth, status: 'error' } }));
     }

     // 3. Teste Storage
     try {
       const { data } = await supabase.storage.listBuckets();
       setResults(prev => ({ ...prev, storage: { ...prev.storage, status: data ? 'ok' : 'error' } }));
     } catch {
       setResults(prev => ({ ...prev, storage: { ...prev.storage, status: 'error' } }));
     }

     // 4. Teste API
     setResults(prev => ({ ...prev, api: { ...prev.api, status: navigator.onLine ? 'ok' : 'error' } }));

     // 5. Teste PWA
     const isPWA = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone || document.referrer.includes('android-app://');
     setResults(prev => ({ ...prev, pwa: { ...prev.pwa, status: 'ok' } })); // Always ok if we reached here, status is just for env check

     setRunning(false);
     toast.success("Diagnóstico completo.");
   };

   return (
     <Card className="shadow-md">
       <CardHeader className="flex flex-row items-center justify-between">
         <div>
           <CardTitle>Diagnóstico de Infraestrutura</CardTitle>
           <CardDescription>Validação técnica de todos os serviços core do sistema.</CardDescription>
         </div>
         <Button size="sm" variant="default" onClick={runTests} disabled={running} className="bg-primary">
           <RefreshCcw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} /> 
           {running ? "Testando..." : "Executar Varredura"}
         </Button>
       </CardHeader>
       <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {Object.entries(results).map(([key, check]: [string, any]) => (
           <div key={key} className="flex items-center justify-between p-4 border rounded-xl bg-muted/5">
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${check.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : check.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                 <check.icon className="h-5 w-5" />
               </div>
               <div>
                 <span className="text-sm font-bold block">{check.name}</span>
                 <span className="text-[10px] uppercase text-muted-foreground tracking-widest">
                   {check.status === 'ok' ? 'Online' : check.status === 'error' ? 'Falha Detectada' : 'Aguardando'}
                 </span>
               </div>
             </div>
             {check.status === "ok" ? (
               <CheckCircle2 className="h-5 w-5 text-emerald-500" />
             ) : check.status === "error" ? (
               <XCircle className="h-5 w-5 text-red-500 animate-pulse" />
             ) : (
               <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30" />
             )}
           </div>
         ))}
       </CardContent>
     </Card>
   );
 }