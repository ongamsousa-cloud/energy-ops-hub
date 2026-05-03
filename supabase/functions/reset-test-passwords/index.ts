import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const NEW_PASSWORD = "Energy@2026!Ops";
  const ids = [
    "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
    "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
    "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
    "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15",
    "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16",
  ];
  
  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  const client = new Client(dbUrl);
  await client.connect();
  
  const fixed: any[] = [];
  // 1. Repair NULL aud / role / instance_id on broken users
  for (const id of ids) {
    const r = await client.queryObject<{ email: string }>`
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
      WHERE id = ${id}
      RETURNING email`;
    if (r.rows[0]) fixed.push({ id, email: r.rows[0].email, repaired: true });
    
    // 2. Ensure auth.identities row exists
    await client.queryObject`
      INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
      SELECT gen_random_uuid(), u.id, 'email', u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
      FROM auth.users u
      WHERE u.id = ${id}
        AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = u.id AND provider = 'email')`;
  }
  
  await client.end();
  
  // 3. Now use admin API to reset passwords (should work now that rows are valid)
  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  const results: any[] = [];
  for (const id of ids) {
    const { error } = await supa.auth.admin.updateUserById(id, {
      password: NEW_PASSWORD,
      email_confirm: true,
    });
    results.push({ id, ok: !error, error: error?.message });
  }
  
  return new Response(JSON.stringify({ password: NEW_PASSWORD, fixed, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
