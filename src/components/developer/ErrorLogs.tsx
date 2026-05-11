 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { Bug, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { toast } from "@/components/ui/sonner";

 export default function ErrorLogs() {
   const [errors, setErrors] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   const fetchErrors = async () => {
     setLoading(true);
     try {
       const { data } = await supabase
         .from("system_error_logs")
         .select("*")
         .order("created_at", { ascending: false })
         .limit(50);
       setErrors(data || []);
     } finally {
       setLoading(false);
     }
   };

   useEffect(() => {
     fetchErrors();
     
     // Inscrição em tempo real para novos erros
     const channel = supabase
       .channel('system_errors')
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_error_logs' }, payload => {
         setErrors(prev => [payload.new, ...prev]);
         toast.error("Novo erro sistêmico detectado!");
       })
       .subscribe();

     return () => {
       supabase.removeChannel(channel);
     };
   }, []);

   const handleResolve = async (id: string) => {
     try {
       const { error } = await supabase
         .from("system_error_logs")
         .update({ status: 'resolved', resolved_at: new Date().toISOString() })
         .eq("id", id);
       if (error) throw error;
       setErrors(prev => prev.map(e => e.id === id ? { ...e, status: 'resolved' } : e));
       toast.success("Erro marcado como resolvido.");
     } catch (e) {
       toast.error("Erro ao atualizar status.");
     }
   };

   return (
     <Card className="border-red-100">
       <CardHeader className="flex flex-row items-center justify-between">
         <div>
           <CardTitle className="flex items-center gap-2">
             <Bug className="h-5 w-5 text-red-600" /> Logs de Exceções Sistêmicas
           </CardTitle>
           <CardDescription>Visualização em tempo real de falhas e bugs reportados pelo sistema.</CardDescription>
         </div>
         <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
           <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
         </Button>
       </CardHeader>
       <CardContent>
         {errors.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
             <CheckCircle className="h-12 w-12 mb-4 text-emerald-500 opacity-20" />
             <p>Nenhum erro crítico registrado no momento.</p>
           </div>
         ) : (
           <div className="rounded-md border border-red-100">
             <Table>
               <TableHeader className="bg-red-50/50">
                 <TableRow>
                   <TableHead>Status</TableHead>
                   <TableHead>Mensagem</TableHead>
                   <TableHead>Origem</TableHead>
                   <TableHead>Data</TableHead>
                   <TableHead className="text-right">Ação</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {errors.map((error) => (
                   <TableRow key={error.id} className={error.status === 'open' ? 'bg-red-50/20' : ''}>
                     <TableCell>
                       <Badge variant={error.status === 'open' ? 'destructive' : 'outline'}>
                         {error.status === 'open' ? 'ABERTO' : 'RESOLVIDO'}
                       </Badge>
                     </TableCell>
                     <TableCell className="max-w-[300px] truncate font-medium text-red-900">
                       {error.error_message}
                     </TableCell>
                     <TableCell className="text-xs font-mono">{error.source || 'CLIENT'}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                       {new Date(error.created_at).toLocaleString()}
                     </TableCell>
                     <TableCell className="text-right">
                       {error.status === 'open' && (
                         <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700" onClick={() => handleResolve(error.id)}>
                           <CheckCircle className="h-4 w-4 mr-1" /> Resolver
                         </Button>
                       )}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }