import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser(authHeader?.replace('Bearer ', '') ?? '')

    if (authError || !requester) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requester.id);

    const userRoles = roles?.map(r => r.role) || [];
    const isAuthorized = userRoles.includes('admin') || userRoles.includes('gestor') || userRoles.includes('developer');

    if (!isAuthorized) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin or Gestor role required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { action, userId, email, password, userData } = await req.json()

    if (action === 'create') {
      const { data, error } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userData
      })
      if (error) throw error

      if (data.user) {
        // Ensure profile exists and has correct data
        const { error: profError } = await supabaseClient.from('profiles').upsert({
          id: data.user.id,
          nome: userData.nome,
          email: email,
          cargo: userData.role
        })
        
        // Assign role
        if (userData.role) {
          await supabaseClient.from('user_roles').upsert({
            user_id: data.user.id,
            role: userData.role
          })
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'update') {
      const updateData: any = {}
      if (email) updateData.email = email
      if (password) updateData.password = password
      if (userData) updateData.user_metadata = userData

      const { data, error } = await supabaseClient.auth.admin.updateUserById(userId, updateData)
      if (error) throw error

      if (userData?.role) {
         await supabaseClient.from('user_roles').upsert({
            user_id: userId,
            role: userData.role
          })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
