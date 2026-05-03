 import { useEffect, useState, useMemo } from "react";
 import { Link } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import PageHeader from "@/components/PageHeader";
 import StatusBadge from "@/components/StatusBadge";
 import EmptyState from "@/components/EmptyState";
 import { useAuth } from "@/lib/auth";
 import { Input } from "@/components/ui/input";
 import { Search, CheckCircle, Clock, AlertTriangle } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
 
 export default function Aprovacoes() {
   const { user, hasRole } = useAuth();
   const [rows, setRows] = useState<any[]>([]);
   const [search, setSearch] = useState("");
 
   useEffect(() => {
     const isSupervisor = hasRole("supervisor") && !hasRole(["admin", "gestor"]);
     
     let query = supabase.from("ordens_servico")
       .select("*, obra:obras(numero,nome), profissional:profiles!ordens_servico_profissional_id_fkey(nome)")
       .in("status", ["aguardando_revisao","corrigida","em_revisao"]);
 
     if (isSupervisor) {
       query = query.eq("assigned_supervisor_id", user?.id);
     }
 
     query.order("fim_em", { ascending: true })
       .then(({ data }) => setRows(data ?? []));
   }, [user, hasRole]);
 
   const filteredRows = useMemo(() => {
     return rows.filter(r => 
       r.numero?.toLowerCase().includes(search.toLowerCase()) ||
       r.obra?.nome?.toLowerCase().includes(search.toLowerCase()) ||
       r.profissional?.nome?.toLowerCase().includes(search.toLowerCase())
     );
   }, [rows, search]);
 
   const stats = useMemo(() => {
     return {
       total: rows.length,
       urgent: rows.filter(r => r.prioridade === 'alta' || r.prioridade === 'urgente').length,
       waiting: rows.filter(r => r.status === 'aguardando_revisao').length
     };
   }, [rows]);
 
   return (
     <div className="flex flex-col gap-6">
       <PageHeader title="Validação Técnica" description="Análise e aprovação de execuções em campo." />
 
       <div className="grid gap-4 sm:grid-cols-3">
         <Card className="border-none shadow-sm bg-blue-50/50">
           <CardContent className="p-4 flex items-center gap-3">
             <div className="p-2 bg-blue-100 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
             <div>
               <p className="text-xs text-muted-foreground font-medium uppercase">Aguardando</p>
               <p className="text-2xl font-bold">{stats.waiting}</p>
             </div>
           </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-orange-50/50">
           <CardContent className="p-4 flex items-center gap-3">
             <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
             <div>
               <p className="text-xs text-muted-foreground font-medium uppercase">Urgentes</p>
               <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
             </div>
           </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-green-50/50">
           <CardContent className="p-4 flex items-center gap-3">
             <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
             <div>
               <p className="text-xs text-muted-foreground font-medium uppercase">Total Pendente</p>
               <p className="text-2xl font-bold">{stats.total}</p>
             </div>
           </CardContent>
         </Card>
       </div>
 
       <div className="relative">
         <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
         <Input 
           placeholder="Filtrar por OS, obra ou profissional..." 
           className="pl-10"
           value={search}
           onChange={(e) => setSearch(e.target.value)}
         />
       </div>
 
       {filteredRows.length === 0 ? <EmptyState title="Tudo em dia" description="Nenhuma OS aguardando validação no momento." /> : (
         <div className="grid gap-4">
           {filteredRows.map((r) => (
             <Link key={r.id} to={`/app/os/${r.id}`} className="group">
               <Card className="border-border hover:border-primary/50 transition-all overflow-hidden">
                 <div className="flex flex-col md:flex-row">
                   <div className={cn(
                     "w-2 md:w-1.5 shrink-0",
                     r.prioridade === 'urgente' ? "bg-red-500" : 
                     r.prioridade === 'alta' ? "bg-orange-500" : "bg-blue-500"
                   )} />
                   <CardContent className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <span className="font-mono text-sm font-bold text-primary">{r.numero}</span>
                         <Badge variant="outline" className="text-[10px] uppercase">{r.prioridade || 'MÉDIA'}</Badge>
                         <StatusBadge status={r.status}/>
                       </div>
                       <h3 className="font-semibold">{r.obra?.nome}</h3>
                       <p className="text-sm text-muted-foreground">Executado por: <span className="text-foreground font-medium">{r.profissional?.nome}</span></p>
                     </div>
                     
                     <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 text-right">
                       <div className="text-sm font-bold">{Number(r.total_umd ?? 0).toFixed(2)} UMD</div>
                       <div className="text-xs text-muted-foreground">Finalizada em {r.fim_em ? new Date(r.fim_em).toLocaleDateString() : '—'}</div>
                       <Badge variant="secondary" className="mt-1 md:mt-0 font-normal">Ver Detalhes</Badge>
                     </div>
                   </CardContent>
                 </div>
               </Card>
             </Link>
           ))}
         </div>
       )}
     </div>
   );
 }