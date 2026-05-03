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
  // Hardcoded IDs from auth.users (safer than listUsers which has issues)
  const accounts = [
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", email: "admin@teste.com" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12", email: "gestor@teste.com" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13", email: "supervisor@teste.com" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", email: "campo@teste.com" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15", email: "financeiro@teste.com" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16", email: "auditor@teste.com" },
    { id: "73fb8ca4-27da-4479-a857-19c7851db81f", email: "admin@energyops.demo" },
  ];
  
  const results: any[] = [];
  for (const a of accounts) {
    const { error } = await supa.auth.admin.updateUserById(a.id, {
      password: NEW_PASSWORD,
      email_confirm: true,
    });
    results.push({ email: a.email, ok: !error, error: error?.message });
  }
  
  // estoque already done previously
  return new Response(JSON.stringify({ password: NEW_PASSWORD, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
