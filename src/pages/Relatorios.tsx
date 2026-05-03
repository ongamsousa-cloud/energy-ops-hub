import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function Relatorios() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("os_atividades").select(`
      id, quantidade, unidade, umd_total, status, created_at,
      atividade:atividades(codigo_item,descricao),
      categoria:categorias(nome),
      os:ordens_servico(numero, status, obra:obras(numero,nome), profissional:profiles!ordens_servico_profissional_id_fkey(nome))
    `).order("created_at", { ascending: false }).limit(1000).then(({ data }) => setRows(data ?? []));
  }, []);
  function exportXlsx() {
    if (!rows.length) return toast.warning("Sem dados");
    const flat = rows.map((r: any) => ({
      OS: r.os?.numero, Status_OS: r.os?.status, Obra: r.os?.obra?.nome, Numero_Obra: r.os?.obra?.numero,
      Profissional: r.os?.profissional?.nome, Categoria: r.categoria?.nome,
      Codigo: r.atividade?.codigo_item, Atividade: r.atividade?.descricao,
      Quantidade: r.quantidade, Unidade: r.unidade, UMD_Total: r.umd_total,
      Status_Lancamento: r.status, Data: r.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
    XLSX.writeFile(wb, `relatorio_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
  return (
    <div>
      <PageHeader title="Relatórios" description="Lançamentos consolidados." actions={<Button size="sm" onClick={exportXlsx}>Exportar Excel</Button>}/>
      <Card className="rounded-md border-border p-0 shadow-none">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">OS</th><th className="px-3 py-2">Obra</th><th className="px-3 py-2">Profissional</th><th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Atividade</th><th className="px-3 py-2 text-right">Qtd</th><th className="px-3 py-2 text-right">UMD</th></tr></thead>
            <tbody>{rows.map((r:any)=>(<tr key={r.id} className="border-b border-border last:border-0"><td className="px-3 py-2 font-mono text-xs">{r.os?.numero}</td><td className="px-3 py-2">{r.os?.obra?.numero}</td><td className="px-3 py-2 text-muted-foreground">{r.os?.profissional?.nome}</td><td className="px-3 py-2">{r.categoria?.nome}</td><td className="px-3 py-2">{r.atividade?.descricao}</td><td className="px-3 py-2 text-right tabular-nums">{Number(r.quantidade).toFixed(2)} {r.unidade}</td><td className="px-3 py-2 text-right tabular-nums">{Number(r.umd_total).toFixed(2)}</td></tr>))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}