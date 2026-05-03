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
  // Delete then recreate the broken @teste.com accounts
  const accounts = [
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", email: "admin@teste.com", role: "admin" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12", email: "gestor@teste.com", role: "gestor" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13", email: "supervisor@teste.com", role: "supervisor" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", email: "campo@teste.com", role: "campo" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15", email: "financeiro@teste.com", role: "financeiro" },
    { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16", email: "auditor@teste.com", role: "auditor" },
  ];
  
  const results: any[] = [];
  for (const a of accounts) {
    // Save existing profile/roles snapshot
    const { data: profile } = await supa.from("profiles").select("*").eq("id", a.id).maybeSingle();
    const { data: roles } = await supa.from("user_roles").select("role").eq("user_id", a.id);
    
    // Delete the broken auth user (CASCADE will remove profile/roles)
    await supa.auth.admin.deleteUser(a.id, true);
    
    // Recreate cleanly
    const { data: created, error: createErr } = await supa.auth.admin.createUser({
      email: a.email,
      password: NEW_PASSWORD,
      email_confirm: true,
      user_metadata: { nome: profile?.nome || a.email },
    });
    
    if (createErr) {
      results.push({ email: a.email, ok: false, error: createErr.message });
      continue;
    }
    
    const newId = created.user!.id;
    
    // Restore profile (handle_new_user trigger creates basic, we update)
    await supa.from("profiles").update({
      nome: profile?.nome || a.email,
      cargo: profile?.cargo,
      ativo: true,
    }).eq("id", newId);
    
    // Restore roles
    const rolesToInsert = (roles && roles.length) ? roles : [{ role: a.role }];
    for (const r of rolesToInsert) {
      await supa.from("user_roles").upsert({ user_id: newId, role: r.role });
    }
    
    results.push({ email: a.email, ok: true, new_id: newId });
  }
  
  return new Response(JSON.stringify({ password: NEW_PASSWORD, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
