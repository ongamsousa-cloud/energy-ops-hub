import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
 import { Camera, Loader2, UserPlus, Save, Shield, Settings, Activity } from "lucide-react";
import { ROLE_LABEL, AppRole } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Switch } from "@/components/ui/switch";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Textarea } from "@/components/ui/textarea";
import { maskCPF, maskPhone } from "@/lib/utils/masks";

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(professional?.foto_url || null);
  
  const [form, setForm] = useState({
    nome: professional?.nome || "",
    email: professional?.email || "",
    cargo: professional?.cargo || "",
    especialidade: professional?.especialidade || "",
    cpf: professional?.cpf || "",
    rg: professional?.rg || "",
    telefone: professional?.telefone || "",
    data_nascimento: professional?.data_nascimento || "",
    endereco_residencial: professional?.endereco_residencial || "",
    bairro: professional?.bairro || "",
    cidade: professional?.cidade || "",
    estado: professional?.estado || "",
    cep: professional?.cep || "",
    data_admissao: professional?.data_admissao || "",
    department_id: professional?.department_id || "",
    role: (professional?.user_roles?.[0]?.role as AppRole) || ("campo" as AppRole),
    // Novas propriedades da tabela employees
    internal_company_code: professional?.internal_company_code || "",
    service_code: professional?.service_code || "",
    operational_role: professional?.operational_role || "",
    employee_type: professional?.employee_type || "field_worker",
    status: professional?.status || "active",
    is_active: professional?.is_active ?? true,
    can_access_system: professional?.can_access_system ?? false,
    can_receive_service_orders: professional?.can_receive_service_orders ?? true,
    can_manage_materials: professional?.can_manage_materials ?? false,
    can_close_service_orders: professional?.can_close_service_orders ?? false,
    can_view_financial_data: professional?.can_view_financial_data ?? false,
    can_view_reports: professional?.can_view_reports ?? false,
    notes: professional?.notes || "",
    admission_date: professional?.admission_date || professional?.data_admissao || "",
    termination_date: professional?.termination_date || "",
  });

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
      const userId = professional?.id;
      const fotoUrl = userId ? await uploadPhoto(userId) : photoPreview;

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
        photo_url: fotoUrl,
        user_id: userId || null
      };

      let res;
      if (professional?.employee_id) {
        res = await supabase.from("employees").update(employeeData).eq("id", professional.employee_id);
      } else {
        res = await supabase.from("employees").insert(employeeData);
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
         <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2">
            {professional ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {professional ? "Perfil do Funcionário" : "Cadastrar Novo Funcionário"}
          </DialogTitle>
          <DialogDescription>
            Informações completas, permissões e códigos de identificação.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3 flex flex-col items-center gap-4 border-r pr-6">
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

              <div className="w-full space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Status do Funcionário</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v, is_active: v === 'active' })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                      <SelectItem value="vacation">Em Férias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Identificação Profissional</Label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Cód. Interno Empresa</Label>
                      <Input 
                        className="h-8 text-xs font-mono" 
                        placeholder="FUNC-0000" 
                        value={form.internal_company_code} 
                        onChange={(e) => setForm({ ...form, internal_company_code: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Cód. Serviço (Operacional)</Label>
                      <Input 
                        className="h-8 text-xs font-mono" 
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

                <TabsContent value="geral" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium">Nome Completo *</Label>
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: João Silva" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Email Corporativo *</Label>
                      <Input value={form.email} disabled={!!professional} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@empresa.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Telefone / WhatsApp</Label>
                      <Input 
                         value={form.telefone} 
                         onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} 
                         placeholder="+55 (00) 00000-0000" 
                       />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">CPF</Label>
                      <Input 
                         value={form.cpf} 
                         onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} 
                         placeholder="000.000.000-00" 
                       />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Data de Admissão</Label>
                      <Input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Cargo / Função Administrativa</Label>
                      <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Engenheiro de Campo" />
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

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" /> 
                      Observações Internas
                    </h4>
                    <Textarea 
                      placeholder="Anotações administrativas sobre o funcionário..." 
                      className="min-h-[100px] text-sm"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="permissoes" className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                    <div className="flex items-center gap-3 border-b pb-4 mb-4">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold text-sm">Controle de Acesso</h4>
                        <p className="text-xs text-muted-foreground">Defina o que este profissional pode fazer no sistema.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Acesso ao Sistema</Label>
                          <p className="text-[11px] text-muted-foreground">Permitir login no sistema/app</p>
                        </div>
                        <Switch 
                          checked={form.can_access_system} 
                          onCheckedChange={(v) => setForm({ ...form, can_access_system: v })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Receber O.S.</Label>
                          <p className="text-[11px] text-muted-foreground">Pode ser vinculado como executor</p>
                        </div>
                        <Switch 
                          checked={form.can_receive_service_orders} 
                          onCheckedChange={(v) => setForm({ ...form, can_receive_service_orders: v })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Gerenciar Materiais</Label>
                          <p className="text-[11px] text-muted-foreground">Solicitar e movimentar estoque</p>
                        </div>
                        <Switch 
                          checked={form.can_manage_materials} 
                          onCheckedChange={(v) => setForm({ ...form, can_manage_materials: v })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Encerrar O.S.</Label>
                          <p className="text-[11px] text-muted-foreground">Permissão para finalizar serviços</p>
                        </div>
                        <Switch 
                          checked={form.can_close_service_orders} 
                          onCheckedChange={(v) => setForm({ ...form, can_close_service_orders: v })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Dados Financeiros</Label>
                          <p className="text-[11px] text-muted-foreground">Visualizar custos e medição</p>
                        </div>
                        <Switch 
                          checked={form.can_view_financial_data} 
                          onCheckedChange={(v) => setForm({ ...form, can_view_financial_data: v })} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Relatórios</Label>
                          <p className="text-[11px] text-muted-foreground">Acesso ao módulo de BI e exportações</p>
                        </div>
                        <Switch 
                          checked={form.can_view_reports} 
                          onCheckedChange={(v) => setForm({ ...form, can_view_reports: v })} 
                        />
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t space-y-3">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Nível de Acesso Global</Label>
                      <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground italic">O perfil global determina a interface principal do usuário.</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="operacional" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Função Operacional</Label>
                      <Input value={form.operational_role} onChange={(e) => setForm({ ...form, operational_role: e.target.value })} placeholder="Ex: Eletricista de Redes" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Tipo de Funcionário</Label>
                      <Select value={form.employee_type} onValueChange={(v) => setForm({ ...form, employee_type: v })}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Interno / Administrativo</SelectItem>
                          <SelectItem value="field_worker">Técnico de Campo</SelectItem>
                          <SelectItem value="outsourced">Terceirizado</SelectItem>
                          <SelectItem value="management">Gestão / Executivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mt-6">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-4 text-primary">
                      <Activity className="h-4 w-4" /> 
                      Métricas e Disponibilidade
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-card p-3 rounded border shadow-sm">
                        <div className="text-2xl font-bold text-primary">0</div>
                        <div className="text-[10px] text-muted-foreground uppercase">OS em Aberto</div>
                      </div>
                      <div className="bg-card p-3 rounded border shadow-sm">
                        <div className="text-2xl font-bold text-green-600">0</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Concluídas (Mês)</div>
                      </div>
                      <div className="bg-card p-3 rounded border shadow-sm">
                        <div className="text-2xl font-bold text-amber-600">--</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Produtividade</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Activity className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">Nenhum registro de atividade encontrado.</p>
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
