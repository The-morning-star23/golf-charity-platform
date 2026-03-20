'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string // Grab the name

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw new Error(error.message)

  // Save the user's name to their database profile!
  if (data.user && fullName) {
    await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', data.user.id)
  }

  redirect('/dashboard')
}