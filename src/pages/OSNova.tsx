import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function OSNova() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [obras, setObras] = useState<any[]>([]);
  const [obraId, setObraId] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.from("obras").select("id,numero,nome").eq("ativo", true).order("numero").then(({ data }) => setObras(data ?? [])); }, []);
  function getGeo(): Promise<{ lat?: number; lng?: number }> {
    return new Promise((res) => {
      if (!navigator.geolocation) return res({});
      navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res({}), { timeout: 5000 });
    });
  }
  async function iniciar() {
    if (!obraId) return toast.error("Selecione a obra");
    setBusy(true);
    const geo = await getGeo();
    const { data, error } = await supabase.from("ordens_servico").insert({
      obra_id: obraId, profissional_id: user!.id, status: "iniciada",
      inicio_lat: geo.lat, inicio_lng: geo.lng, created_by: user!.id,
    }).select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("OS iniciada"); nav(`/app/os/${data.id}`);
  }
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Iniciar Ordem de Serviço" description="Registre suas atividades." />
      <Card className="rounded-md border-border p-5 shadow-none">
        <div className="mb-3 inline-block rounded border border-border bg-muted/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Controle de Serviços Elétricos</div>
        <div className="space-y-4">
          <div><Label>Profissional</Label><Input value={profile?.nome ?? ""} disabled className="bg-muted/30" /></div>
          <div><Label>Obra *</Label>
            <Select value={obraId} onValueChange={setObraId}>
              <SelectTrigger><SelectValue placeholder="Selecione a obra"/></SelectTrigger>
              <SelectContent>{obras.map((o)=>(<SelectItem key={o.id} value={o.id}>{o.numero} — {o.nome}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={iniciar} disabled={busy}>{busy ? "Iniciando…" : "Iniciar Ordem de Serviço"}</Button>
        </div>
      </Card>
    </div>
  );
}