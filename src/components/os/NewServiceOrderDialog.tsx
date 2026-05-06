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
 import { Search, Plus, Trash2, X, AlertCircle, MapPin, Loader2, ClipboardList, Clock, Info, CheckCircle2, ChevronRight, Building2, User2, LayoutList } from "lucide-react";
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
  const [departamentos, setDepartamentos] = useState<any[]>([]);
   const [selectedServicoId, setSelectedServicoId] = useState<string>("");
   const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");
  const [gestores, setGestores] = useState<any[]>([]);
   const [equipes, setEquipes] = useState<any[]>([]);
   const [obraSearchOpen, setObraSearchOpen] = useState(false);
   const [customObraNumero, setCustomObraNumero] = useState("");
   const [customObraNome, setCustomObraNome] = useState("");
  const [busy, setBusy] = useState(false);
  const [activityPopoverOpen, setActivityPopoverOpen] = useState(false);

   const [step, setStep] = useState(1);
   const [formData, setFormData] = useState({
     obraId: initialObraId || "",
     departmentId: "",
     prioridade: "media",
     data_agendada: new Date().toISOString().split('T')[0],
     hora_agendada: "08:00",
     gestorId: "",
     equipeId: "",
      titulo: "",
      descricao: "",
      observacoes: "",
     itens: [] as any[],
     allAtvSelected: false,
      client_name: "",
      cep: "",
      endereco: "",
      bairro: "",
      cidade: "",
      estado: "",
      ponto_referencia: "",
      solicitante_nome: "",
      solicitante_telefone: ""
   });

  const [selectedObra, setSelectedObra] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchInitialData();
      if (initialObraId) {
        setFormData(prev => ({ ...prev, obraId: initialObraId }));
      }
    }
  }, [open, initialObraId]);

   async function fetchInitialData() {
     const [resObras, resAtividades, resCats, resServicos, resGestores, resEquipes, resDeps] = await Promise.all([
       supabase.from("obras").select("*").eq("ativo", true).order("numero"),
       supabase.from("atividades").select("*, categoria:categorias(nome, servico_id)").eq("ativo", true).order("codigo_item"),
       supabase.from("categorias").select("*").order("nome"),
       supabase.from("servicos").select("*").eq("ativo", true).order("nome"),
        supabase.from("profiles").select("id, nome").eq("ativo", true).in("id", (await supabase.from("user_roles").select("user_id").in("role", ["gestor", "supervisor"])).data?.map(r => r.user_id) || []),
       supabase.from("equipes").select("id, nome").order("nome"),
       supabase.from("departments").select("id, name, acronym").eq("active", true).order("name")
     ]);
 
     setObras(resObras.data ?? []);
      const allAtividades = resAtividades.data ?? [];
      setAtividades(allAtividades);
      setCategorias(resCats.data ?? []);
      const allServicos = resServicos.data ?? [];
      setServicos(allServicos);
     setGestores(resGestores.data ?? []);
     setEquipes(resEquipes.data ?? []);
      const depsData = resDeps.data ?? [];
      setDepartamentos(depsData);

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

    async function fetchGestoresByDep(depId: string) {
      if (!depId) {
        setGestores([]);
        return;
      }
      
      let query = supabase.from("profiles").select("id, nome, department_id").eq("ativo", true);
      
      // If not admin, restrict to selected department
      if (!hasRole(['admin'])) {
        query = query.eq("department_id", depId);
      }

      const { data: users } = await query;
      
      if (users && users.length > 0) {
        const { data: roleRecords } = await supabase.from("user_roles")
          .select("user_id")
          .in("role", ["gestor", "supervisor", "admin"])
          .in("user_id", users.map(u => u.id));
        
        const roleUserIds = roleRecords?.map(r => r.user_id) || [];
        setGestores(users.filter(u => roleUserIds.includes(u.id)));
      } else {
        setGestores([]);
      }
    }

    const handleDepartmentChange = (depId: string) => {
      setFormData(prev => ({ ...prev, departmentId: depId, gestorId: "" }));
      fetchGestoresByDep(depId);
    };

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

   const fetchAddress = async (cep: string) => {
     const cleanCep = cep.replace(/\D/g, "");
     if (cleanCep.length !== 8) return;
     
     try {
       const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
       const data = await response.json();
       if (!data.erro) {
         setFormData(prev => ({
           ...prev,
           endereco: data.logradouro,
           bairro: data.bairro,
           cidade: data.localidade,
           estado: data.uf
         }));
       }
     } catch (error) {
       console.error("Erro ao buscar CEP:", error);
     }
   };

   const handleObraChange = (obraId: string) => {
     const obra = obras.find(o => o.id === obraId);
     setSelectedObra(obra);
     setFormData(prev => ({ 
       ...prev, 
       obraId,
       client_name: obra?.cliente || prev.client_name,
       cep: obra?.cep || prev.cep,
       endereco: obra?.endereco || prev.endereco,
       bairro: obra?.bairro || prev.bairro,
       cidade: obra?.cidade || prev.cidade,
       estado: obra?.estado || prev.estado
     }));
   };

    async function handleSave() {
      if (!formData.obraId || (formData.obraId === "new" && !customObraNumero)) {
        return toast.error("Selecione ou cadastre o código da obra");
      }
      if (formData.itens.length === 0) return toast.error("Adicione ao menos uma atividade");
      
      setBusy(true);
      try {
        let finalObraId = formData.obraId;

        // Se for uma nova obra, cadastrar primeiro
        if (formData.obraId === "new") {
          const { data: newObra, error: obraError } = await supabase
            .from("obras")
            .insert({
              numero: customObraNumero,
              nome: customObraNome || `Obra ${customObraNumero}`,
              cliente: formData.client_name,
              endereco: formData.endereco,
              bairro: formData.bairro,
              cidade: formData.cidade,
              estado: formData.estado,
              cep: formData.cep,
              status: 'aberta',
              ativo: true
            })
            .select("id")
            .single();
          
          if (obraError) throw new Error("Erro ao cadastrar nova obra: " + obraError.message);
          finalObraId = newObra.id;
        }

        const { data: os, error: osError } = await supabase.from("ordens_servico").insert({
          obra_id: finalObraId,
          department_id: formData.departmentId || null,
          servico_id: selectedServicoId || null,
          profissional_id: user!.id,
          assigned_manager_id: formData.gestorId || null,
          equipe_id: (formData.equipeId && formData.equipeId !== 'none') ? formData.equipeId : null,
          status: "pendente" as any,
          operational_status: "pendente" as any,
          prioridade: formData.prioridade,
          data_agendada: formData.data_agendada,
          hora_agendada: formData.hora_agendada,
          titulo: formData.titulo,
          descricao: formData.descricao,
          observacoes: formData.observacoes,
          created_by: user!.id,
          cep: formData.cep,
          endereco: formData.endereco,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          ponto_referencia: formData.ponto_referencia,
          solicitante_nome: formData.solicitante_nome,
          solicitante_telefone: formData.solicitante_telefone
        } as any).select("id").single();

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

       toast.success("Ordem de Serviço criada com sucesso! Tarefa de aprovação enviada ao gestor.");
       
       // Create approval task for gestor
       if (formData.gestorId) {
         await supabase.from("department_tasks").insert({
           os_id: os.id,
           to_department_id: formData.departmentId || null,
           assigned_to: formData.gestorId,
           task_type: "aprovar_os",
           title: `Aprovar Nova OS #${os.id.substring(0, 8)}`,
           description: "Nova OS criada aguardando aprovação técnica e operacional para seguir o fluxo.",
           priority: formData.prioridade === 'urgente' ? 'alta' : 'normal',
           created_by: user!.id
         });
       }

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
       <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
         <DialogHeader className="p-8 pb-6 bg-primary text-primary-foreground relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <ClipboardList className="h-32 w-32" />
           </div>
           <div className="relative z-10">
             <DialogTitle className="text-2xl font-bold mb-1">Nova Ordem de Serviço</DialogTitle>
             <DialogDescription className="text-primary-foreground/80">
               Siga os passos para criar uma nova solicitação de trabalho.
             </DialogDescription>
           </div>
           
           {/* Stepper Visual */}
           <div className="flex items-center gap-2 mt-6 relative z-10">
             {[1, 2, 3, 4, 5].map((s) => (
               <div key={s} className="flex items-center gap-2">
                 <div className={cn(
                   "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                   step === s ? "bg-white text-primary scale-110 shadow-lg" : 
                   step > s ? "bg-primary-foreground/40 text-primary-foreground" : "bg-primary-foreground/10 text-primary-foreground/40"
                 )}>
                   {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                 </div>
                 {s < 5 && <div className={cn("h-0.5 w-6 rounded-full", step > s ? "bg-primary-foreground/40" : "bg-primary-foreground/10")} />}
               </div>
             ))}
           </div>
         </DialogHeader>
         
         <div className="flex-1 overflow-y-auto p-8 bg-background">
           {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título da OS <span className="text-destructive">*</span></Label>
                  <Input 
                    placeholder="Ex: Manutenção Preventiva - Torre A" 
                    value={formData.titulo} 
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição Detalhada <span className="text-destructive">*</span></Label>
                  <Textarea 
                    placeholder="Descreva o que precisa ser feito..." 
                    value={formData.descricao} 
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profissional Solicitante</Label>
                  <Input value={profile?.nome ?? ""} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Departamento Responsável <span className="text-destructive">*</span></Label>
                  <Select value={formData.departmentId} onValueChange={handleDepartmentChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {departamentos.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.acronym ? `[${d.acronym}] ` : ""}{d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
               <div className="space-y-2 md:col-span-2 border-t pt-4">
                 <h3 className="text-sm font-semibold">Localização e Contato</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-2">
                     <Label>CEP</Label>
                     <div className="flex gap-2">
                       <Input 
                         placeholder="00000-000" 
                         value={formData.cep} 
                         onChange={(e) => {
                           setFormData({...formData, cep: e.target.value});
                           if (e.target.value.replace(/\D/g, "").length === 8) fetchAddress(e.target.value);
                         }} 
                       />
                     </div>
                   </div>
                     <div className="md:col-span-2 space-y-4 border rounded-md p-4 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-tight">Identificação da Obra</h3>
                          </div>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => nav('/app/obras')}>
                            Gerenciar Obras
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-primary/10">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Código da Obra <span className="text-destructive">*</span></Label>
                            <div className="relative group">
                              <Input 
                                placeholder="Digite o código manualmente..." 
                                className="pr-10 border-primary/20 focus-visible:ring-primary shadow-sm"
                                value={selectedObra?.numero || customObraNumero || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const found = obras.find(o => o.numero === val);
                                  if (found) {
                                    handleObraChange(found.id);
                                    setCustomObraNumero("");
                                  } else {
                                    setSelectedObra(null);
                                    setFormData(prev => ({ ...prev, obraId: "new" }));
                                    setCustomObraNumero(val);
                                  }
                                }}
                              />
                              <Popover open={obraSearchOpen} onOpenChange={setObraSearchOpen}>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    type="button" 
                                    className="absolute right-0 top-0 h-full text-muted-foreground hover:text-primary transition-colors"
                                    title="Pesquisar obras cadastradas"
                                  >
                                    <Search className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0 shadow-xl" align="end">
                                  <Command className="rounded-lg">
                                    <CommandInput placeholder="Pesquisar por número ou nome..." className="h-11" />
                                    <CommandList className="max-h-[300px]">
                                      <CommandEmpty>Nenhuma obra encontrada.</CommandEmpty>
                                      <CommandGroup heading="Obras Cadastradas">
                                       {obras.map((o) => (
                                         <CommandItem
                                           key={o.id}
                                           value={`${o.numero} ${o.nome}`}
                                           onSelect={() => {
                                             handleObraChange(o.id);
                                             setObraSearchOpen(false);
                                           }}
                                         >
                                           <span className="font-bold mr-2">{o.numero}</span>
                                           <span className="text-xs truncate">{o.nome}</span>
                                         </CommandItem>
                                       ))}
                                     </CommandGroup>
                                   </CommandList>
                                 </Command>
                               </PopoverContent>
                             </Popover>
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label>Nome / Descrição da Obra <span className="text-destructive">*</span></Label>
                           <Input 
                             placeholder="Ex: Edifício Horizonte" 
                             value={selectedObra?.nome || customObraNome || ""}
                             onChange={(e) => {
                               const val = e.target.value;
                               if (!selectedObra) {
                                 setCustomObraNome(val);
                                 setFormData(prev => ({ ...prev }));
                               }
                             }}
                             disabled={!!selectedObra}
                             className={selectedObra ? "bg-muted" : ""}
                           />
                         </div>

                         <div className="space-y-2 md:col-span-2">
                           <Label>Nome do Cliente</Label>
                           <Input 
                             placeholder="Ex: Construtora Silva" 
                             value={formData.client_name}
                             onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                             disabled={!!selectedObra}
                             className={selectedObra ? "bg-muted" : ""}
                           />
                         </div>
                       </div>
                     </div>
                   <div className="md:col-span-2 space-y-2">
                     <Label>Endereço <span className="text-destructive">*</span></Label>
                     <Input value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Bairro</Label>
                     <Input value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Cidade</Label>
                     <Input value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Estado</Label>
                     <Input value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Ponto de Referência</Label>
                     <Input value={formData.ponto_referencia} onChange={(e) => setFormData({...formData, ponto_referencia: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Nome do Solicitante</Label>
                     <Input value={formData.solicitante_nome} onChange={(e) => setFormData({...formData, solicitante_nome: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Telefone</Label>
                     <Input value={formData.solicitante_telefone} onChange={(e) => setFormData({...formData, solicitante_telefone: e.target.value})} />
                   </div>
                 </div>
               </div>
              </div>
              <Button className="w-full" onClick={() => {
                if(!formData.titulo || !formData.descricao || !formData.departmentId || !formData.obraId) {
                  return toast.error("Preencha todos os campos obrigatórios (Título, Descrição, Setor e Obra)");
                }
                setStep(2);
              }}>Próximo Passo</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <SelectTrigger><SelectValue placeholder="Selecione o gestor" /></SelectTrigger>
                    <SelectContent>
                      {gestores.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Próximo Passo</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Serviço Principal <span className="text-destructive">*</span></Label>
                <Select value={selectedServicoId} onValueChange={(v) => setSelectedServicoId(v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                  <SelectContent>
                    {servicos.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(hasRole(['admin', 'gestor', 'supervisor'])) && (
                <div className="space-y-2">
                  <Label>Equipe Executora (Opcional)</Label>
                  <Select value={formData.equipeId} onValueChange={(v) => setFormData({...formData, equipeId: v})}>
                    <SelectTrigger><SelectValue placeholder="Definir equipe (deixe em branco para o gestor definir)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">A definir pelo Gestor</SelectItem>
                      {equipes.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                <Button className="flex-1" onClick={() => setStep(4)}>Próximo Passo</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Itens do Catálogo <span className="text-destructive">*</span></Label>
                <Popover open={activityPopoverOpen} onOpenChange={setActivityPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8"><Plus className="h-3 w-3 mr-1"/> Adicionar</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Buscar atividade..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma encontrada.</CommandEmpty>
                        {atividades.filter(a => !formData.itens.some(i => i.id === a.id)).map(a => (
                          <CommandItem key={a.id} onSelect={() => addActivity(a)}>
                            {a.codigo_item} - {a.descricao}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                {formData.itens.length === 0 ? <p className="text-center text-muted-foreground py-4">Nenhum item adicionado.</p> :
                  formData.itens.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted/40 rounded border text-xs">
                      <div className="font-medium truncate flex-1">{item.descricao}</div>
                      <div className="flex items-center gap-2">
                        <Input type="number" className="h-7 w-16 text-center" value={item.quantidade} onChange={(e) => updateItemQty(item.id, Number(e.target.value))} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeActivity(item.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Voltar</Button>
                <Button className="flex-1" onClick={() => setStep(5)}>Revisar e Criar</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg text-sm space-y-2">
                <h4 className="font-bold border-b pb-1">Resumo da Ordem de Serviço</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Obra:</div> <div className="font-medium">{selectedObra?.nome}</div>
                  <div className="text-muted-foreground">Data/Hora:</div> <div className="font-medium">{formData.data_agendada} {formData.hora_agendada}</div>
                  <div className="text-muted-foreground">Departamento:</div> <div className="font-medium">{departamentos.find(d => d.id === formData.departmentId)?.name}</div>
                  <div className="text-muted-foreground">Prioridade:</div> <div className="font-medium uppercase">{formData.prioridade}</div>
                  <div className="text-muted-foreground">Total Itens:</div> <div className="font-medium">{formData.itens.length}</div>
                </div>
              </div>
              <Textarea placeholder="Observações adicionais..." value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Voltar</Button>
                <Button className="flex-1" disabled={busy} onClick={handleSave}>
                  {busy ? "Processando..." : "Finalizar e Criar OS"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}