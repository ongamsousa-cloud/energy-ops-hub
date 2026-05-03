import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function applyHsl(h: number, s: number, l: number) {
  const root = document.documentElement;
  root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
  root.style.setProperty("--primary-hover", `${h} ${s}% ${Math.max(l - 6, 5)}%`);
  root.style.setProperty("--primary-active", `${h} ${s}% ${Math.max(l - 11, 3)}%`);
  root.style.setProperty("--primary-glow", `${h} ${Math.min(s + 8, 100)}% ${Math.min(l + 9, 95)}%`);
  root.style.setProperty("--ring", `${h} ${s}% ${l}%`);
  root.style.setProperty("--destructive", `${h} ${s}% ${Math.max(l - 9, 5)}%`);
}

export function useAppTheme() {
  useEffect(() => {
    let mounted = true;
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "theme.primary_color")
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data?.value) return;
        const v: any = data.value;
        if (typeof v.h === "number") applyHsl(v.h, v.s, v.l);
      });
    return () => {
      mounted = false;
    };
  }, []);
}

export async function saveThemePrimary(h: number, s: number, l: number) {
  applyHsl(h, s, l);
  await supabase
    .from("app_settings")
    .upsert({ key: "theme.primary_color", value: { h, s, l } }, { onConflict: "key" });
}