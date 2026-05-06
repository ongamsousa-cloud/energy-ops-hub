 import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
 import { Plus, Filter, Search, Calendar, Archive, EyeOff, CheckCircle2, Clock, CheckCircle, AlertCircle, LayoutDashboard, MoreHorizontal, FileText, MapPin, Building2, User, Briefcase, ListTodo, ChevronRight } from "lucide-react";
 import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Badge } from "@/components/ui/badge";
 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Calendar as CalendarComponent } from "@/components/ui/calendar";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";

 export default function OSList() {
   const { user, hasRole } = useAuth();
   const [rows, setRows] = useState<any[]>([]);
   const [obras, setObras] = useState<any[]>([]);
   const [deps, setDeps] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState("ordens");
   const [filters, setFilters] = useState({
      operational_status: "all",
      financial_status: "all",
      audit_status: "all",
      priority: "all",
      department: "all",
      search: "",
       period: "all",
       showArchived: false,
       dateRange: undefined as DateRange | undefined
    });

   const fetchAll = useCallback(async () => {
     if (!user) return;
     
     // Fetch Departments
     supabase.from("departments").select("id, name").eq("active", true).then(({ data }) => setDeps(data ?? []));
     
     // Fetch OS Rows
     const isCampo = hasRole(["campo"]) && !hasRole(["admin", "gestor", "supervisor", "developer"]);
     let query = supabase.from("ordens_servico")
       .select(`
          *,
          department:departments(name, acronym),
          obra:obras(numero, nome, endereco, cidade, estado, cep, bairro), 
          profissional:profiles!ordens_servico_profissional_id_fkey(nome)
       `);
 
     if (isCampo) {
       query = query.eq("profissional_id", user.id);
     }
 
     query.order("created_at", { ascending: false }).limit(500)
       .then(({ data }) => setRows(data ?? []));
 
     // Fetch Obras
     supabase.from("obras")
       .select("*, os_count:ordens_servico(count)")
       .eq("ativo", true)
       .order("created_at", { ascending: false })
       .then(({ data }) => setObras(data ?? []));
   }, [user, hasRole]);
 
   useEffect(() => {
     fetchAll();
    const ch = supabase
      .channel("os-list-realtime")
       .on("postgres_changes", { event: "*", schema: "public", table: "ordens_servico" }, fetchAll)
       .on("postgres_changes", { event: "*", schema: "public", table: "obras" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
   }, [fetchAll]);

    const filteredRows = useMemo(() => {
      return rows.filter(r => {
        if (!filters.showArchived && r.arquivada) return false;
        if (filters.showArchived && !r.arquivada) return false;

        const matchOp = filters.operational_status === "all" || 
                        r.operational_status?.toLowerCase() === filters.operational_status.toLowerCase() ||
                        r.status?.toLowerCase() === filters.operational_status.toLowerCase();
        const matchFin = filters.financial_status === "all" || r.financial_status === filters.financial_status;
        const matchAudit = filters.audit_status === "all" || r.audit_status?.toLowerCase() === filters.audit_status.toLowerCase();
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
        if (filters.period !== "all") {
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
        }
        return matchOp && matchFin && matchAudit && matchPriority && matchDep && matchSearch && matchPeriod;
       });
     }, [rows, filters]);
 
    const stats = useMemo(() => {
      return {
        total: filteredRows.length,
         pendentes: filteredRows.filter(r => 
           (r.operational_status || r.status)?.toLowerCase() === 'pendente' || 
           (r.operational_status || r.status)?.toLowerCase() === 'aguardando_revisao'
         ).length,
         emExecucao: filteredRows.filter(r => 
           ['em execução', 'iniciada', 'em_execucao', 'em_andamento', 'em_deslocamento', 'chegou_ao_local'].includes((r.operational_status || r.status)?.toLowerCase())
         ).length,
         concluidas: filteredRows.filter(r => 
           ['concluída', 'concluida', 'aprovada', 'aprovada_supervisor', 'aprovada_auditoria'].includes((r.operational_status || r.status)?.toLowerCase())
         ).length,
      };
    }, [filteredRows]);

   const filteredObras = useMemo(() => {
     const searchLower = filters.search.toLowerCase();
     return obras.filter(o => 
       !filters.search || 
       o.numero?.toLowerCase().includes(searchLower) || 
       o.nome?.toLowerCase().includes(searchLower) ||
       o.cliente?.toLowerCase().includes(searchLower)
     );
   }, [obras, filters.search]);
 
   return (
     <div className="flex flex-col gap-6">
       <PageHeader title="Gestão de Operações" actions={
         <div className="flex gap-2">
           <Link to="/app/obras"><Button variant="outline" size="sm"><Briefcase className="mr-1 h-3.5 w-3.5"/>Ver Obras</Button></Link>
           <Link to="/app/os/nova"><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Iniciar OS</Button></Link>
         </div>
       } />
 
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <div className="flex items-center justify-between mb-4 bg-muted/30 p-1 rounded-lg border">
           <TabsList className="grid grid-cols-2 w-full max-w-md">
             <TabsTrigger value="ordens" className="gap-2">
               <ListTodo className="h-4 w-4" />
               Ordens de Serviço
             </TabsTrigger>
             <TabsTrigger value="obras" className="gap-2">
               <Briefcase className="h-4 w-4" />
               Obras Cadastradas
             </TabsTrigger>
           </TabsList>
         </div>
 
         <TabsContent value="ordens" className="space-y-6 mt-0">
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
 
           <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-end bg-muted/20 p-4 rounded-lg border">
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
             <label className="text-xs font-medium text-muted-foreground">Status Financeiro</label>
             <Select value={filters.financial_status} onValueChange={(v) => setFilters(f => ({ ...f, financial_status: v }))}>
               <SelectTrigger><SelectValue placeholder="Financeiro" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos</SelectItem>
                 <SelectItem value="pendente">Pendente</SelectItem>
                 <SelectItem value="faturavel">Faturável</SelectItem>
                 <SelectItem value="faturado">Faturado</SelectItem>
               </SelectContent>
             </Select>
           </div>

           <div className="space-y-1.5">
             <label className="text-xs font-medium text-muted-foreground">Status Auditoria</label>
             <Select value={filters.audit_status} onValueChange={(v) => setFilters(f => ({ ...f, audit_status: v }))}>
               <SelectTrigger><SelectValue placeholder="Auditoria" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos</SelectItem>
                 <SelectItem value="pendente_auditoria">Pendente</SelectItem>
                 <SelectItem value="aprovada_na_auditoria">Aprovada</SelectItem>
                 <SelectItem value="reprovada_na_auditoria">Reprovada</SelectItem>
               </SelectContent>
             </Select>
           </div>

           <div className="space-y-1.5">
             <label className="text-xs font-medium text-muted-foreground">Status Operacional</label>
             <Select value={filters.operational_status} onValueChange={(v) => setFilters(f => ({ ...f, operational_status: v }))}>
               <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aguardando_aprovacao_departamento">Aguard. Departamento</SelectItem>
                  <SelectItem value="aguardando_liberacao_estoque">Aguard. Estoque</SelectItem>
                  <SelectItem value="material_liberado">Material Liberado</SelectItem>
                  <SelectItem value="pronta_para_execucao">Pronta p/ Execução</SelectItem>
                  <SelectItem value="iniciada">Iniciada</SelectItem>
                  <SelectItem value="em_deslocamento">Em deslocamento</SelectItem>
                  <SelectItem value="chegou_ao_local">No Local</SelectItem>
                  <SelectItem value="em_execucao">Em execução</SelectItem>
                  <SelectItem value="aguardando_validacao_supervisor">Aguard. Validação</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
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
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">N° OS</th>
                  <th className="px-4 py-3 text-left">Obra / Cliente</th>
                  <th className="px-4 py-3 text-left">Localização</th>
                  <th className="px-4 py-3 text-left">Setor</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-accent/30 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="font-mono font-bold text-primary text-xs">{r.numero || `OS-${r.id.substring(0,6).toUpperCase()}`}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground line-clamp-1">{r.obra?.nome || r.titulo || "Sem nome"}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{r.obra?.cliente || "Consumidor Final"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs line-clamp-1">
                          {r.cidade || r.obra?.cidade || '---'}, {r.bairro || r.obra?.bairro || '---'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {r.department?.name ? (
                        <Badge variant="outline" className="text-[10px] font-medium border-primary/20 bg-primary/5 text-primary">
                          {r.department.acronym || r.department.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Geral</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={r.operational_status || r.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações da OS</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/app/os/${r.id}`} className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" /> Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/app/obras/${r.obra_id}`} className="flex items-center">
                              <Building2 className="mr-2 h-4 w-4" /> Ver Obra
                            </Link>
                          </DropdownMenuItem>
                          {r.profissional_id && (
                            <DropdownMenuItem className="flex items-center">
                              <User className="mr-2 h-4 w-4" /> Profissional: {r.profissional?.nome || "Carregando..."}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}