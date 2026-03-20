'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addScore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const score = parseInt(formData.get('score') as string)
  const played_date = formData.get('played_date') as string

  // 1. Insert the new score
  const { error: insertError } = await supabase
    .from('scores')
    .insert({
      user_id: user.id,
      score,
      played_date,
    })

  if (insertError) throw insertError

  // 2. Enforce the "Latest 5" Rule (PRD Section 05)
  // Fetch all scores for this user, ordered by date (newest first)
  const { data: scores } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .order('played_date', { ascending: false })
    .order('created_at', { ascending: false })

  // If there are more than 5, slice off the newest 5, and delete the rest
  if (scores && scores.length > 5) {
    const idsToDelete = scores.slice(5).map(s => s.id)
    await supabase
      .from('scores')
      .delete()
      .in('id', idsToDelete)
  }

  // Refresh the dashboard page to show the new data
  revalidatePath('/dashboard')
}