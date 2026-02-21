'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function createColaboradorAction(formData: any) {
    // 1. Create client with Service Role (Admin)
    const isPlaceholder = supabaseServiceKey === 'your-service-role-key'

    // If we have a real service key, we can create the user without confirmation
    const adminClient = !isPlaceholder
        ? createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
        : null

    const publicClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // We use the best available client for DB operations
    const effectiveClient = adminClient || publicClient

    try {
        // 1. Insert into colaboradores table first
        const { data: colab, error: colabError } = await effectiveClient
            .from('colaboradores')
            .insert([formData])
            .select()
            .single()

        if (colabError) throw colabError

        // 2. Create Auth User
        let userId = null

        if (adminClient) {
            // Using Admin API - No email confirmation needed
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                email: formData.email,
                password: '123456',
                email_confirm: true,
                user_metadata: {
                    role: 'colaborador',
                    nome: formData.nome
                }
            })

            if (authError) {
                // If user already exists, try to find them
                if (authError.message.includes('already registered')) {
                    const { data: existingUser } = await adminClient.auth.admin.listUsers()
                    const found = existingUser.users.find(u => u.email === formData.email)
                    if (found) userId = found.id
                } else {
                    throw authError
                }
            } else if (authData.user) {
                userId = authData.user.id
            }
        } else {
            // Fallback to signUp (might need email confirmation if not disabled in dashboard)
            const { data: authData, error: authError } = await publicClient.auth.signUp({
                email: formData.email,
                password: '123456',
                options: {
                    data: {
                        role: 'colaborador',
                        nome: formData.nome
                    }
                }
            })
            if (authError) throw authError
            if (authData.user) userId = authData.user.id
        }

        // 3. Update colaborador with user_id
        if (userId) {
            await effectiveClient
                .from('colaboradores')
                .update({ user_id: userId })
                .eq('id', colab.id)
        }

        return { success: true, userId, isPlaceholder }
    } catch (error: any) {
        console.error('Action Error:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteColaboradorAction(id: string, userId?: string) {
    const isPlaceholder = supabaseServiceKey === 'your-service-role-key'
    const adminClient = !isPlaceholder ? createClient(supabaseUrl, supabaseServiceKey) : null
    const publicClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // We use the best available client
    const effectiveClient = adminClient || publicClient

    try {
        // 1. Delete from table
        const { error: tableError } = await effectiveClient
            .from('colaboradores')
            .delete()
            .eq('id', id)

        if (tableError) throw tableError

        // 2. Delete from Auth if we have admin access
        if (userId && adminClient) {
            await adminClient.auth.admin.deleteUser(userId)
        }

        return { success: true }
    } catch (error: any) {
        console.error('Delete Error:', error)
        return { success: false, error: error.message }
    }
}
