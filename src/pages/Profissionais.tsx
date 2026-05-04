import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
 import { ROLE_LABEL, AppRole, useAuth } from "@/lib/auth";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Shield, UserPlus, Search, MoreHorizontal, Settings, Key, UserMinus } from "lucide-react";
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
  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("*, user_roles(role), departments(id,name)")
      .order("nome");
    setRows(data ?? []);
    const { data: depts } = await supabase.from("departments").select("id,name").eq("active", true).order("name");
    setDepartments(depts ?? []);
  }
  useEffect(() => { load(); }, []);
  async function setRole(uid: string, role: AppRole) {
    await supabase.from("user_roles").delete().eq("user_id", uid);
     const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as any });
    if (error) toast.error(error.message); else { toast.success("Perfil atualizado"); load(); }
  }
  async function setDept(uid: string, deptId: string) {
    const { error } = await supabase.from("profiles").update({ department_id: deptId }).eq("id", uid);
    if (error) toast.error(error.message); else { toast.success("Departamento atualizado"); load(); }
  }
  return (
    <div>
      <PageHeader title="Profissionais" description="Equipe e papéis de acesso." />
      {rows.length === 0 ? <EmptyState title="Sem profissionais" /> : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Cargo</th><th className="px-3 py-2 w-56">Perfil</th><th className="px-3 py-2 w-56">Departamento</th></tr></thead>
            <tbody>{rows.map((p)=>{ const role = p.user_roles?.[0]?.role as AppRole | undefined; return (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{p.nome}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.email}</td>
                <td className="px-3 py-2">{p.cargo ?? "—"}</td>
                <td className="px-3 py-2">
                  <Select value={role ?? "campo"} onValueChange={(v)=>setRole(p.id, v as AppRole)}>
                    <SelectTrigger className="h-8"><SelectValue/></SelectTrigger>
                    <SelectContent>{ROLES.map((r)=>(<SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>))}</SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select value={p.department_id ?? ""} onValueChange={(v)=>setDept(p.id, v)}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="—"/></SelectTrigger>
                    <SelectContent>{departments.map((d)=>(<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                  </Select>
                </td>
              </tr>
            );})}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}