import { createClient } from 'jsr:@supabase/supabase-js@2'
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Initialize the Supabase client with the Service Role Key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    // 1. Verify the caller is an Admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    const { data: adminCheck } = await supabaseAdmin.from('Admin').select('id').eq('id', user.id).single()
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden. Only admins can manage employees.' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    // 2. Parse the request body
    const body = await req.json()
    const { action, employeeId, payload } = body

    if (action === 'create') {
      const { name, email, password, phone, address } = payload
      
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'employee' }
      })

      if (createError) throw createError

      if (phone || address) {
         await supabaseAdmin.from('Employee').update({ phone, address }).eq('id', newAuthUser.user.id)
      }
      
      const { data: newEmployee } = await supabaseAdmin.from('Employee').select('*').eq('id', newAuthUser.user.id).single()

      return new Response(JSON.stringify({ message: 'Employee created', employee: newEmployee }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    if (action === 'update') {
      if (!employeeId) throw new Error("employeeId is required")
      const { name, email, password, phone, address } = payload

      const authUpdates: any = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password
      if (name) authUpdates.user_metadata = { name, role: 'employee' }
      
      if (Object.keys(authUpdates).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, authUpdates)
        if (updateAuthError) throw updateAuthError
      }

      const empUpdates: any = {}
      if (name) empUpdates.name = name
      if (email) empUpdates.email = email
      if (phone !== undefined) empUpdates.phone = phone
      if (address !== undefined) empUpdates.address = address

      let updatedEmployee = null
      if (Object.keys(empUpdates).length > 0) {
        const { data, error: updateEmpError } = await supabaseAdmin.from('Employee').update(empUpdates).eq('id', employeeId).select().single()
        if (updateEmpError) throw updateEmpError
        updatedEmployee = data
      } else {
        const { data } = await supabaseAdmin.from('Employee').select('*').eq('id', employeeId).single()
        updatedEmployee = data
      }

      return new Response(JSON.stringify({ message: 'Employee updated', employee: updatedEmployee }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    if (action === 'delete') {
      if (!employeeId) throw new Error("employeeId is required")
      
      // Update Employee clients to null if assigned, wait we can just delete and let CASCADE or explicit nullification happen
      await supabaseAdmin.from('Client').update({ employeeId: null }).eq('employeeId', employeeId)
      
      // Delete Employee row
      await supabaseAdmin.from('Employee').delete().eq('id', employeeId)
      
      // Delete Auth user
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(employeeId)
      if (deleteAuthError) throw deleteAuthError

      return new Response(JSON.stringify({ message: 'Employee deleted' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
})
