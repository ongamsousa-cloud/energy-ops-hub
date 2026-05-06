import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
 import { Camera, Loader2, UserPlus, Save, Shield, Settings, Activity, Globe, Eye, EyeOff, Key, MapPin, Search } from "lucide-react";
 import 'react-phone-number-input/style.css';
 import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
 import pt from 'react-phone-number-input/locale/pt.json';
import { ROLE_LABEL, AppRole, useAuth } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Switch } from "@/components/ui/switch";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Textarea } from "@/components/ui/textarea";
 import { maskCPF, maskPhone, maskCEP, maskRG } from "@/lib/utils/masks";
 import { cepService } from "@/services/cepService";

interface ProfessionalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  professional?: any;
  departments: any[];
}

const ROLES: AppRole[] = ["admin", "gestor", "supervisor", "campo", "financeiro", "auditor", "estoque", "developer"];

export default function ProfessionalModal({ open, onOpenChange, onSuccess, professional, departments }: ProfessionalModalProps) {
  const { profile: currentUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const targetUserId = useMemo(() => {
    if (!professional) return null;
    return professional.profile_id || professional.user_id || (professional.id?.length > 30 ? professional.id : null);
  }, [professional]);

  const actualEmployeeId = useMemo(() => {
    if (!professional) return null;
    const employeeId = professional.employee_id || (professional.id?.length > 30 ? null : professional.id);
    return employeeId || (professional.id && !targetUserId ? professional.id : null);
  }, [professional, targetUserId]);

  const [searchingCep, setSearchingCep] = useState(false);
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
    whatsapp: "",
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
    matricula: "",
    service_code: "",
    operational_role: "",
    unidade_filial: "",
    tipo_vinculo: "CLT",
    supervisor_id: "",
    regiao_atuacao: "",
    veiculo_vinculado: "",
    horario_trabalho: "",
    servicos_habilitados: [] as string[],
    employee_type: "field_worker" as any,
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
    password: "",
  };

  const [form, setForm] = useState(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchSupervisorsAndServices();
      if (professional) {
        setForm({
          nome: professional.nome || "",
          email: professional.email || "",
          cargo: professional.cargo || "",
          especialidade: professional.especialidade || "",
          cpf: professional.cpf || "",
          rg: professional.rg || "",
          telefone: professional.telefone || "",
          whatsapp: professional.whatsapp || "",
            data_nascimento: professional.birth_date || professional.data_nascimento || "",
            endereco_residencial: professional.residential_address || professional.endereco_residencial || "",
            bairro: professional.neighborhood || professional.bairro || "",
            cidade: professional.city || professional.cidade || "",
            estado: professional.state || professional.estado || "",
            cep: professional.postal_code || professional.cep || "",
          data_admissao: professional.data_admissao || "",
          department_id: professional.department_id || "",
          role: (professional.user_roles?.[0]?.role as AppRole) || "campo",
          internal_company_code: professional.internal_company_code || "",
          matricula: professional.matricula || "",
          service_code: professional.service_code || "",
          operational_role: professional.operational_role || "",
          unidade_filial: professional.unidade_filial || "",
          tipo_vinculo: professional.tipo_vinculo || "CLT",
          supervisor_id: professional.supervisor_id || "",
          regiao_atuacao: professional.regiao_atuacao || "",
          veiculo_vinculado: professional.veiculo_vinculado || "",
          horario_trabalho: professional.horario_trabalho || "",
          servicos_habilitados: professional.servicos_habilitados || [],
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
           password: "",
         });
         setPhotoPreview(professional.foto_url || professional.photo_url || null);
       } else {
        setForm(initialFormState);
        setPhotoPreview(null);
      }
    }
  }, [open, professional]);

  const fetchSupervisorsAndServices = async () => {
    const [{ data: emps }, { data: profs_roles }, { data: servs }] = await Promise.all<any>([
      supabase.from("employees").select("id, full_name, user_id").neq("status", "desligado"),
      supabase.from("profiles").select("id, nome, user_roles(role)"),
      supabase.from("servicos").select("id, nome").eq("ativo", true)
    ]);
    
    // Get profiles with leadership roles
    const leadershipProfs = (profs_roles ?? []).filter((p: any) => 
      p.user_roles?.some((ur: any) => ["admin", "gestor", "supervisor"].includes(ur.role))
    );

    // Combine emps and profiles
    const supervisorList: any[] = [...(emps ?? [])];
    leadershipProfs.forEach(p => {
      if (!supervisorList.find(e => e.user_id === p.id)) {
        supervisorList.push({ id: p.id, full_name: p.nome, user_id: p.id });
      }
    });

    setSupervisors(supervisorList);
    setAllServices(servs ?? []);
  };

  const handleCepBlur = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setSearchingCep(true);
    try {
      const data = await cepService.buscarCep(cep);
      if (data && !data.error) {
        setForm(prev => ({
          ...prev,
          endereco_residencial: data.logradouro || prev.endereco_residencial,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado
        }));
        toast.success("Endereço preenchido automaticamente");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setSearchingCep(false);
    }
  };

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
      // In Profissionais.tsx, professional.id is the employee ID
      // Identificadores consistentes
      // Identificadores consistentes baseados no objeto recebido do Profissionais.tsx
      let finalUserId = targetUserId;
      if (!finalUserId && form.email) {
        const { data: profileByEmail } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", form.email)
          .maybeSingle();
        if (profileByEmail) finalUserId = profileByEmail.id;
      }
      let fotoUrl = professional?.foto_url;

      if (photoFile && (actualEmployeeId || targetUserId)) {
        fotoUrl = await uploadPhoto(actualEmployeeId || targetUserId);
      }

      const employeeData = {
        company_id: currentUserProfile?.company_id || professional?.company_id || null,
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
        admission_date: (form.admission_date || form.data_admissao) === "" ? null : (form.admission_date || form.data_admissao),
        termination_date: form.termination_date === "" ? null : form.termination_date,
        notes: form.notes,
        photo_url: fotoUrl || professional?.foto_url || null,
        user_id: finalUserId || null,
        document_rg: form.rg,
        birth_date: form.data_nascimento === "" ? null : form.data_nascimento,
        postal_code: form.cep,
        residential_address: form.endereco_residencial,
        neighborhood: form.bairro,
        city: form.cidade,
        state: form.estado,
        whatsapp: form.whatsapp,
        matricula: form.matricula,
        unidade_filial: form.unidade_filial,
        tipo_vinculo: form.tipo_vinculo,
        supervisor_id: form.supervisor_id === "" ? null : form.supervisor_id,
        regiao_atuacao: form.regiao_atuacao,
        veiculo_vinculado: form.veiculo_vinculado,
        horario_trabalho: form.horario_trabalho,
        servicos_habilitados: form.servicos_habilitados
      };

      let res;
      if (actualEmployeeId) {
        res = await supabase.from("employees").update(employeeData).eq("id", actualEmployeeId);
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
 

       if (finalUserId) {
         const updateData: any = {
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
           foto_url: fotoUrl,
           email: form.email
         };
 
         if (form.password) updateData.must_change_password = true;
 
          const { error: profileError } = await supabase.from("profiles").update(updateData).eq("id", finalUserId);
          
          if (profileError) {
             console.error("Erro ao atualizar profile:", profileError);
             // Não travar se for apenas erro de update no profile, mas avisar
             toast.warning("Dados do funcionário salvos, mas houve um erro ao sincronizar o perfil de acesso.");
          }
         if (profileError) throw profileError;
 
          await supabase.from("user_roles").delete().eq("user_id", finalUserId);
          await supabase.from("user_roles").insert({ user_id: finalUserId, role: form.role as any });
          
          if (actualEmployeeId || res.data?.id) {
            await supabase.from("employees").update({ user_id: finalUserId }).eq("id", actualEmployeeId || res.data.id);
          }
        }

       // Gerenciamento de usuário via Edge Function
       if (form.can_access_system && form.email && !finalUserId) {
        try {
          const { data, error } = await supabase.functions.invoke('manage-user', {
            body: {
              action: 'create',
              email: form.email,
              password: form.password || 'Mudar@123',
              userData: { nome: form.nome, role: form.role }
            }
          });
          
          if (error) throw error;
          
          if (data?.user?.id) {
            finalUserId = data.user.id;
            if (actualEmployeeId || res.data?.id) {
              await supabase.from("employees").update({ user_id: finalUserId }).eq("id", actualEmployeeId || res.data.id);
            }
            toast.success("Usuário criado e vinculado com sucesso!");
          }
        } catch (authErr: any) {
          console.error("Erro ao gerenciar usuário:", authErr);
          toast.warning("Dados salvos, mas houve erro ao criar acesso: " + (authErr.message || "Erro desconhecido"));
        }
      } else if (finalUserId && form.password) {
        // Update existing user password
        try {
          const { error } = await supabase.functions.invoke('manage-user', {
            body: {
              action: 'update',
              userId: finalUserId,
              password: form.password
            }
          });
          if (error) throw error;
          toast.success("Senha do usuário atualizada com sucesso!");
        } catch (authErr: any) {
          console.error("Erro ao atualizar senha:", authErr);
          toast.warning("Dados salvos, mas erro ao atualizar senha.");
        }
      }

      toast.success(actualEmployeeId ? "Cadastro atualizado com sucesso" : "Funcionário cadastrado com sucesso");
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro no handleSave:", err);
      let msg = err.message;
      if (msg.includes("employees_document_cpf_key")) msg = "Este CPF já está cadastrado para outro funcionário.";
      if (msg.includes("employees_email_key")) msg = "Este E-mail já está cadastrado para outro funcionário.";
      if (msg.includes("employees_internal_company_code_key")) msg = "Este Código Interno já está em uso.";
      if (msg.includes("employees_service_code_key")) msg = "Este Código de Serviço já está em uso.";
      
      toast.error("Erro ao salvar: " + msg);
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
            <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-3 flex flex-col items-center gap-4 border-b md:border-b-0 md:border-r border-border pb-8 md:pb-0 md:pr-8">
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

                   <div className="space-y-4 pt-4 border-t border-border">
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-[10px] uppercase font-bold text-primary mb-2">Resumo Operacional</p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-muted-foreground uppercase">Cód. Empresa</span>
                            <span className="text-sm font-mono font-bold">{form.internal_company_code || '---'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-muted-foreground uppercase">Cód. Serviço</span>
                            <span className="text-sm font-mono font-bold text-primary">{form.service_code || '---'}</span>
                          </div>
                        </div>
                      </div>
                   </div>
                 </div>
            </div>

            <div className="md:col-span-9">
              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
                   <TabsTrigger value="geral">Dados Pessoais</TabsTrigger>
                   <TabsTrigger value="profissional">Contrato & RH</TabsTrigger>
                   <TabsTrigger value="operacional">Operacional</TabsTrigger>
                   <TabsTrigger value="permissoes">Acessos & Permissões</TabsTrigger>
                   <TabsTrigger value="historico">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="geral" className="space-y-6 pb-8 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Nome Completo *</Label>
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: João Silva" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-xs font-medium">Email Corporativo *</Label>
                       <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@empresa.com" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Telefone Principal</Label>
                        <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">WhatsApp</Label>
                        <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-xs font-medium">CPF</Label>
                       <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">RG</Label>
                        <Input value={form.rg} onChange={(e) => setForm({ ...form, rg: maskRG(e.target.value) })} placeholder="00.000.000-0" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Data de Nascimento</Label>
                        <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
                    </div>
                  </div>
                  
                  <div className="space-y-6 pt-6 border-t border-border">
                     <h4 className="text-base font-bold flex items-center gap-2 text-primary/80"><MapPin className="h-4 w-4 text-muted-foreground" /> Endereço</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">CEP</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input 
                                value={form.cep} 
                                onChange={(e) => setForm({ ...form, cep: maskCEP(e.target.value) })} 
                                onBlur={handleCepBlur}
                                placeholder="00000-000" 
                                maxLength={9} 
                              />
                              {searchingCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              type="button" 
                              onClick={handleCepBlur} 
                              disabled={searchingCep}
                              className="shrink-0 h-10 w-10"
                            >
                              <Search className={`h-4 w-4 ${searchingCep ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                       <div className="md:col-span-2 space-y-1.5">
                         <Label className="text-xs font-medium">Logradouro</Label>
                         <Input value={form.endereco_residencial} onChange={(e) => setForm({ ...form, endereco_residencial: e.target.value })} placeholder="Rua, número..." />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium">Bairro</Label>
                         <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Bairro" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium">Cidade</Label>
                         <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Cidade" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium">Estado</Label>
                         <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="UF" maxLength={2} />
                       </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="profissional" className="space-y-6 pb-8 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Matrícula</Label>
                      <Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} placeholder="00000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Data de Admissão</Label>
                      <Input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Unidade / Filial</Label>
                      <Input value={form.unidade_filial} onChange={(e) => setForm({ ...form, unidade_filial: e.target.value })} placeholder="Sede Principal" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Tipo de Vínculo</Label>
                      <Select value={form.tipo_vinculo} onValueChange={(v) => setForm({ ...form, tipo_vinculo: v })}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLT">CLT</SelectItem>
                          <SelectItem value="PJ">PJ</SelectItem>
                          <SelectItem value="Temporário">Temporário</SelectItem>
                          <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-xs font-medium">Cargo</Label>
                       <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Engenheiro" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Supervisor</Label>
                      <Select value={form.supervisor_id} onValueChange={(v) => setForm({ ...form, supervisor_id: v })}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {supervisors.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="operacional" className="space-y-6 pb-8 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Cód. Serviço</Label>
                      <Input value={form.service_code} onChange={(e) => setForm({ ...form, service_code: e.target.value })} placeholder="TEC-000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Região de Atuação</Label>
                      <Input value={form.regiao_atuacao} onChange={(e) => setForm({ ...form, regiao_atuacao: e.target.value })} placeholder="Ex: SP Centro" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Veículo</Label>
                      <Input value={form.veiculo_vinculado} onChange={(e) => setForm({ ...form, veiculo_vinculado: e.target.value })} placeholder="Modelo/Placa" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Horário</Label>
                      <Input value={form.horario_trabalho} onChange={(e) => setForm({ ...form, horario_trabalho: e.target.value })} placeholder="08:00 - 18:00" />
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-border">
                     <Label className="text-xs font-medium">Observações</Label>
                     <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="..." className="min-h-[100px]" />
                  </div>
                </TabsContent>


                <TabsContent value="permissoes" className="space-y-6 pb-8 animate-in fade-in-50 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-primary"><Shield className="h-4 w-4" /> Controle de Acesso</h4>
                      <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Habilitar Login</Label>
                            <p className="text-[10px] text-muted-foreground">Permitir que este funcionário acesse o sistema</p>
                          </div>
                          <Switch checked={form.can_access_system} onCheckedChange={(v) => setForm({...form, can_access_system: v})} />
                        </div>
                        
                        {form.can_access_system && (
                          <div className="space-y-3 pt-3 border-t">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Perfil do Usuário</Label>
                              <Select value={form.role} onValueChange={(v) => setForm({...form, role: v as AppRole})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{targetUserId ? "Resetar Senha" : "Senha Provisória"}</Label>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  value={form.password} 
                                  onChange={(e) => setForm({...form, password: e.target.value})} 
                                  placeholder={targetUserId ? "Deixe em branco para manter" : "Mudar@123"} 
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="absolute right-0 top-0 h-full px-3" 
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-primary"><Settings className="h-4 w-4" /> Permissões Específicas</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { id: 'can_receive_service_orders', label: 'Receber Ordens de Serviço' },
                          { id: 'can_manage_materials', label: 'Gestão de Materiais / Estoque' },
                          { id: 'can_close_service_orders', label: 'Encerrar Ordens de Serviço' },
                          { id: 'can_view_financial_data', label: 'Acesso a Dados Financeiros' },
                          { id: 'can_view_reports', label: 'Visualizar Relatórios Gerenciais' }
                        ].map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                            <Label className="text-xs" htmlFor={p.id}>{p.label}</Label>
                            <Switch id={p.id} checked={(form as any)[p.id]} onCheckedChange={(v) => setForm({...form, [p.id]: v})} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-6 pb-8 animate-in fade-in-50 duration-300">
                   <p className="text-center py-10 text-muted-foreground">Sem histórico recente.</p>
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
