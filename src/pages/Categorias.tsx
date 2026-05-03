import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Categorias() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("categorias").select("*").eq("ativo", true).order("ordem").then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <div>
      <PageHeader title="Categorias" description="Selecione uma categoria para ver suas atividades." />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((c) => (
          <Link key={c.id} to={`/app/atividades?categoria=${c.id}`}>
            <Card className="group flex items-center justify-between rounded-md border-border p-4 shadow-none transition hover:border-primary/40 hover:bg-accent/50">
              <div>
                <div className="text-sm font-medium tracking-tight">{c.nome}</div>
                {c.descricao && <div className="text-xs text-muted-foreground">{c.descricao}</div>}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" strokeWidth={1.5} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}