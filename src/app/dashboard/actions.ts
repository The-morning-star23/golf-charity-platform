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

export async function submitWinnerProof(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const winningId = formData.get('winning_id') as string
  const proofUrl = formData.get('proof_url') as string

  const { error } = await supabase
    .from('draw_winners')
    .update({ proof_image_url: proofUrl })
    .eq('id', winningId)
    .eq('user_id', user.id) // Security check!

  if (error) throw new Error('Failed to submit proof')
  
  revalidatePath('/dashboard')
}