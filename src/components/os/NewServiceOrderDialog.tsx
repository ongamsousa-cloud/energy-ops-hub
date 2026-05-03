import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Plus, Trash2, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NewServiceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id: string) => void;
}

interface NewServiceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id: string) => void;
  initialObraId?: string;
}

export default function NewServiceOrderDialog({ open, onOpenChange, onSuccess, initialObraId }: NewServiceOrderDialogProps) {
  const { user, profile, hasRole } = useAuth();
  const nav = useNavigate();
  const [obras, setObras] = useState<any[]>([]);
   const [atividades, setAtividades] = useState<any[]>([]);
   const [servicoHasNoActivities, setServicoHasNoActivities] = useState(false);
   const [categorias, setCategorias] = useState<any[]>([]);
   const [servicos, setServicos] = useState<any[]>([]);
   const [selectedServicoId, setSelectedServicoId] = useState<string>("");
   const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");
  const [gestores, setGestores] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [activityPopoverOpen, setActivityPopoverOpen] = useState(false);

  const [formData, setFormData] = useState({
    obraId: initialObraId || "",
    prioridade: "media",
    data_agendada: new Date().toISOString().split('T')[0],
    hora_agendada: "08:00",
    gestorId: "",
    equipeId: "",
    observacoes: "",
    itens: [] as any[]
  });

  useEffect(() => {
    if (open) {
      fetchInitialData();
      if (initialObraId) {
        setFormData(prev => ({ ...prev, obraId: initialObraId }));
      }
    }
  }, [open, initialObraId]);

   async function fetchInitialData() {
     const [resObras, resAtividades, resCats, resServicos, resGestores, resEquipes] = await Promise.all([
       supabase.from("obras").select("id,numero,nome").eq("ativo", true).order("numero"),
       supabase.from("atividades").select("*, categoria:categorias(nome, servico_id)").eq("ativo", true).order("codigo_item"),
       supabase.from("categorias").select("*").order("nome"),
       supabase.from("servicos").select("*").eq("ativo", true).order("nome"),
       supabase.from("profiles").select("id, nome").in("id", (await supabase.from("user_roles").select("user_id").eq("role", "gestor")).data?.map(r => r.user_id) || []),
       supabase.from("equipes").select("id, nome").order("nome")
     ]);
 
     setObras(resObras.data ?? []);
      const allAtividades = resAtividades.data ?? [];
      setAtividades(allAtividades);
      setCategorias(resCats.data ?? []);
      const allServicos = resServicos.data ?? [];
      setServicos(allServicos);
     setGestores(resGestores.data ?? []);
     setEquipes(resEquipes.data ?? []);
     
      if (allServicos.length) {
        const firstServId = allServicos[0].id;
        setSelectedServicoId(firstServId);
        // Check if this service has any activities via its categories
        const servCats = resCats.data?.filter(c => c.servico_id === firstServId) || [];
        const hasAtvs = allAtividades.some(a => servCats.some(c => c.id === a.categoria_id));
        setServicoHasNoActivities(!hasAtvs);
     }
 
     if (resGestores.data?.length === 1) {
       setFormData(prev => ({ ...prev, gestorId: resGestores.data![0].id }));
     }
   }

  function addActivity(activity: any) {
    if (formData.itens.some(i => i.id === activity.id)) {
      toast.error("Esta atividade já foi adicionada");
      return;
    }
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, { ...activity, quantidade: 1 }]
    }));
    setActivityPopoverOpen(false);
  }

  function removeActivity(id: string) {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter(i => i.id !== id)
    }));
  }

  function updateItemQty(id: string, qty: number) {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map(i => i.id === id ? { ...i, quantidade: qty } : i)
    }));
  }

   async function handleSave() {
     if (!formData.obraId) return toast.error("Selecione a obra");
     if (formData.itens.length === 0) return toast.error("Adicione ao menos uma atividade");
     
     setBusy(true);
     try {
       const { data: os, error: osError } = await supabase.from("ordens_servico").insert({
         obra_id: formData.obraId,
         servico_id: selectedServicoId || null,
         profissional_id: user!.id,
         assigned_manager_id: formData.gestorId || null,
         equipe_id: (formData.equipeId && formData.equipeId !== 'none') ? formData.equipeId : null,
         status: "iniciada",
         operational_status: "pendente",
         prioridade: formData.prioridade,
         data_agendada: formData.data_agendada,
         hora_agendada: formData.hora_agendada,
         observacoes: formData.observacoes,
         created_by: user!.id,
       }).select("id").single();
 
       if (osError) throw osError;

      const osAtividades = formData.itens.map(item => ({
        os_id: os.id,
        atividade_id: item.id,
        categoria_id: item.categoria_id,
        quantidade: item.quantidade,
        umd_unitaria: item.umd_unitaria,
        umd_total: item.quantidade * item.umd_unitaria,
        unidade: item.unidade,
        created_by: user!.id
      }));

      const { error: itensError } = await supabase.from("os_atividades").insert(osAtividades);
      if (itensError) throw itensError;

      toast.success("Ordem de Serviço criada com sucesso!");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(os.id);
      } else {
        nav(`/app/os/${os.id}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-bold">Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>Preencha os dados abaixo para iniciar uma nova OS.</DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profissional Solicitante</Label>
              <Input value={profile?.nome ?? ""} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label>Obra <span className="text-destructive">*</span></Label>
              <Select value={formData.obraId} onValueChange={(v) => setFormData({...formData, obraId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.numero} — {o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Programada</Label>
              <Input type="date" value={formData.data_agendada} onChange={(e) => setFormData({...formData, data_agendada: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label>Hora Programada</Label>
              <Input type="time" value={formData.hora_agendada} onChange={(e) => setFormData({...formData, hora_agendada: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(v) => setFormData({...formData, prioridade: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

             <div className="space-y-2">
               <Label>Gestor Responsável</Label>
               <Select value={formData.gestorId} onValueChange={(v) => setFormData({...formData, gestorId: v})}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o gestor" />
                 </SelectTrigger>
                 <SelectContent>
                   {gestores.map((g) => (
                     <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-2">
               <Label>Serviço Principal <span className="text-destructive">*</span></Label>
               <Select 
                 value={selectedServicoId} 
                 onValueChange={(v) => {
                   setSelectedServicoId(v);
                   setSelectedCategoriaId("all");
                   const servCats = categorias.filter(c => c.servico_id === v);
                   const hasAtvs = atividades.some(a => servCats.some(c => c.id === a.categoria_id));
                   setServicoHasNoActivities(!hasAtvs);
                   if (!hasAtvs) {
                     toast.warning("Atenção: Este serviço não possui atividades cadastradas nas suas categorias.");
                   }
                 }}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o serviço" />
                 </SelectTrigger>
                 <SelectContent>
                   {servicos.map((s) => (
                     <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           {(hasRole(['admin', 'gestor', 'supervisor'])) && (
             <div className="space-y-2">
               <Label>Equipe Executora (Opcional)</Label>
               <Select value={formData.equipeId} onValueChange={(v) => setFormData({...formData, equipeId: v})}>
                 <SelectTrigger>
                   <SelectValue placeholder="Definir equipe (deixe em branco para o gestor definir)" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">A definir pelo Gestor</SelectItem>
                   {equipes.map((e) => (
                     <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}

            {servicoHasNoActivities && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-start gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Nenhuma atividade configurada</p>
                  <p>Este serviço ou suas categorias não possuem itens cadastrados no catálogo técnico. Verifique as configurações do banco de dados.</p>
                </div>
              </div>
            )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Atividades / Serviços <span className="text-destructive">*</span></Label>
              
               <Popover open={activityPopoverOpen} onOpenChange={setActivityPopoverOpen}>
                 <PopoverTrigger asChild>
                   <Button variant="outline" size="sm" className="h-8 gap-1">
                     <Plus className="h-3.5 w-3.5" /> Adicionar Item do Catálogo
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-[500px] p-0" align="end">
                   <Command>
                     <div className="p-2 border-b space-y-2">
                       <Select value={selectedCategoriaId} onValueChange={setSelectedCategoriaId}>
                         <SelectTrigger className="h-8 text-xs">
                           <SelectValue placeholder="Filtrar por Categoria" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todas as Categorias do Serviço</SelectItem>
                           {categorias
                             .filter(c => !selectedServicoId || c.servico_id === selectedServicoId)
                             .map((c) => (
                               <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                             ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <CommandInput placeholder="Buscar por código, descrição ou categoria..." />
                      <CommandList className="max-h-[450px]">
                       <CommandEmpty>Nenhuma atividade encontrada.</CommandEmpty>
                       {categorias
                         .filter(c => (selectedCategoriaId === "all" || c.id === selectedCategoriaId) && (!selectedServicoId || c.servico_id === selectedServicoId))
                         .map(cat => {
                           const catAtividades = atividades.filter(a => a.categoria_id === cat.id);
                           if (catAtividades.length === 0) return null;
                           return (
                             <CommandGroup key={cat.id} heading={cat.nome}>
                               {catAtividades.map((a) => (
                                 <CommandItem
                                   key={a.id}
                                   value={`${a.codigo_item} ${a.descricao} ${cat.nome}`}
                                   onSelect={() => addActivity(a)}
                                   className="cursor-pointer"
                                 >
                                   <div className="flex flex-col w-full">
                                     <div className="flex justify-between items-start">
                                       <span className="font-mono text-xs font-bold text-primary">{a.codigo_item}</span>
                                       <span className="text-[10px] text-muted-foreground uppercase">{a.unidade}</span>
                                     </div>
                                     <span className="text-sm line-clamp-2">{a.descricao}</span>
                                   </div>
                                 </CommandItem>
                               ))}
                             </CommandGroup>
                           );
                         })}
                     </CommandList>
                   </Command>
                 </PopoverContent>
               </Popover>
            </div>

            <div className="border rounded-md overflow-hidden">
              {formData.itens.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20">
                  Nenhuma atividade adicionada. Use o botão acima para adicionar itens da planilha.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Código</th>
                      <th className="text-left px-3 py-2 font-medium">Descrição</th>
                      <th className="text-center px-3 py-2 font-medium w-24">Qtd</th>
                      <th className="text-center px-3 py-2 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formData.itens.map((item) => (
                      <tr key={item.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-3 py-2 font-mono text-xs font-bold text-primary">{item.codigo_item}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="line-clamp-1 font-medium">{item.descricao}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{item.unidade}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Input 
                            type="number" 
                            min="1" 
                            step="0.01"
                            value={item.quantidade} 
                            onChange={(e) => updateItemQty(item.id, parseFloat(e.target.value) || 0)}
                            className="h-8 text-center px-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeActivity(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações Adicionais</Label>
            <Textarea 
              placeholder="Detalhes sobre o serviço, local específico, etc."
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "Salvando..." : "Criar Ordem de Serviço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}