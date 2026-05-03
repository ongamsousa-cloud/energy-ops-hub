import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function OSList() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("ordens_servico")
      .select("*, obra:obras(numero,nome), profissional:profiles!ordens_servico_profissional_id_fkey(nome)")
      .order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div>
      <PageHeader title="Ordens de Serviço" actions={
        <Link to="/app/os/nova"><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Iniciar OS</Button></Link>
      } />
      {rows.length === 0 ? <EmptyState title="Nenhuma OS" description="Inicie uma nova OS para começar." /> : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Número</th><th className="px-3 py-2">Obra</th><th className="px-3 py-2">Profissional</th><th className="px-3 py-2">UMD</th><th className="px-3 py-2">Status</th></tr></thead>
            <tbody>{rows.map((r)=>(<tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/50"><td className="px-3 py-2 font-mono text-xs"><Link to={`/app/os/${r.id}`} className="hover:underline">{r.numero}</Link></td><td className="px-3 py-2">{r.obra?.numero} · {r.obra?.nome}</td><td className="px-3 py-2 text-muted-foreground">{r.profissional?.nome}</td><td className="px-3 py-2 tabular-nums">{Number(r.total_umd ?? 0).toFixed(2)}</td><td className="px-3 py-2"><StatusBadge status={r.status} /></td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}