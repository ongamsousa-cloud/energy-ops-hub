import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";

export default function Atividades() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const cat = params.get("categoria") ?? "";
  useEffect(() => { supabase.from("categorias").select("*").order("ordem").then(({ data }) => setCats(data ?? [])); }, []);
  useEffect(() => {
    let qb = supabase.from("atividades").select("*, categoria:categorias(nome)").eq("ativo", true).order("codigo_item").limit(500);
    if (cat) qb = qb.eq("categoria_id", cat);
    qb.then(({ data }) => setRows(data ?? []));
  }, [cat]);
  const filtered = rows.filter((r) => !q || r.codigo_item.toLowerCase().includes(q.toLowerCase()) || r.descricao.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Atividades" description="Catálogo técnico com unidades e UMD." />
      <div className="mb-3 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Buscar código ou descrição…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <Select value={cat || "all"} onValueChange={(v)=>{ const p=new URLSearchParams(params); v==="all"?p.delete("categoria"):p.set("categoria",v); setParams(p); }}>
          <SelectTrigger className="max-w-xs"><SelectValue placeholder="Categoria"/></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas categorias</SelectItem>{cats.map((c)=>(<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? <EmptyState title="Nenhuma atividade" description="Use a importação Excel para popular." /> : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Descrição</th><th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Unidade</th><th className="px-3 py-2 text-right">UMD</th></tr></thead>
            <tbody>{filtered.map((a)=>(<tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/50"><td className="px-3 py-2 font-mono text-xs">{a.codigo_item}</td><td className="px-3 py-2">{a.descricao}</td><td className="px-3 py-2 text-muted-foreground">{a.categoria?.nome}</td><td className="px-3 py-2">{a.unidade}</td><td className="px-3 py-2 text-right tabular-nums">{Number(a.umd_unitaria).toFixed(4)}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}