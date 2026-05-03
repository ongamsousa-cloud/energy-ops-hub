import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  const emails = [
    "admin@teste.com","gestor@teste.com","supervisor@teste.com",
    "campo@teste.com","financeiro@teste.com","auditor@teste.com",
    "estoque@energyops.demo","admin@energyops.demo"
  ];
  
  const results: any[] = [];
  for (const email of emails) {
    const { data: list } = await supa.auth.admin.listUsers();
    const u = list?.users?.find((x: any) => x.email === email);
    if (u) {
      const { error } = await supa.auth.admin.updateUserById(u.id, {
        password: "Energia123!",
        email_confirm: true,
      });
      results.push({ email, ok: !error, error: error?.message });
    } else {
      // create
      const { error } = await supa.auth.admin.createUser({
        email, password: "Energia123!", email_confirm: true,
      });
      results.push({ email, created: !error, error: error?.message });
    }
  }
  
  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
