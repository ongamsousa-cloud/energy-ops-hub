 import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
  import { Plus, Filter, Search, Calendar, Archive, EyeOff, CheckCircle2, Clock, CheckCircle, AlertCircle, LayoutDashboard } from "lucide-react";
 import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Badge } from "@/components/ui/badge";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Calendar as CalendarComponent } from "@/components/ui/calendar";
 import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";

export default function OSList() {
  const { user, hasRole } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
    const [filters, setFilters] = useState({
      operational_status: "all",
      financial_status: "all",
      audit_status: "all",
      priority: "all",
      department: "all",
      search: "",
       period: "month",
       showArchived: false,
       dateRange: undefined as DateRange | undefined
    });

  useEffect(() => {
    if (!user) return;

     // Técnicos (campo) só veem suas próprias OS
      const isTechnician = hasRole("campo") && !hasRole(["admin", "gestor", "supervisor"]);
      const isSupervisor = hasRole("supervisor") && !hasRole(["admin", "gestor"]);
    
    const fetchRows = () => {
      supabase.from("departments").select("id, name").eq("active", true).then(({ data }) => setDeps(data ?? []));
       let query = supabase.from("ordens_servico")
        .select(`
           *,
           department:departments(name),
          obra:obras(numero, nome, endereco, cidade, estado, cep, bairro), 
          profissional:profiles!ordens_servico_profissional_id_fkey(nome)
        `);

      if (isTechnician) query = query.eq("profissional_id", user.id);
      else if (isSupervisor) query = query.eq("assigned_supervisor_id", user.id);
      query.order("created_at", { ascending: false }).limit(200)
        .then(({ data }) => setRows(data ?? []));
    };
    fetchRows();
    const ch = supabase
      .channel("os-list-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ordens_servico" }, fetchRows)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, hasRole]);

    const filteredRows = useMemo(() => {
      return rows.filter(r => {
        if (!filters.showArchived && r.arquivada) return false;
        if (filters.showArchived && !r.arquivada) return false;

        const matchOp = filters.operational_status === "all" || (r.operational_status || r.status) === filters.operational_status;
        const matchFin = filters.financial_status === "all" || r.financial_status === filters.financial_status;
        const matchAudit = filters.audit_status === "all" || r.audit_status === filters.audit_status;
        const matchPriority = filters.priority === "all" || r.prioridade === filters.priority;
        const matchDep = filters.department === "all" || r.department_id === filters.department;
        const searchLower = filters.search.toLowerCase();
        const matchSearch = !filters.search || 
          r.numero?.toString().toLowerCase().includes(searchLower) ||
          r.obra?.nome?.toLowerCase().includes(searchLower) ||
          r.cidade?.toLowerCase().includes(searchLower) ||
          r.endereco?.toLowerCase().includes(searchLower) ||
          r.bairro?.toLowerCase().includes(searchLower);

        let matchPeriod = true;
        const createdAt = new Date(r.created_at);
        const now = new Date();
         if (filters.period === "today") {
           matchPeriod = createdAt.toDateString() === now.toDateString();
         } else if (filters.period === "week") {
           const weekAgo = new Date();
           weekAgo.setDate(now.getDate() - 7);
           matchPeriod = createdAt >= weekAgo;
         } else if (filters.period === "month") {
           matchPeriod = createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
         } else if (filters.period === "custom" && filters.dateRange?.from) {
           const start = startOfDay(filters.dateRange.from);
           const end = filters.dateRange.to ? endOfDay(filters.dateRange.to) : endOfDay(filters.dateRange.from);
           matchPeriod = isWithinInterval(createdAt, { start, end });
         }
         return matchOp && matchFin && matchAudit && matchPriority && matchDep && matchSearch && matchPeriod;
       });
     }, [rows, filters]);
 
    const stats = useMemo(() => {
      return {
        total: filteredRows.length,
        pendentes: filteredRows.filter(r => (r.operational_status || r.status) === 'Pendente').length,
        emExecucao: filteredRows.filter(r => (r.operational_status || r.status) === 'Em execução' || (r.operational_status || r.status) === 'Iniciada').length,
        concluidas: filteredRows.filter(r => (r.operational_status || r.status) === 'Concluída').length,
      };
    }, [filteredRows]);

  return (
     <div className="flex flex-col gap-6">
      <PageHeader title="Gestão de Ordens de Serviço" actions={
        <Link to="/app/os/nova"><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Iniciar OS</Button></Link>
      } />

        {/* Dashboards Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground mb-1">
              <LayoutDashboard className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium">Total Filtrado</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">Pendentes</span>
            </div>
            <div className="text-2xl font-bold">{stats.pendentes}</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-medium">Iniciadas / Em Execução</span>
            </div>
            <div className="text-2xl font-bold">{stats.emExecucao}</div>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium">Concluídas</span>
            </div>
            <div className="text-2xl font-bold">{stats.concluidas}</div>
          </div>
        </div>
 
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 items-end bg-muted/20 p-4 rounded-lg border">
          <div className="space-y-1.5 lg:col-span-2">
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
           <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Período</label>
            <div className="flex gap-2">
              <Select value={filters.period} onValueChange={(v) => setFilters(f => ({ ...f, period: v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {filters.period === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className={cn("shrink-0", filters.dateRange && "text-primary border-primary")}>
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={filters.dateRange?.from}
                      selected={filters.dateRange}
                      onSelect={(range) => setFilters(f => ({ ...f, dateRange: range }))}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
           <div className="space-y-1.5">
             <label className="text-xs font-medium text-muted-foreground">Status Operacional</label>
             <Select value={filters.operational_status} onValueChange={(v) => setFilters(f => ({ ...f, operational_status: v }))}>
               <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente / Aceite</SelectItem>
                  <SelectItem value="Iniciada">Iniciada</SelectItem>
                  <SelectItem value="Em deslocamento">Em deslocamento</SelectItem>
                  <SelectItem value="Em execução">Em execução</SelectItem>
                  <SelectItem value="Aguardando validação">Aguardando validação</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-1.5">
             <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
             <Select value={filters.priority} onValueChange={(v) => setFilters(f => ({ ...f, priority: v }))}>
               <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todas</SelectItem>
                 <SelectItem value="baixa">Baixa</SelectItem>
                 <SelectItem value="media">Média</SelectItem>
                 <SelectItem value="alta">Alta</SelectItem>
                 <SelectItem value="critica">Crítica</SelectItem>
               </SelectContent>
             </Select>
           </div>

          <div className="space-y-1.5">
             <label className="text-xs font-medium text-muted-foreground">Departamento</label>
             <Select value={filters.department} onValueChange={(v) => setFilters(f => ({ ...f, department: v }))}>
               <SelectTrigger><SelectValue placeholder="Setor" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os Setores</SelectItem>
                 {deps.map(d => (
                   <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Visualização</label>
            <Button 
              variant={filters.showArchived ? "secondary" : "outline"} 
              size="sm" 
              className="w-full h-10 gap-2"
              onClick={() => setFilters(f => ({ ...f, showArchived: !f.showArchived }))}
            >
              {filters.showArchived ? <EyeOff className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {filters.showArchived ? "Ver Ativas" : "Ver Arquivadas"}
            </Button>
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">{r.obra?.nome}</h3>
                    {r.department?.name && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1">{r.department.name}</Badge>
                    )}
                  </div>
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