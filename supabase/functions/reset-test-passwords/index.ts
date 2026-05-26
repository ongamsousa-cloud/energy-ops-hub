import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const accounts: { email: string; password: string; nome: string; role: string; cargo: string }[] = [
    { email: "admin@teste.com",       password: "senha123!", nome: "Administrador Teste", role: "admin",       cargo: "Administrador" },
    { email: "gestor@teste.com",      password: "senha123",  nome: "Gestor Teste",        role: "gestor",      cargo: "Gestor" },
    { email: "supervisor@teste.com",  password: "senha123",  nome: "Supervisor Teste",    role: "supervisor",  cargo: "Supervisor" },
    { email: "campo@teste.com",       password: "senha123",  nome: "Técnico de Campo",    role: "campo",       cargo: "Técnico de Campo" },
    { email: "financeiro@teste.com",  password: "senha123",  nome: "Financeiro Teste",    role: "financeiro",  cargo: "Financeiro" },
    { email: "auditor@teste.com",     password: "senha123",  nome: "Auditor Teste",       role: "auditor",     cargo: "Auditor" },
    { email: "estoque@energyops.demo",password: "Estoque@2026", nome: "Almoxarifado",     role: "estoque",     cargo: "Almoxarife" },
    { email: "comercial@teste.com",   password: "senha123",  nome: "Comercial Teste",     role: "comercial",   cargo: "Comercial" },
    { email: "posvenda@teste.com",    password: "senha123",  nome: "Pós-venda Teste",     role: "posvenda",    cargo: "Pós-venda" },
  ];
  
  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  const client = new Client(dbUrl);
  await client.connect();

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: any[] = [];

  // Pre-fetch existing users by email
  const { data: list } = await supa.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const byEmail = new Map((list?.users ?? []).map((u: any) => [u.email?.toLowerCase(), u]));

  for (const acc of accounts) {
    try {
      let userId: string | null = null;
      const existing = byEmail.get(acc.email.toLowerCase());

      if (existing) {
        userId = existing.id;
        // Repair any NULL columns that block password login
        await client.queryObject`
          UPDATE auth.users
          SET aud = COALESCE(aud, 'authenticated'),
              role = COALESCE(role, 'authenticated'),
              instance_id = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
              confirmation_token = COALESCE(confirmation_token, ''),
              recovery_token = COALESCE(recovery_token, ''),
              email_change_token_new = COALESCE(email_change_token_new, ''),
              email_change = COALESCE(email_change, ''),
              email_change_token_current = COALESCE(email_change_token_current, ''),
              reauthentication_token = COALESCE(reauthentication_token, ''),
              phone_change = COALESCE(phone_change, ''),
              phone_change_token = COALESCE(phone_change_token, ''),
              email_confirmed_at = COALESCE(email_confirmed_at, now()),
              raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
              raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
          WHERE id = ${userId}`;
        await client.queryObject`
          INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
          SELECT gen_random_uuid(), u.id, 'email', u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
          FROM auth.users u
          WHERE u.id = ${userId}
            AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = u.id AND provider = 'email')`;

        const { error } = await supa.auth.admin.updateUserById(userId, {
          password: acc.password,
          email_confirm: true,
          user_metadata: { nome: acc.nome, role: acc.role },
        });
        if (error) throw error;
      } else {
        const { data: created, error } = await supa.auth.admin.createUser({
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { nome: acc.nome, role: acc.role },
        });
        if (error) throw error;
        userId = created.user!.id;
      }

      // Upsert profile (active, no forced password change)
      await supa.from("profiles").upsert({
        id: userId,
        nome: acc.nome,
        email: acc.email,
        ativo: true,
        cargo: acc.cargo,
        must_change_password: false,
      }, { onConflict: "id" });

      // Upsert role
      await supa.from("user_roles").upsert(
        { user_id: userId, role: acc.role },
        { onConflict: "user_id,role" }
      );

      results.push({ email: acc.email, ok: true });
    } catch (e: any) {
      results.push({ email: acc.email, ok: false, error: e?.message ?? String(e) });
    }
  }

  await client.end();

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
