import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const EMAIL = "ongam.sousa@gmail.com";
  const PASSWORD = "123456";
  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Try find existing user
  let userId: string | null = null;
  const { data: list } = await supa.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === EMAIL);
  if (existing) {
    userId = existing.id;
    await supa.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true });
  } else {
    const { data: created, error } = await supa.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome: "Engenharia de Software" },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    userId = created.user!.id;
  }

  // Profile + must_change_password
  await supa.from("profiles").upsert({
    id: userId,
    nome: "Engenharia de Software",
    email: EMAIL,
    ativo: true,
    cargo: "Developer",
    must_change_password: true,
  }, { onConflict: "id" });

  // Role developer
  await supa.from("user_roles").upsert(
    { user_id: userId, role: "developer" },
    { onConflict: "user_id,role" }
  );

  return new Response(JSON.stringify({ ok: true, user_id: userId, email: EMAIL }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});