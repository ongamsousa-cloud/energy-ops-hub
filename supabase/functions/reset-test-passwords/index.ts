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
  
  const NEW_PASSWORD = "Energy@2026!Ops";
  const emails = [
    "admin@teste.com","gestor@teste.com","supervisor@teste.com",
    "campo@teste.com","financeiro@teste.com","auditor@teste.com",
    "estoque@energyops.demo","admin@energyops.demo"
  ];
  
  // Get all users with pagination
  const allUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data } = await supa.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data?.users?.length) break;
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  
  const results: any[] = [];
  for (const email of emails) {
    const u = allUsers.find((x: any) => x.email === email);
    if (u) {
      const { error } = await supa.auth.admin.updateUserById(u.id, {
        password: NEW_PASSWORD,
        email_confirm: true,
      });
      results.push({ email, ok: !error, error: error?.message });
    } else {
      results.push({ email, error: "user not found" });
    }
  }
  
  return new Response(JSON.stringify({ password: NEW_PASSWORD, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
