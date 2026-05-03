import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Medicao() {
  const [data, setData] = useState<any[]>([]);
  useEffect(()=>{
    supabase.from("ordens_servico").select("total_umd_aprovada, obra:obras(numero,nome)").eq("status","aprovada").then(({ data }) => setData(data ?? []));
  },[]);
  const map = new Map<string, { nome: string; numero: string; umd: number }>();
  data.forEach((r:any) => {
    const k = r.obra?.numero ?? "-";
    const cur = map.get(k) ?? { nome: r.obra?.nome ?? "—", numero: k, umd: 0 };
    cur.umd += Number(r.total_umd_aprovada || 0); map.set(k, cur);
  });
  const linhas = Array.from(map.values()).sort((a,b)=>b.umd-a.umd);
  return (
    <div>
      <PageHeader title="Medição" description="UMD aprovada por obra." />
      <Card className="rounded-md border-border p-0 shadow-none">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Obra</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2 text-right">UMD aprovada</th></tr></thead>
          <tbody>{linhas.map((l)=>(<tr key={l.numero} className="border-b border-border last:border-0"><td className="px-3 py-2 font-mono text-xs">{l.numero}</td><td className="px-3 py-2">{l.nome}</td><td className="px-3 py-2 text-right tabular-nums">{l.umd.toFixed(2)}</td></tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}