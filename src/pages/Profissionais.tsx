import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
 import { ROLE_LABEL, AppRole, useAuth } from "@/lib/auth";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
  import { Card, CardContent } from "@/components/ui/card";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, Search, MoreHorizontal, Settings, Key, UserMinus, Pencil, Download, Filter, FileSpreadsheet, FileText, CheckCircle2, XCircle, AlertCircle, Clock, ClipboardList, Activity, Users, UserCheck, UserX, UserMinus as UserAfastado } from "lucide-react";
  import ProfessionalModal from "@/components/professional/ProfessionalModal";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { 
   DropdownMenu, 
   DropdownMenuContent, 
   DropdownMenuItem, 
   DropdownMenuLabel, 
   DropdownMenuSeparator, 
   DropdownMenuTrigger 
 } from "@/components/ui/dropdown-menu";

 const ROLES: AppRole[] = ["admin", "gestor", "supervisor", "campo", "financeiro", "auditor", "estoque", "developer"];

 export default function Profissionais() {
   const [rows, setRows] = useState<any[]>([]);
   const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
   const [search, setSearch] = useState("");
   const [modalOpen, setModalOpen] = useState(false);
   const [selectedProf, setSelectedProf] = useState<any>(null);
  async function load() {
     const { data: employees } = await supabase
       .from("employees")
       .select("*, departments(id, name)");

     const { data: profiles } = await supabase
       .from("profiles")
       .select("*, user_roles(role), departments(id, name)")
       .order("nome");

      // Combinar dados garantindo que campos de profiles sobrescrevam funcionários apenas se existirem
        const combined = (employees ?? []).map(emp => {
          const p = (profiles ?? []).find(pr => pr.id === emp.user_id || (emp.email && pr.email === emp.email));
          // Preferir dados do funcionário (employees) como fonte da verdade para dados cadastrais, 
          // já que o RH/Gestor edita esses campos prioritariamente.
          return {
            ...emp,
            profile_id: p?.id || null,
            employee_id: emp.id,
            nome: emp.full_name || p?.nome || "",
            email: emp.email || p?.email || "",
            cargo: emp.job_title || p?.cargo || "",
            cpf: emp.document_cpf || p?.cpf || "",
            rg: emp.document_rg || p?.rg || "",
            telefone: emp.phone || p?.telefone || "",
            birth_date: emp.birth_date || p?.data_nascimento || "",
            admission_date: emp.admission_date || p?.data_admissao || "",
            postal_code: emp.postal_code || p?.cep || "",
            residential_address: emp.residential_address || p?.endereco_residencial || "",
            neighborhood: emp.neighborhood || p?.bairro || "",
            city: emp.city || p?.cidade || "",
            state: emp.state || p?.estado || "",
            // Keep compatibility for modal's expected field names
            data_nascimento: emp.birth_date || p?.data_nascimento || "",
            data_admissao: emp.admission_date || p?.data_admissao || "",
            cep: emp.postal_code || p?.cep || "",
            endereco_residencial: emp.residential_address || p?.endereco_residencial || "",
            bairro: emp.neighborhood || p?.bairro || "",
            cidade: emp.city || p?.cidade || "",
            estado: emp.state || p?.estado || "",
            department_id: emp.department_id || p?.department_id || "",
            foto_url: emp.photo_url || p?.foto_url || null,
            user_roles: p?.user_roles || []
          };
        });
     
     setRows(combined);
    const { data: depts } = await supabase.from("departments").select("id,name").eq("active", true).order("name");
    setDepartments(depts ?? []);
  }
  useEffect(() => { load(); }, []);
   async function setRole(uid: string, role: AppRole) {
     const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", uid);
     if (deleteError) {
       toast.error("Erro ao remover cargo anterior");
       return;
     }
     const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as any });
     if (error) toast.error(error.message); else { toast.success("Perfil de acesso atualizado"); load(); }
   }

   async function handleDelete(p: any) {
     const confirmDelete = window.confirm(`Deseja realmente excluir o profissional ${p.nome}? Esta ação não pode ser desfeita.`);
     if (!confirmDelete) return;

     try {
       const { error: empError } = await supabase.from("employees").delete().eq("id", p.employee_id);
       if (empError) throw empError;
       
       toast.success("Profissional excluído com sucesso");
       load();
     } catch (error: any) {
       console.error("Erro ao deletar:", error);
       toast.error("Erro ao excluir profissional: " + error.message);
     }
   }

    async function toggleStatus(p: any) {
      const newStatus = p.status === 'active' ? 'inactive' : 'active';
      const isActive = newStatus === 'active';
      try {
        const { error: empError } = await supabase
          .from("employees")
          .update({ status: newStatus, is_active: isActive })
          .eq("id", p.employee_id);
        
        if (empError) throw empError;

        if (p.profile_id) {
          await supabase.from("profiles").update({ ativo: isActive }).eq("id", p.profile_id);
        }
        
        toast.success(`Status alterado para ${isActive ? 'Ativo' : 'Inativo'}`);
        load();
      } catch (error: any) {
        toast.error("Erro ao alterar status: " + error.message);
      }
    }
    const stats = {
      total: rows.length,
      active: rows.filter(r => r.status === 'active').length,
      inactive: rows.filter(r => r.status === 'inactive').length,
      afastado: rows.filter(r => r.status === 'afastado' || r.status === 'blocked').length
    };

    const filteredRows = rows.filter(p => {
      const s = search.toLowerCase();
      return (
        p.nome?.toLowerCase().includes(s) || 
        p.email?.toLowerCase().includes(s) ||
        p.cargo?.toLowerCase().includes(s) ||
        p.cpf?.toLowerCase().includes(s) ||
        p.rg?.toLowerCase().includes(s) ||
        p.internal_company_code?.toLowerCase().includes(s) ||
        p.service_code?.toLowerCase().includes(s)
      );
    });

   const getStatusIcon = (status: string) => {
     switch (status) {
       case 'active': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
       case 'inactive': return <XCircle className="h-3 w-3 text-red-500" />;
       case 'blocked': return <AlertCircle className="h-3 w-3 text-amber-500" />;
       case 'vacation': return <Clock className="h-3 w-3 text-blue-500" />;
       default: return null;
     }
   };

   const openEdit = (prof: any) => {
     setSelectedProf(prof);
     setModalOpen(true);
   };

   const openNew = () => {
     setSelectedProf(null);
     setModalOpen(true);
   };

   return (
     <div className="space-y-6">
       <PageHeader 
          title="Gestão de Funcionários" 
          description="Controle central de equipe, permissões e dados profissionais." 
           actions={
             <div className="flex gap-2">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="outline" size="sm" className="gap-2">
                     <Download className="h-4 w-4" /> Exportar
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem className="gap-2"><FileSpreadsheet className="h-4 w-4" /> CSV</DropdownMenuItem>
                   <DropdownMenuItem className="gap-2"><FileText className="h-4 w-4" /> PDF</DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
               <Button onClick={openNew} size="sm" className="gap-2">
                 <UserPlus className="h-4 w-4" /> Novo Funcionário
               </Button>
             </div>
           }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><Users className="h-4 w-4 text-primary" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg"><UserCheck className="h-4 w-4 text-green-600" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Ativos</p><p className="text-xl font-bold">{stats.active}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/5 border-red-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-lg"><UserX className="h-4 w-4 text-red-600" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Inativos</p><p className="text-xl font-bold">{stats.inactive}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-lg"><UserAfastado className="h-4 w-4 text-amber-600" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Afastados</p><p className="text-xl font-bold">{stats.afastado}</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-lg border shadow-sm">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
              placeholder="Buscar por nome, e-mail, cargo, CPF ou códigos (FUNC / TEC)..." 
             className="pl-9"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
         </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
       </div>

       {filteredRows.length === 0 ? <EmptyState title="Nenhum profissional encontrado" /> : (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
           <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
               <tr>
                  <th className="px-4 py-3 w-12 text-center">Foto</th>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Identificação</th>
                  <th className="px-4 py-3">Cargo / Setor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 w-40">Perfil de Acesso</th>
                  <th className="px-4 py-3 w-12">Ações</th>
               </tr>
             </thead>
             <tbody>{filteredRows.map((p)=>{ const role = p.user_roles?.[0]?.role as AppRole | undefined; return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3">
                    <Avatar className="h-10 w-10 border shadow-sm mx-auto">
                       <AvatarImage src={p.foto_url || p.photo_url} className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {p.nome?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                 </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm leading-tight">{p.nome}</span>
                      <span className="text-[11px] text-muted-foreground">{p.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-[10px] font-mono h-5 w-fit bg-muted/30">
                        {p.internal_company_code || "FUNC-????"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono h-5 w-fit border-primary/20 text-primary">
                        {p.service_code || "TEC-???"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">{p.cargo ?? "Sem cargo"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{p.departments?.name ?? "Setor não definido"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {getStatusIcon(p.status)}
                      <span className="text-[11px] font-medium capitalize">{p.status === 'active' ? 'Ativo' : p.status === 'inactive' ? 'Inativo' : p.status === 'blocked' ? 'Bloqueado' : 'Férias'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={role ?? "campo"} onValueChange={(v)=>setRole(p.id, v as AppRole)}>
                      <SelectTrigger className="h-8 text-xs bg-muted/30 border-none shadow-none focus:ring-0">
                        <SelectValue/>
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r)=>(<SelectItem key={r} value={r} className="text-xs">{ROLE_LABEL[r]}</SelectItem>))}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground bg-muted/50 border shadow-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(p)} className="gap-2">
                          <Pencil className="h-4 w-4" /> Ver Perfil / Editar
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleDelete(p)} className="gap-2 text-destructive">
                           <UserMinus className="h-4 w-4" /> Excluir Profissional
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                          <ClipboardList className="h-4 w-4" /> Ordens de Serviço
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Activity className="h-4 w-4" /> Ver Histórico
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
              </tr>
            );})}</tbody>
          </table>
        </div>
       )}

       <ProfessionalModal 
         open={modalOpen} 
         onOpenChange={setModalOpen} 
         onSuccess={load} 
         professional={selectedProf}
         departments={departments}
       />
     </div>
   );
}