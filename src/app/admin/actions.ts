/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- SECURITY GATEKEEPER ---
async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) throw new Error("Unauthorized: Admin access required")
}

// --- GENERATE DRAW PREVIEW (Simulation Mode) ---
export async function generateDrawPreview() {
  await requireAdmin()

  // 1. Fetch all active users
  const { data: activeUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active')

  if (!activeUsers || activeUsers.length === 0) {
    throw new Error('No active subscribers found for simulation.')
  }

  // 2. Fetch all scores for active users to find their latest 5
  const userIds = activeUsers.map(u => u.id)
  const { data: allScores } = await supabaseAdmin
    .from('scores')
    .select('user_id, score, played_date')
    .in('user_id', userIds)
    .order('played_date', { ascending: false })

  // Group exactly the 5 most recent scores per user
  const userScoresMap = new Map<string, number[]>()
  allScores?.forEach(row => {
    const scores = userScoresMap.get(row.user_id) || []
    if (scores.length < 5) {
      scores.push(row.score)
      userScoresMap.set(row.user_id, scores)
    }
  })

  // 3. Generate 5 unique random winning numbers (1 to 45)
  const winningNumbers = new Set<number>()
  while (winningNumbers.size < 5) {
    winningNumbers.add(Math.floor(Math.random() * 45) + 1)
  }
  const winningNumbersArray = Array.from(winningNumbers)

  // 4. Find the Winners by matching scores
  const match5: string[] = []
  const match4: string[] = []
  const match3: string[] = []

  userScoresMap.forEach((scores, userId) => {
    let matches = 0
    scores.forEach(score => {
      if (winningNumbersArray.includes(score)) matches++
    })

    if (matches === 5) match5.push(userId)
    else if (matches === 4) match4.push(userId)
    else if (matches === 3) match3.push(userId)
  })

  // 5. Calculate the Financial Prize Pool
  const { data: lastDraw } = await supabaseAdmin
    .from('draws')
    .select('rollover_amount')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousRollover = lastDraw?.rollover_amount || 0
  const generatedPool = activeUsers.length * 10 
  const totalPool = generatedPool + previousRollover

  const pool5 = totalPool * 0.40
  const pool4 = totalPool * 0.35
  const pool3 = totalPool * 0.25

  return {
    winningNumbers: winningNumbersArray,
    totalPool,
    previousRollover,
    generatedPool,
    results: {
      match5: { count: match5.length, userIds: match5, prizePerWinner: match5.length > 0 ? pool5 / match5.length : pool5 },
      match4: { count: match4.length, userIds: match4, prizePerWinner: match4.length > 0 ? pool4 / match4.length : 0 },
      match3: { count: match3.length, userIds: match3, prizePerWinner: match3.length > 0 ? pool3 / match3.length : 0 },
    },
    willRollover: match5.length === 0,
    rolloverAmount: match5.length === 0 ? pool5 : 0
  }
}

// --- COMMIT DRAW (Final Execution) ---
export async function commitDraw(previewData: any) {
  await requireAdmin()

  const { winningNumbers, totalPool, rolloverAmount, results } = previewData
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  // 1. Create the Draw record
  const { data: newDraw, error: drawError } = await supabaseAdmin
    .from('draws')
    .insert({
      draw_month: currentMonth,
      winning_numbers: winningNumbers,
      total_pool: totalPool,
      rollover_amount: rolloverAmount
    })
    .select('id')
    .single()

  if (drawError || !newDraw) throw new Error(`Draw failed: ${drawError.message}`)

  // 2. Prepare winner inserts
  const winnerInserts: any[] = []

  const processTier = (tierResults: any, matchCount: number) => {
    if (tierResults.count > 0) {
      tierResults.userIds.forEach((userId: string) => {
        winnerInserts.push({
          draw_id: newDraw.id,
          user_id: userId,
          match_count: matchCount,
          prize_amount: tierResults.prizePerWinner,
          verification_status: 'pending'
        })
      })
    }
  }

  processTier(results.match5, 5)
  processTier(results.match4, 4)
  processTier(results.match3, 3)

  if (winnerInserts.length > 0) {
    const { error: winnerError } = await supabaseAdmin
      .from('draw_winners')
      .insert(winnerInserts)
    if (winnerError) throw new Error(`Winner logging failed: ${winnerError.message}`)
  }

  revalidatePath('/admin')
  return { success: true }
}

// --- VERIFICATION & CHARITY MANAGEMENT ---

export async function updateVerificationStatus(formData: FormData) {
  await requireAdmin()
  const winnerId = formData.get('winner_id') as string
  const status = formData.get('status') as string

  const { error } = await supabaseAdmin
    .from('draw_winners')
    .update({ verification_status: status })
    .eq('id', winnerId)

  if (error) throw new Error('Failed to update verification status.')
  revalidatePath('/admin')
}

export async function addCharity(formData: FormData) {
  await requireAdmin()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const imageUrl = formData.get('image_url') as string
  const isFeatured = formData.get('is_featured') === 'on'

  const { error } = await supabaseAdmin.from('charities').insert({
    name, description, image_url: imageUrl, is_featured: isFeatured
  })

  if (error) throw new Error('Failed to add new charity.')
  revalidatePath('/admin')
}

export async function deleteCharity(formData: FormData) {
  await requireAdmin()
  const charityId = formData.get('charity_id') as string
  const { error } = await supabaseAdmin.from('charities').delete().eq('id', charityId)
  if (error) throw new Error('Failed to delete charity.')
  revalidatePath('/admin')
}