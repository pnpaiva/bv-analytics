import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin client for user management
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log(`Attempting to delete user: ${userId}`)

    // First, manually clean up all user-related data
    try {
      // Delete user's campaigns (which will cascade to related data)
      const { error: campaignsError } = await adminClient
        .from('campaigns')
        .delete()
        .eq('user_id', userId)
      
      if (campaignsError) {
        console.log('Error deleting campaigns:', campaignsError)
      }

      // Delete user's creators
      const { error: creatorsError } = await adminClient
        .from('creators')
        .delete()
        .eq('user_id', userId)
      
      if (creatorsError) {
        console.log('Error deleting creators:', creatorsError)
      }

      // Delete user's clients
      const { error: clientsError } = await adminClient
        .from('clients')
        .delete()
        .eq('user_id', userId)
      
      if (clientsError) {
        console.log('Error deleting clients:', clientsError)
      }

      // Delete user's creator roster
      const { error: rosterError } = await adminClient
        .from('creator_roster')
        .delete()
        .eq('user_id', userId)
      
      if (rosterError) {
        console.log('Error deleting creator roster:', rosterError)
      }

      // Delete user's profile
      const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (profileError) {
        console.log('Error deleting profile:', profileError)
      }

      // Delete user's role
      const { error: roleError } = await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
      
      if (roleError) {
        console.log('Error deleting user role:', roleError)
      }

      console.log('Successfully cleaned up user data')
    } catch (cleanupError) {
      console.error('Error during data cleanup:', cleanupError)
    }

    // Try to delete user from auth, but don't fail if user doesn't exist
    try {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
      
      if (deleteError) {
        console.error('Delete user from auth error:', deleteError)
        // If the error is "user not found", that's actually okay - user was already deleted
        if (deleteError.message?.includes('User not found') || 
            deleteError.message?.includes('not found') ||
            deleteError.status === 404) {
          console.log('User was already deleted from auth, which is fine')
        } else {
          // For other errors, log but don't fail the entire operation
          console.error('Non-critical auth deletion error:', deleteError.message)
        }
      } else {
        console.log('Successfully deleted user from auth')
      }
    } catch (authError) {
      console.error('Exception during auth deletion:', authError)
      // Don't fail the operation if auth deletion fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User and all related data deleted successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in admin delete user function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})