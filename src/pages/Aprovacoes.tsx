import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";

export default function Aprovacoes() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("ordens_servico")
      .select("*, obra:obras(numero,nome), profissional:profiles!ordens_servico_profissional_id_fkey(nome)")
      .in("status", ["aguardando_revisao","corrigida","em_revisao"]).order("fim_em", { ascending: true })
      .then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div>
      <PageHeader title="Aprovações" description="OS aguardando revisão." />
      {rows.length === 0 ? <EmptyState title="Tudo em dia" /> : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">OS</th><th className="px-3 py-2">Obra</th><th className="px-3 py-2">Profissional</th><th className="px-3 py-2">UMD</th><th className="px-3 py-2">Status</th></tr></thead>
            <tbody>{rows.map((r)=>(<tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/50"><td className="px-3 py-2 font-mono text-xs"><Link to={`/app/os/${r.id}`} className="hover:underline">{r.numero}</Link></td><td className="px-3 py-2">{r.obra?.numero} · {r.obra?.nome}</td><td className="px-3 py-2 text-muted-foreground">{r.profissional?.nome}</td><td className="px-3 py-2 tabular-nums">{Number(r.total_umd ?? 0).toFixed(2)}</td><td className="px-3 py-2"><StatusBadge status={r.status}/></td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}