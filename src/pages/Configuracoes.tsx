import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { saveThemePrimary } from "@/hooks/useAppTheme";
import { toast } from "sonner";
import TwoFactorSetup from "@/components/TwoFactorSetup";

const PRESETS = [
  { name: "Vermelho", h: 0, s: 72, l: 51 },
  { name: "Azul", h: 220, s: 78, l: 50 },
  { name: "Verde", h: 142, s: 70, l: 38 },
  { name: "Laranja", h: 24, s: 90, l: 50 },
  { name: "Roxo", h: 270, s: 65, l: 50 },
  { name: "Rosa", h: 330, s: 75, l: 55 },
];

export default function Configuracoes() {
  const [h, setH] = useState(0);
  const [s, setS] = useState(72);
  const [l, setL] = useState(51);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "theme.primary_color")
      .maybeSingle()
      .then(({ data }) => {
        const v: any = data?.value;
        if (v?.h != null) {
          setH(v.h);
          setS(v.s);
          setL(v.l);
        }
      });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await saveThemePrimary(h, s, l);
      toast.success("Cor principal atualizada");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Personalize sua conta e a aparência do sistema" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
        <TwoFactorSetup />

        <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-1">Cor principal do sistema</h2>
          <p className="text-sm text-muted-foreground">Aplicada em botões, links, badges e destaques.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setH(p.h);
                setS(p.s);
                setL(p.l);
              }}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary"
            >
              <span
                className="h-5 w-5 rounded-full border border-border"
                style={{ background: `hsl(${p.h} ${p.s}% ${p.l}%)` }}
              />
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Matiz (H)</Label>
            <Input type="number" min={0} max={360} value={h} onChange={(e) => setH(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Saturação (S%)</Label>
            <Input type="number" min={0} max={100} value={s} onChange={(e) => setS(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Luminosidade (L%)</Label>
            <Input type="number" min={0} max={100} value={l} onChange={(e) => setL(Number(e.target.value))} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-lg border border-border shadow-sm"
            style={{ background: `hsl(${h} ${s}% ${l}%)` }}
          />
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar e aplicar"}
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
}