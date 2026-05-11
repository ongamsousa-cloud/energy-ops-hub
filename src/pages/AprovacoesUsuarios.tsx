import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABEL, AppRole } from "@/lib/auth";
import { notificationService } from "@/services";
import { toast } from "@/components/ui/sonner";
import { Check, X } from "lucide-react";

const ROLES: AppRole[] = ["admin", "gestor", "supervisor", "campo", "financeiro", "auditor", "estoque"];
const ROLE_TO_DEPT: Record<AppRole, string> = {
  admin: "Administração",
  gestor: "Operação",
  supervisor: "Operação",
  campo: "Operação",
  financeiro: "Financeiro",
   auditor: "Auditoria",
   estoque: "Almoxarifado / Estoque",
   developer: "Sistemas",
 };

export default function AprovacoesUsuarios() {
  const [rows, setRows] = useState<any[]>([]);
  const [roleSel, setRoleSel] = useState<Record<string, AppRole>>({});
  const [deptSel, setDeptSel] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,nome,email,cargo,created_at")
      .eq("ativo", false)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    const { data: depts } = await supabase.from("departments").select("id,name").eq("active", true).order("name");
    setDepartments(depts ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    const role = roleSel[id] ?? "campo";
    const deptName = deptSel[id] ?? ROLE_TO_DEPT[role];
    const dept = departments.find(d => d.name === deptName);
     const { error: rErr } = await supabase.from("user_roles").insert({ user_id: id, role: role as any });
    if (rErr && !rErr.message.includes("duplicate")) {
      toast.error(rErr.message); return;
    }
    const updates: any = { ativo: true };
    if (dept?.id) updates.department_id = dept.id;
    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await notificationService.criarNotificacao({
      user_id: id,
      title: "Conta aprovada",
      message: "Seu cadastro foi liberado pelo administrador. Você já pode acessar o sistema.",
      type: "success"
    });
    toast.success("Usuário aprovado");
    load();
  }

  async function reject(id: string) {
    if (!confirm("Rejeitar e remover este cadastro?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cadastro rejeitado");
    load();
  }

  return (
    <div>
      <PageHeader title="Aprovações de Usuários" description="Novos cadastros aguardando liberação." />
      {loading ? null : rows.length === 0 ? (
        <EmptyState title="Nenhum cadastro pendente" />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2 w-48">Função</th>
                <th className="px-3 py-2 w-56">Departamento</th>
                <th className="px-3 py-2 w-44 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{p.nome}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.email}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={roleSel[p.id] ?? "campo"}
                      onValueChange={(v) => setRoleSel({ ...roleSel, [p.id]: v as AppRole })}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={deptSel[p.id] ?? ROLE_TO_DEPT[roleSel[p.id] ?? "campo"]}
                      onValueChange={(v) => setDeptSel({ ...deptSel, [p.id]: v })}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button size="sm" onClick={() => approve(p.id)}>
                      <Check className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(p.id)}>
                      <X className="h-4 w-4 mr-1" /> Rejeitar
                    </Button>
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