import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type Row = { tipo: string; item: string; descricao: string; unidade: string; umd: number };

export default function AtividadesImport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ inseridas: number; categorias: number; erros: string[] } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const parsed: Row[] = json.map((r) => {
        const k = Object.fromEntries(Object.entries(r).map(([kk, v]) => [kk.toLowerCase().trim(), v]));
        return {
          tipo: String(k["tipo de atividade"] ?? k["tipo"] ?? "").trim(),
          item: String(k["item"] ?? "").trim(),
          descricao: String(k["atividades"] ?? k["atividade"] ?? k["descrição"] ?? k["descricao"] ?? "").trim(),
          unidade: String(k["unidade"] ?? "").trim(),
          umd: Number(String(k["quantidade de umd"] ?? k["umd"] ?? "0").toString().replace(",", ".")) || 0,
        };
      }).filter((r) => r.item && r.descricao);
      setRows(parsed); setReport(null);
    };
    r.readAsBinaryString(f);
  }

  async function importar() {
    if (!rows.length) return;
    setBusy(true);
    const erros: string[] = [];
    let inseridas = 0, novasCats = 0;
    const { data: catsExist } = await supabase.from("categorias").select("id, nome");
    const catMap = new Map<string, string>((catsExist ?? []).map((c: any) => [c.nome.toLowerCase(), c.id]));
    const tiposSet = Array.from(new Set(rows.map((r) => r.tipo).filter(Boolean)));
    for (const t of tiposSet) {
      if (!catMap.has(t.toLowerCase())) {
        const { data, error } = await supabase.from("categorias").insert({ nome: t }).select("id").single();
        if (error) { erros.push(`Categoria ${t}: ${error.message}`); continue; }
        catMap.set(t.toLowerCase(), data.id); novasCats++;
      }
    }
    const payload = rows.map((r) => ({
      categoria_id: catMap.get(r.tipo.toLowerCase())!,
      codigo_item: r.item, descricao: r.descricao, unidade: r.unidade || "UN", umd_unitaria: r.umd,
    })).filter((r) => r.categoria_id);
    for (let i = 0; i < payload.length; i += 200) {
      const chunk = payload.slice(i, i + 200);
      const { error, count } = await supabase.from("atividades").upsert(chunk, { onConflict: "codigo_item", count: "exact" });
      if (error) { erros.push(error.message); continue; }
      inseridas += count ?? chunk.length;
    }
    setReport({ inseridas, categorias: novasCats, erros });
    setBusy(false);
    if (!erros.length) toast.success(`${inseridas} atividades importadas`);
    else toast.warning(`Concluído com ${erros.length} erros`);
  }

  return (
    <div>
      <PageHeader title="Importar atividades" description="Colunas: Tipo de atividade, Item, Atividades, Unidade, Quantidade de UMD." />
      <Card className="rounded-md border-border p-5 shadow-none">
        <input type="file" accept=".xlsx,.xls" onChange={onFile} className="text-sm" />
        {rows.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-sm"><strong>{rows.length}</strong> linhas válidas</div>
            <div className="max-h-80 overflow-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 text-left"><tr><th className="px-2 py-1">Tipo</th><th className="px-2 py-1">Item</th><th className="px-2 py-1">Atividade</th><th className="px-2 py-1">Un</th><th className="px-2 py-1">UMD</th></tr></thead>
                <tbody>{rows.slice(0, 50).map((r, i) => (<tr key={i} className="border-t border-border"><td className="px-2 py-1">{r.tipo}</td><td className="px-2 py-1 font-mono">{r.item}</td><td className="px-2 py-1">{r.descricao}</td><td className="px-2 py-1">{r.unidade}</td><td className="px-2 py-1 tabular-nums">{r.umd}</td></tr>))}</tbody>
              </table>
            </div>
            <Button onClick={importar} disabled={busy} className="mt-4">{busy ? "Importando…" : "Confirmar importação"}</Button>
          </div>
        )}
        {report && (
          <div className="mt-4 rounded border border-border bg-muted/20 p-3 text-xs">
            <div>Atividades: <strong>{report.inseridas}</strong> · Categorias novas: <strong>{report.categorias}</strong></div>
            {report.erros.length > 0 && (<div className="mt-2 text-destructive">Erros:<ul className="list-disc pl-5">{report.erros.slice(0, 10).map((e, i)=>(<li key={i}>{e}</li>))}</ul></div>)}
          </div>
        )}
      </Card>
    </div>
  );
}