 import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
 import { Plus, Filter, Search, Calendar } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/lib/auth";

export default function OSList() {
  const { user, hasRole } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
   const [filters, setFilters] = useState({
     status: "all",
     priority: "all",
     search: ""
   });

  useEffect(() => {
    if (!user) return;

     // Técnicos (campo) só veem suas próprias OS
      const isTechnician = hasRole("campo") && !hasRole(["admin", "gestor", "supervisor"]);
      const isSupervisor = hasRole("supervisor") && !hasRole(["admin", "gestor"]);
    
    let query = supabase.from("ordens_servico")
       .select(`
         *, 
         obra:obras(numero, nome, endereco, cidade, estado), 
         profissional:profiles!ordens_servico_profissional_id_fkey(nome)
       `);

      if (isTechnician) {
      query = query.eq("profissional_id", user.id);
      } else if (isSupervisor) {
        query = query.eq("assigned_supervisor_id", user.id);
    }

    query.order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, [user, hasRole]);

   const filteredRows = useMemo(() => {
     return rows.filter(r => {
       const matchStatus = filters.status === "all" || r.status === filters.status;
       const matchPriority = filters.priority === "all" || r.prioridade === filters.priority;
       const searchLower = filters.search.toLowerCase();
       const matchSearch = !filters.search || 
         r.numero?.toLowerCase().includes(searchLower) ||
         r.obra?.nome?.toLowerCase().includes(searchLower) ||
         r.cidade?.toLowerCase().includes(searchLower) ||
         r.bairro?.toLowerCase().includes(searchLower);
       
       return matchStatus && matchPriority && matchSearch;
     });
   }, [rows, filters]);

  return (
     <div className="flex flex-col gap-6">
      <PageHeader title="Ordens de Serviço" actions={
        <Link to="/app/os/nova"><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Iniciar OS</Button></Link>
      } />

       <div className="grid gap-4 md:grid-cols-4 items-end">
         <div className="space-y-1.5">
           <label className="text-xs font-medium text-muted-foreground">Pesquisa</label>
           <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Número, obra ou local..." 
               className="pl-9"
               value={filters.search}
               onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
             />
           </div>
         </div>
         <div className="space-y-1.5">
           <label className="text-xs font-medium text-muted-foreground">Status</label>
           <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
             <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todos os Status</SelectItem>
               <SelectItem value="pendente">Pendente</SelectItem>
               <SelectItem value="iniciada">Em deslocamento</SelectItem>
               <SelectItem value="em_andamento">Em execução</SelectItem>
               <SelectItem value="aguardando_revisao">Aguardando validação</SelectItem>
               <SelectItem value="aprovada">Concluída</SelectItem>
               <SelectItem value="reprovada">Reprovada</SelectItem>
             </SelectContent>
           </Select>
         </div>
         <div className="space-y-1.5">
           <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
           <Select value={filters.priority} onValueChange={(v) => setFilters(f => ({ ...f, priority: v }))}>
             <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todas as Prioridades</SelectItem>
               <SelectItem value="baixa">Baixa</SelectItem>
               <SelectItem value="media">Média</SelectItem>
               <SelectItem value="alta">Alta</SelectItem>
               <SelectItem value="urgente">Urgente</SelectItem>
             </SelectContent>
           </Select>
         </div>
       </div>

       {filteredRows.length === 0 ? (
         <EmptyState title="Nenhuma OS encontrada" description="Tente ajustar os filtros ou pesquisar por outro termo." />
       ) : (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {filteredRows.map((r) => (
             <Link key={r.id} to={`/app/os/${r.id}`} className="block group">
               <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                 <div className="flex justify-between items-start mb-3">
                   <div className="font-mono text-xs font-bold text-primary">{r.numero}</div>
                   <StatusBadge status={r.status} />
                 </div>
                 <h3 className="font-semibold text-sm line-clamp-1 mb-1">{r.obra?.nome}</h3>
                 <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                   {r.cidade || r.obra?.cidade || 'Local não informado'} · {r.bairro || r.obra?.bairro || 'Bairro'}
                 </p>
                 <div className="flex items-center justify-between pt-3 border-t border-border/50">
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                     <Calendar className="h-3.5 w-3.5" />
                     {new Date(r.created_at).toLocaleDateString()}
                   </div>
                   <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                     {r.prioridade?.toUpperCase() || 'MÉDIA'}
                   </div>
                 </div>
               </div>
             </Link>
           ))}
         </div>
       )}
    </div>
  );
}