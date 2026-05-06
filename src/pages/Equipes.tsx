import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import { Plus, Users, Shield, MapPin, Search, UserCheck, UserPlus } from "lucide-react";
import ProfessionalModal from "@/components/professional/ProfessionalModal";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Equipes() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [deps, setDeps] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ nome: "", codigo: "", regiao: "", department_id: "" });

  async function load() { 
    const { data } = await supabase.from("equipes").select("*, department:departments(name), equipe_membros(profissional_id)").order("nome"); 
    setRows(data ?? []); 
    const { data: d } = await supabase.from("departments").select("id, name").eq("active", true);
    setDeps(d ?? []);
    const { data: p } = await supabase.from("employees").select("id, full_name").eq("status", "active").order("full_name");
    setProfs(p ?? []);
  }

  useEffect(() => { load(); }, []);
  async function save() {
    if (!form.nome) return toast.error("Nome obrigatório");
    
    let equipeId = selectedEquipeId;
    
    if (equipeId) {
      const { error } = await supabase.from("equipes").update({
        ...form,
        department_id: form.department_id === "" ? null : form.department_id
      }).eq("id", equipeId);
      if (error) return toast.error(error.message);
      
      // Atualizar membros
      await supabase.from("equipe_membros").delete().eq("equipe_id", equipeId);
    } else {
      const { data: equipe, error } = await supabase.from("equipes").insert({
        ...form,
        department_id: form.department_id === "" ? null : form.department_id
      }).select().single();
      if (error) return toast.error(error.message);
      equipeId = equipe.id;
    }

    if (selectedMembers.length > 0 && equipeId) {
      const members = selectedMembers.map(pid => ({
        equipe_id: equipeId,
        profissional_id: pid
      }));
      const { error: mErr } = await supabase.from("equipe_membros").insert(members);
      if (mErr) toast.error("Erro ao adicionar membros: " + mErr.message);
    }

    setOpen(false); 
    setForm({ nome: "", codigo: "", regiao: "", department_id: "" });
    setSelectedMembers([]);
    setSelectedEquipeId(null);
    load();
    toast.success(selectedEquipeId ? "Equipe atualizada!" : "Equipe criada!");
  }

  const openNew = () => {
    setSelectedEquipeId(null);
    setForm({ nome: "", codigo: "", regiao: "", department_id: "" });
    setSelectedMembers([]);
    setOpen(true);
  };

  const openEdit = (equipe: any) => {
    setSelectedEquipeId(equipe.id);
    setForm({ 
      nome: equipe.nome, 
      codigo: equipe.codigo || "", 
      regiao: equipe.regiao || "", 
      department_id: equipe.department_id || "" 
    });
    setSelectedMembers(equipe.equipe_membros?.map((m: any) => m.profissional_id) || []);
    setOpen(true);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

   return (
     <div className="space-y-6">
       <PageHeader 
         title="Gestão de Equipes Operacionais" 
         description="Organize seus profissionais em equipes por departamento e região."
         actions={
           <Button size="sm" onClick={openNew} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold gap-2">
             <Plus className="h-4 w-4"/>Cadastrar Nova Equipe
           </Button>
         } 
       />
 
       <Dialog open={open} onOpenChange={setOpen}>
           <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
             <DialogHeader className="p-8 bg-primary text-primary-foreground relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                 <Users className="h-32 w-32" />
               </div>
               <div className="relative z-10">
                 <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                   {selectedEquipeId ? "Configurar Equipe" : "Nova Equipe Operacional"}
                 </DialogTitle>
                 <p className="text-primary-foreground/70 text-sm mt-1">Defina os membros e a alocação da equipe.</p>
               </div>
             </DialogHeader>
             
             <div className="p-8 space-y-5 bg-background overflow-y-auto max-h-[60vh]">
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da Equipe *</Label>
                 <Input 
                   className="h-11 border-primary/10 focus-visible:ring-primary/20" 
                   value={form.nome} 
                   onChange={(e)=>setForm({...form, nome: e.target.value})}
                   placeholder="Ex: Equipe Alfa - Elétrica"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código</Label>
                   <Input 
                     className="h-11 border-primary/10 font-mono font-bold uppercase" 
                     value={form.codigo} 
                     onChange={(e)=>setForm({...form, codigo: e.target.value})}
                     placeholder="EQ-01"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Região</Label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input 
                       className="pl-9 h-11 border-primary/10" 
                       value={form.regiao} 
                       onChange={(e)=>setForm({...form, regiao: e.target.value})}
                       placeholder="Ex: Sul"
                     />
                   </div>
                 </div>
               </div>
               
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Setor / Departamento</Label>
                 <Select value={form.department_id} onValueChange={(v)=>setForm({...form, department_id: v})}>
                   <SelectTrigger className="h-11 border-primary/10">
                     <SelectValue placeholder="Selecione o setor" />
                   </SelectTrigger>
                   <SelectContent>
                     {deps.map((d) => (
                       <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
 
               <div className="space-y-3 pt-4 border-t border-dashed">
                 <div className="flex items-center justify-between">
                   <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Membros da Equipe</Label>
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="h-8 text-[10px] font-bold uppercase tracking-tight text-primary hover:bg-primary/5 gap-1.5 px-3 border border-primary/10"
                     onClick={() => setProfModalOpen(true)}
                   >
                     <UserPlus className="h-3 w-3" /> Adicionar Profissional
                   </Button>
                 </div>
                 
                 <ScrollArea className="h-[180px] rounded-xl border border-muted bg-muted/20 p-3 shadow-inner">
                   <div className="space-y-2">
                     {profs.length === 0 ? (
                       <div className="flex flex-col items-center py-8 text-muted-foreground">
                         <Users className="h-8 w-8 opacity-10 mb-2" />
                         <p className="text-xs font-medium italic">Nenhum profissional disponível.</p>
                       </div>
                     ) : (
                       profs.map((p) => (
                         <div key={p.id} className={cn(
                           "flex items-center space-x-3 p-2 rounded-lg transition-all border border-transparent",
                           selectedMembers.includes(p.id) ? "bg-primary/5 border-primary/10 shadow-sm" : "hover:bg-background"
                         )}>
                           <Checkbox 
                             id={`member-${p.id}`} 
                             checked={selectedMembers.includes(p.id)}
                             onCheckedChange={() => toggleMember(p.id)}
                             className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                           />
                           <label 
                             htmlFor={`member-${p.id}`}
                             className="text-sm font-bold leading-none cursor-pointer flex-1"
                           >
                             {p.full_name}
                           </label>
                         </div>
                       ))
                     )}
                   </div>
                 </ScrollArea>
               </div>
             </div>
             
             <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3">
               <Button variant="ghost" className="px-6 font-semibold" onClick={() => setOpen(false)}>Cancelar</Button>
               <Button className="px-10 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={save}>
                 {selectedEquipeId ? "Atualizar Equipe" : "Salvar Equipe"}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
 
       <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
         <div className="p-6 border-b bg-muted/10 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Users className="h-5 w-5 text-primary" />
             <h3 className="font-bold text-lg">Equipes Ativas</h3>
           </div>
           <div className="text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border">
             {rows.length} {rows.length === 1 ? 'Equipe' : 'Equipes'}
           </div>
         </div>
         {rows.length === 0 ? <EmptyState title="Sem equipes cadastradas" /> : (
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="bg-muted/30 border-b text-xs uppercase tracking-wider font-bold text-muted-foreground">
                   <th className="px-6 py-4 text-left">Nome da Equipe</th>
                   <th className="px-6 py-4 text-left">Código</th>
                   <th className="px-6 py-4 text-left">Localização</th>
                   <th className="px-6 py-4 text-left">Setor</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-muted/30">
                 {rows.map((r) => (
                   <tr key={r.id} className="hover:bg-primary/5 transition-colors group">
                     <td className="px-6 py-4">
                       <div className="font-bold text-foreground text-base">{r.nome}</div>
                       <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                         <Users className="h-3 w-3" />
                         <span>{r.equipe_membros?.length || 0} membros</span>
                       </div>
                     </td>
                     <td className="px-6 py-4 font-mono text-xs font-bold bg-muted/50 w-fit px-2 py-1 rounded">
                       {r.codigo || "-"}
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5 text-muted-foreground">
                         <MapPin className="h-3.5 w-3.5" />
                         <span className="font-medium text-xs">{r.regiao || "Brasil"}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <span className="text-xs font-bold text-primary bg-primary/5 border border-primary/20 px-2 py-1 rounded-md">
                         {r.department?.name || "Geral"}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => openEdit(r)}
                         className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-primary hover:bg-primary/10"
                       >
                         Configurar
                       </Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
       </Card>

      <ProfessionalModal 
        open={profModalOpen}
        onOpenChange={setProfModalOpen}
        onSuccess={() => {
          load();
          setProfModalOpen(false);
        }}
        departments={deps}
      />
    </div>
  );
}