import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
 import { Camera, Loader2, UserPlus, Save, Shield, Settings, Activity, Globe } from "lucide-react";
 import 'react-phone-number-input/style.css';
 import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
 import pt from 'react-phone-number-input/locale/pt.json';
import { ROLE_LABEL, AppRole } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Switch } from "@/components/ui/switch";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Textarea } from "@/components/ui/textarea";
 import { maskCPF, maskPhone, maskCEP, maskRG } from "@/lib/utils/masks";

interface ProfessionalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  professional?: any;
  departments: any[];
}

const ROLES: AppRole[] = ["admin", "gestor", "supervisor", "campo", "financeiro", "auditor", "estoque", "developer"];

export default function ProfessionalModal({ open, onOpenChange, onSuccess, professional, departments }: ProfessionalModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const initialFormState = {
    nome: "",
    email: "",
    cargo: "",
    especialidade: "",
    cpf: "",
    rg: "",
    telefone: "",
    data_nascimento: "",
    endereco_residencial: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    data_admissao: "",
    department_id: "",
    role: "campo" as AppRole,
    internal_company_code: "",
    service_code: "",
    operational_role: "",
    employee_type: "field_worker",
    status: "active",
    is_active: true,
    can_access_system: false,
    can_receive_service_orders: true,
    can_manage_materials: false,
    can_close_service_orders: false,
    can_view_financial_data: false,
    can_view_reports: false,
    notes: "",
    admission_date: "",
    termination_date: "",
  };

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (open) {
      if (professional) {
        setForm({
          nome: professional.nome || "",
          email: professional.email || "",
          cargo: professional.cargo || "",
          especialidade: professional.especialidade || "",
          cpf: professional.cpf || "",
          rg: professional.rg || "",
          telefone: professional.telefone || "",
          data_nascimento: professional.data_nascimento || "",
          endereco_residencial: professional.endereco_residencial || "",
          bairro: professional.bairro || "",
          cidade: professional.cidade || "",
          estado: professional.estado || "",
          cep: professional.cep || "",
          data_admissao: professional.data_admissao || "",
          department_id: professional.department_id || "",
          role: (professional.user_roles?.[0]?.role as AppRole) || "campo",
          internal_company_code: professional.internal_company_code || "",
          service_code: professional.service_code || "",
          operational_role: professional.operational_role || "",
          employee_type: professional.employee_type || "field_worker",
          status: professional.status || "active",
          is_active: professional.is_active ?? true,
          can_access_system: professional.can_access_system ?? false,
          can_receive_service_orders: professional.can_receive_service_orders ?? true,
          can_manage_materials: professional.can_manage_materials ?? false,
          can_close_service_orders: professional.can_close_service_orders ?? false,
          can_view_financial_data: professional.can_view_financial_data ?? false,
          can_view_reports: professional.can_view_reports ?? false,
          notes: professional.notes || "",
          admission_date: professional.admission_date || professional.data_admissao || "",
          termination_date: professional.termination_date || "",
        });
        setPhotoPreview(professional.foto_url || null);
      } else {
        setForm(initialFormState);
        setPhotoPreview(null);
      }
    }
  }, [open, professional]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (userId: string) => {
    if (!photoFile) return professional?.foto_url;
    
    const fileExt = photoFile.name.split('.').pop();
    const filePath = `${userId}/${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, photoFile);

    if (uploadError) {
      toast.error("Erro ao fazer upload da foto");
      return professional?.foto_url;
    }

    const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.nome || !form.email) return toast.error("Nome e E-mail são obrigatórios");
    
    setLoading(true);
    try {
      const userId = professional?.id; // Este é o ID do profile (se existir)
      const employeeId = professional?.employee_id;
      let fotoUrl = professional?.foto_url;

      if (photoFile && employeeId) {
        fotoUrl = await uploadPhoto(employeeId);
      }

      const employeeData = {
        full_name: form.nome,
        email: form.email,
        phone: form.telefone,
        document_cpf: form.cpf,
        job_title: form.cargo,
        operational_role: form.operational_role,
        department_id: form.department_id === "" ? null : form.department_id,
        internal_company_code: form.internal_company_code === "" ? null : form.internal_company_code,
        service_code: form.service_code === "" ? null : form.service_code,
        employee_type: form.employee_type,
        status: form.status,
        is_active: form.is_active,
        can_access_system: form.can_access_system,
        can_receive_service_orders: form.can_receive_service_orders,
        can_manage_materials: form.can_manage_materials,
        can_close_service_orders: form.can_close_service_orders,
        can_view_financial_data: form.can_view_financial_data,
        can_view_reports: form.can_view_reports,
        admission_date: form.admission_date === "" ? null : form.admission_date,
        termination_date: form.termination_date === "" ? null : form.termination_date,
        notes: form.notes,
        photo_url: fotoUrl || professional?.foto_url || null,
                user_id: userId || null,
        document_rg: form.rg,
        birth_date: form.data_nascimento === "" ? null : form.data_nascimento,
        postal_code: form.cep,
        residential_address: form.endereco_residencial,
        neighborhood: form.bairro,
        city: form.cidade,
        state: form.estado
      };

      let res;
      if (employeeId) {
        res = await supabase.from("employees").update(employeeData).eq("id", employeeId);
      } else {
        res = await supabase.from("employees").insert(employeeData).select().single();
        if (res.data && photoFile) {
          const newFotoUrl = await uploadPhoto(res.data.id);
          await supabase.from("employees").update({ photo_url: newFotoUrl }).eq("id", res.data.id);
          fotoUrl = newFotoUrl;
        } else if (res.data) {
          fotoUrl = res.data.photo_url;
        }
      }

      if (res.error) throw res.error;

      if (userId) {
        const { error: profileError } = await supabase.from("profiles").update({
          nome: form.nome,
          cargo: form.cargo,
          especialidade: form.especialidade,
          cpf: form.cpf,
          rg: form.rg,
          telefone: form.telefone,
          data_nascimento: form.data_nascimento === "" ? null : form.data_nascimento,
          endereco_residencial: form.endereco_residencial,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
          cep: form.cep,
          data_admissao: form.admission_date === "" ? null : form.admission_date,
          department_id: form.department_id === "" ? null : form.department_id,
          foto_url: fotoUrl
        }).eq("id", userId);

        if (profileError) throw profileError;

        await supabase.from("user_roles").delete().eq("user_id", userId);
        await supabase.from("user_roles").insert({ user_id: userId, role: form.role as any });
      }

      toast.success(professional ? "Cadastro atualizado com sucesso" : "Funcionário cadastrado com sucesso");
      
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
         <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            {professional ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {professional ? "Perfil do Funcionário" : "Cadastrar Novo Funcionário"}
          </DialogTitle>
          <DialogDescription>
            Informações completas, permissões e códigos de identificação.
          </DialogDescription>
        </DialogHeader>

         <ScrollArea className="flex-1 overflow-y-auto">
           <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
             <div className="md:col-span-3 flex flex-col items-center gap-4 border-r border-border pr-8">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-muted shadow-sm">
                  <AvatarImage src={photoPreview || ""} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {form.nome ? form.nome.substring(0, 2).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="h-8 w-8" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </label>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Clique na imagem para alterar a foto do profissional</p>
              </div>

                 <div className="w-full space-y-6 mt-6">
                   <div className="space-y-2">
                     <Label className="text-xs font-semibold uppercase text-muted-foreground">Status do Funcionário</Label>
                     <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v, is_active: v === 'active' })}>
                       <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="active">Ativo</SelectItem>
                         <SelectItem value="inactive">Inativo</SelectItem>
                         <SelectItem value="blocked">Bloqueado</SelectItem>
                         <SelectItem value="vacation">Em Férias</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-3 pt-4 border-t border-border">
                     <Label className="text-xs font-semibold uppercase text-muted-foreground">Identificação Profissional</Label>
                     <div className="space-y-4">
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium">Cód. Interno Empresa</Label>
                         <Input 
                           className="h-10 text-sm font-mono" 
                           placeholder="FUNC-0000" 
                           value={form.internal_company_code} 
                           onChange={(e) => setForm({ ...form, internal_company_code: e.target.value })} 
                         />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium">Cód. Serviço</Label>
                         <Input 
                           className="h-10 text-sm font-mono" 
                           placeholder="TEC-000" 
                           value={form.service_code} 
                           onChange={(e) => setForm({ ...form, service_code: e.target.value })} 
                         />
                       </div>
                     </div>
                   </div>
                 </div>
            </div>

            <div className="md:col-span-9">
              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
                  <TabsTrigger value="permissoes">Permissões</TabsTrigger>
                  <TabsTrigger value="operacional">Operacional</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-6 pb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Nome Completo *</Label>
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: João Silva" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Especialidade / Certificações</Label>
                      <Input 
                        value={form.especialidade} 
                        onChange={(e) => setForm({ ...form, especialidade: e.target.value })} 
                        placeholder="Ex: NR10, NR35, Redes MT" 
                      />
                    </div>
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium">Email Corporativo *</Label>
                       <Input 
                         value={form.email} 
                         onChange={(e) => setForm({ ...form, email: e.target.value })} 
                         placeholder="joao@empresa.com" 
                       />
                     </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Telefone / WhatsApp</Label>
                        <Input 
                          value={form.telefone} 
                          onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} 
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium">CPF</Label>
                       <Input 
                          value={form.cpf} 
                          onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} 
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                     </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Data de Admissão</Label>
                      <Input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase text-muted-foreground">Cargo / Função Administrativa</Label>
                       <Input 
                         className="h-10 text-sm border-primary/20 bg-primary/5 focus:ring-primary/20 font-medium" 
                         value={form.cargo} 
                         onChange={(e) => setForm({ ...form, cargo: e.target.value })} 
                         placeholder="Ex: Engenheiro de Campo" 
                       />
                     </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Departamento</Label>
                      <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                   <div className="space-y-6 pt-6 border-t border-border">
                     <h4 className="text-base font-bold flex items-center gap-2 text-primary/80">
                      <Shield className="h-4 w-4 text-muted-foreground" /> 
                      Documentação e Endereço
                    </h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">RG</Label>
                          <Input 
                            className="h-11" 
                            value={form.rg} 
                            onChange={(e) => setForm({ ...form, rg: maskRG(e.target.value) })} 
                            placeholder="00.000.000-0" 
                          />
                        </div>
                       <div className="space-y-2">
                         <Label className="text-sm font-semibold">Data de Nascimento</Label>
                         <Input className="h-11" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
                       </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">CEP</Label>
                          <Input 
                            className="h-11" 
                            value={form.cep} 
                            onChange={async (e) => {
                              const maskedCep = maskCEP(e.target.value);
                              setForm({ ...form, cep: maskedCep });
                              if (maskedCep.length === 9) {
                                try {
                                  const response = await fetch(`https://viacep.com.br/ws/${maskedCep.replace(/\D/g, '')}/json/`);
                                  const data = await response.json();
                                  if (!data.erro) {
                                    setForm(prev => ({
                                      ...prev,
                                      cep: maskedCep,
                                      endereco_residencial: data.logradouro,
                                      bairro: data.bairro,
                                      cidade: data.localidade,
                                      estado: data.uf
                                    }));
                                    toast.success("Endereço preenchido automaticamente");
                                  }
                                } catch (error) {
                                  console.error("Erro ao buscar CEP:", error);
                                }
                              }
                            }} 
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>
                       <div className="md:col-span-2 space-y-2">
                         <Label className="text-sm font-semibold">Endereço Residencial</Label>
                         <Input className="h-11" value={form.endereco_residencial} onChange={(e) => setForm({ ...form, endereco_residencial: e.target.value })} placeholder="Rua, número..." />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-sm font-semibold">Bairro</Label>
                         <Input className="h-11" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Bairro" />
                       </div>
                       <div className="md:col-span-2 space-y-2">
                         <Label className="text-sm font-semibold">Cidade</Label>
                         <Input className="h-11" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Cidade" />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-sm font-semibold">Estado</Label>
                        <Input className="h-11" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="UF" maxLength={2} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-border">
                     <h4 className="text-base font-bold flex items-center gap-2 text-primary/80">
                       <Settings className="h-4 w-4 text-muted-foreground" /> 
                       Observações Internas
                     </h4>
                     <Textarea 
                       placeholder="Anotações administrativas sobre o funcionário..." 
                       className="min-h-[120px] text-sm bg-muted/20"
                       value={form.notes}
                       onChange={(e) => setForm({ ...form, notes: e.target.value })}
                     />
                   </div>
                 </TabsContent>
 
                 <TabsContent value="permissoes" className="space-y-8">
                   <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-8">
                     <div className="flex items-center gap-4 border-b border-border pb-6">
                       <div className="bg-primary/10 p-3 rounded-xl">
                         <Shield className="h-6 w-6 text-primary" />
                       </div>
                       <div>
                         <h4 className="font-bold text-lg">Controle de Acesso e Segurança</h4>
                         <p className="text-sm text-muted-foreground">Defina as permissões de acesso e o papel global deste profissional.</p>
                       </div>
                     </div>
 
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {[
                         { id: 'can_access_system', label: 'Acesso ao Sistema', desc: 'Permitir login no portal web e aplicativo mobile' },
                         { id: 'can_receive_service_orders', label: 'Receber O.S.', desc: 'Pode ser vinculado como executor de ordens de serviço' },
                         { id: 'can_manage_materials', label: 'Gerenciar Materiais', desc: 'Permissão para solicitar e movimentar itens de estoque' },
                         { id: 'can_close_service_orders', label: 'Encerrar O.S.', desc: 'Permissão para finalizar e assinar ordens de serviço' },
                         { id: 'can_view_financial_data', label: 'Dados Financeiros', desc: 'Visualizar custos, valores e medições de serviços' },
                         { id: 'can_view_reports', label: 'BI e Relatórios', desc: 'Acesso ao painel de indicadores e exportação de dados' },
                       ].map((perm) => (
                         <div key={perm.id} className="flex items-center justify-between p-5 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-all group">
                           <div className="space-y-1">
                             <Label className="text-sm font-bold cursor-pointer" htmlFor={perm.id}>{perm.label}</Label>
                             <p className="text-xs text-muted-foreground leading-relaxed">{perm.desc}</p>
                           </div>
                           <Switch 
                             id={perm.id}
                             checked={(form as any)[perm.id]} 
                             onCheckedChange={(v) => setForm({ ...form, [perm.id]: v })} 
                           />
                         </div>
                       ))}
                     </div>
 
                     <div className="pt-8 border-t border-border space-y-4">
                       <div className="flex flex-col gap-1">
                         <Label className="text-sm font-bold uppercase text-primary/70 tracking-wider">Nível de Acesso Global (Role)</Label>
                         <p className="text-xs text-muted-foreground">Este perfil determina as permissões de interface e menus principais do sistema.</p>
                       </div>
                       <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                         <SelectTrigger className="h-12 border-primary/20 bg-primary/5 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           {ROLES.map((r) => (
                             <SelectItem key={r} value={r} className="py-3 font-medium">{ROLE_LABEL[r]}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                 </TabsContent>
 
                 <TabsContent value="operacional" className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                       <Label className="text-sm font-bold">Função Operacional Detalhada</Label>
                       <Input className="h-12" value={form.operational_role} onChange={(e) => setForm({ ...form, operational_role: e.target.value })} placeholder="Ex: Eletricista de Redes MT/BT" />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-sm font-bold">Tipo de Funcionário</Label>
                       <Select value={form.employee_type} onValueChange={(v) => setForm({ ...form, employee_type: v })}>
                         <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="management">Gestor / Gerência</SelectItem>
                           <SelectItem value="supervisor">Supervisor</SelectItem>
                           <SelectItem value="field_worker">Técnico de Campo</SelectItem>
                           <SelectItem value="auditor">Auditor</SelectItem>
                           <SelectItem value="stock">Estoquista / Almoxarifado</SelectItem>
                           <SelectItem value="admin">Administrativo</SelectItem>
                           <SelectItem value="finance">Financeiro</SelectItem>
                           <SelectItem value="purchasing">Comprador</SelectItem>
                           <SelectItem value="engineering">Engenharia</SelectItem>
                           <SelectItem value="quality">Qualidade / Segurança</SelectItem>
                           <SelectItem value="rh">Recursos Humanos</SelectItem>
                           <SelectItem value="sales">Comercial / Vendas</SelectItem>
                           <SelectItem value="outsourced">Terceirizado</SelectItem>
                           <SelectItem value="developer">Desenvolvedor / TI</SelectItem>
                           <SelectItem value="other">Outros</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
 
                   <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 mt-8 shadow-inner">
                     <h4 className="text-base font-bold flex items-center gap-3 mb-6 text-primary">
                       <Activity className="h-5 w-5" /> 
                       Métricas de Desempenho e Disponibilidade
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                       <div className="bg-white p-6 rounded-xl border border-border shadow-sm group hover:border-primary/50 transition-all">
                         <div className="text-3xl font-black text-primary mb-1">0</div>
                         <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">OS em Aberto</div>
                       </div>
                       <div className="bg-white p-6 rounded-xl border border-border shadow-sm group hover:border-green-500/50 transition-all">
                         <div className="text-3xl font-black text-green-600 mb-1">0</div>
                         <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Concluídas (Mês)</div>
                       </div>
                       <div className="bg-white p-6 rounded-xl border border-border shadow-sm group hover:border-amber-500/50 transition-all">
                         <div className="text-3xl font-black text-amber-600 mb-1">--</div>
                         <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Score / Produtividade</div>
                       </div>
                     </div>
                   </div>
                 </TabsContent>
 
                 <TabsContent value="historico" className="space-y-6">
                   <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-muted/5">
                     <div className="bg-muted/20 p-4 rounded-full mb-4">
                       <Activity className="h-12 w-12 opacity-20" />
                     </div>
                     <h5 className="font-bold text-lg text-foreground/70">Histórico de Atividade</h5>
                     <p className="text-sm max-w-xs text-center">Ainda não há registros de ações ou alterações para este profissional no sistema.</p>
                   </div>
                 </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {professional ? "Salvar Alterações" : "Efetivar Cadastro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
