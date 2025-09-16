import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  role: 'admin' | 'client' | 'master_admin' | 'local_admin' | 'local_client'
  isViewOnly?: boolean
  organizationId?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create regular client to verify admin role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user has admin privileges (legacy or organization-based)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const hasAdminAccess = 
      (userRole && userRole.role === 'admin') ||
      (orgMember && ['master_admin', 'local_admin'].includes(orgMember.role))

    if (!hasAdminAccess) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { email, password, role, isViewOnly, organizationId }: CreateUserRequest = await req.json()
    
    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Email, password, and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const validRoles = ['admin', 'client', 'master_admin', 'local_admin', 'local_client']
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Organization roles require an organizationId
    if (['master_admin', 'local_admin', 'local_client'].includes(role) && !organizationId) {
      return new Response(JSON.stringify({ error: 'Organization ID is required for organization-based roles' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin client for user management
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log(`Attempting to create user: ${email} with role: ${role}`)

    // Create the user account using admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created accounts
      user_metadata: { role },
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return new Response(JSON.stringify({ error: `Failed to create user: ${authError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'User creation failed - no user returned' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User created successfully:', authData.user.id)

    // Create user profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        display_name: email.split('@')[0], // Use email prefix as display name
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Don't fail the entire operation if profile creation fails
    }

    // Assign the role based on type
    if (['master_admin', 'local_admin', 'local_client'].includes(role)) {
      // Use organization_members for new role system
      const { error: orgMemberError } = await adminClient
        .from('organization_members')
        .insert({
          user_id: authData.user.id,
          organization_id: organizationId!,
          role,
          created_by: user.id,
          created_at: new Date().toISOString(),
        })

      if (orgMemberError) {
        console.error('Error creating organization member:', orgMemberError)
        return new Response(JSON.stringify({ error: `Failed to assign organization role: ${orgMemberError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Use user_roles for legacy roles
      const { error: roleError } = await adminClient
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role,
          is_view_only: isViewOnly || false,
          created_by: user.id,
          created_at: new Date().toISOString(),
        })

      if (roleError) {
        console.error('Error creating role:', roleError)
        return new Response(JSON.stringify({ error: `Failed to assign role: ${roleError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    console.log('Role assigned successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        is_view_only: isViewOnly || false,
        created_at: new Date().toISOString(),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in admin create user function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
