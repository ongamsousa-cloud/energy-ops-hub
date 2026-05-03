import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  status?: string | null;
  start: Date;
  end: Date;
}

export default function OSDrillDownSheet({ open, onOpenChange, status, start, end }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [obraId, setObraId] = useState<string>("all");
  const [equipeId, setEquipeId] = useState<string>("all");
  const [profId, setProfId] = useState<string>("all");

  useEffect(() => {
    if (!open) return;
    supabase.from("obras").select("id, numero, nome").then(({ data }) => setObras(data ?? []));
    supabase.from("equipes").select("id, nome").then(({ data }) => setEquipes(data ?? []));
    supabase.from("profiles").select("id, nome").eq("ativo", true).then(({ data }) => setProfs(data ?? []));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let q = supabase
      .from("ordens_servico")
      .select("id, numero, status, total_umd, profissional:profiles!ordens_servico_profissional_id_fkey(nome), obra:obras(numero,nome), equipe_id, created_at")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);
    if (status) q = q.eq("status", status.replace(/ /g, "_") as any);
    if (obraId !== "all") q = q.eq("obra_id", obraId);
    if (equipeId !== "all") q = q.eq("equipe_id", equipeId);
    if (profId !== "all") q = q.eq("profissional_id", profId);
    q.then(({ data }) => setRows(data ?? []));
  }, [open, status, start, end, obraId, equipeId, profId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>OS — {status ?? "Todos"} ({rows.length})</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-2 my-4">
          <Select value={obraId} onValueChange={setObraId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Obra" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as obras</SelectItem>
              {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.numero} · {o.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={equipeId} onValueChange={setEquipeId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Equipe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as equipes</SelectItem>
              {equipes.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={profId} onValueChange={setProfId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {rows.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhuma OS encontrada.</div>}
          {rows.map((r) => (
            <Link key={r.id} to={`/app/os/${r.id}`} className="block rounded-md border border-border p-3 hover:border-primary hover:bg-primary/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm font-bold text-primary">{r.numero}</div>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {r.obra?.numero} · {r.obra?.nome} — {r.profissional?.nome}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                UMD: {Number(r.total_umd ?? 0).toFixed(2)} · {new Date(r.created_at).toLocaleDateString("pt-BR")}
              </div>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}