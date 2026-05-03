import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";

export default function ObraDetalhe() {
  const { id } = useParams();
  const [obra, setObra] = useState<any>(null);
  const [oss, setOss] = useState<any[]>([]);
  useEffect(() => {
    if (!id) return;
    supabase.from("obras").select("*").eq("id", id).maybeSingle().then(({ data }) => setObra(data));
    supabase.from("ordens_servico").select("*, profissional:profiles!ordens_servico_profissional_id_fkey(nome)").eq("obra_id", id).order("created_at", { ascending: false }).then(({ data }) => setOss(data ?? []));
  }, [id]);
  if (!obra) return <div className="text-sm text-muted-foreground">Carregando…</div>;
  const totalUmd = oss.reduce((a, r) => a + Number(r.total_umd_aprovada || 0), 0);
  return (
    <div>
      <PageHeader title={obra.nome} description={`Obra ${obra.numero}`} actions={<StatusBadge status={obra.status} />} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-md border-border p-4 shadow-none"><div className="text-xs text-muted-foreground">Local</div><div className="mt-1 text-sm">{[obra.endereco, obra.cidade, obra.estado].filter(Boolean).join(", ") || "—"}</div></Card>
        <Card className="rounded-md border-border p-4 shadow-none"><div className="text-xs text-muted-foreground">OS vinculadas</div><div className="mt-1 text-2xl font-semibold">{oss.length}</div></Card>
        <Card className="rounded-md border-border p-4 shadow-none"><div className="text-xs text-muted-foreground">UMD aprovada</div><div className="mt-1 text-2xl font-semibold">{totalUmd.toFixed(2)}</div></Card>
      </div>
      <h2 className="mt-8 mb-3 text-sm font-medium">Ordens de Serviço</h2>
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Número</th><th className="px-3 py-2">Profissional</th><th className="px-3 py-2">UMD</th><th className="px-3 py-2">Status</th></tr></thead>
          <tbody>{oss.map((r) => (<tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/50"><td className="px-3 py-2 font-mono text-xs"><Link to={`/app/os/${r.id}`} className="hover:underline">{r.numero}</Link></td><td className="px-3 py-2">{r.profissional?.nome ?? "—"}</td><td className="px-3 py-2">{Number(r.total_umd ?? 0).toFixed(2)}</td><td className="px-3 py-2"><StatusBadge status={r.status} /></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}