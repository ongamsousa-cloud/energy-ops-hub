import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, Loader2, UserPlus, Save } from "lucide-react";
import { ROLE_LABEL, AppRole } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    role: professional?.user_roles?.[0]?.role || "campo" as AppRole,
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
    if (!form.nome || !form.email) return toast.error("Nome e Email são obrigatórios");
    
    setLoading(true);
    try {
      let userId = professional?.id;

      if (userId) {
        const fotoUrl = await uploadPhoto(userId);
        
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
          data_admissao: form.data_admissao === "" ? null : form.data_admissao,
          department_id: form.department_id === "" ? null : form.department_id,
          foto_url: fotoUrl
        }).eq("id", userId);

        if (profileError) throw profileError;

        await supabase.from("user_roles").delete().eq("user_id", userId);
        await supabase.from("user_roles").insert({ user_id: userId, role: form.role as any });

        toast.success("Profissional atualizado com sucesso");
      } else {
        toast.info("Para novos acessos, o usuário deve se cadastrar com o email corporativo e ser aprovado na aba de Aprovações.");
      }
      
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
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            {professional ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {professional ? "Editar Profissional" : "Cadastrar Profissional"}
          </DialogTitle>
          <DialogDescription>
            Configure os dados pessoais, profissionais e de acesso ao sistema.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 flex flex-col items-center gap-4 border-r pr-6">
              <div className="relative group">
                <Avatar className="h-40 w-40 border-4 border-muted">
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
                  <Label>Nível de Acesso (Perfil)</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Email Corporativo *</Label>
                  <Input value={form.email} disabled={!!professional} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>RG</Label>
                  <Input value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data de Admissão</Label>
                  <Input type="date" value={form.data_admissao} onChange={(e) => setForm({ ...form, data_admissao: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Função</Label>
                  <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Engenheiro de Campo" />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} placeholder="Ex: Redes de Alta Tensão" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold">Endereço Residencial</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Rua / Logradouro</Label>
                    <Input value={form.endereco_residencial} onChange={(e) => setForm({ ...form, endereco_residencial: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {professional ? "Salvar Alterações" : "Cadastrar Profissional"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
