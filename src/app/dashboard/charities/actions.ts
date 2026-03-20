'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCharityPreferences(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const charityId = formData.get('charity_id') as string
  const percentage = parseInt(formData.get('percentage') as string)

  // Server-side validation
  if (percentage < 10 || percentage > 100) {
    throw new Error('Donation percentage must be between 10% and 100%')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      selected_charity_id: charityId,
      charity_percentage: percentage
    })
    .eq('id', user.id)

  if (error) throw error

  // Refresh both the charities page and the main dashboard
  revalidatePath('/dashboard/charities')
  revalidatePath('/dashboard')
}