/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function executeMonthlyDraw() {
  // 1. Fetch all active users
  const { data: activeUsers, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active')

  if (usersError || !activeUsers || activeUsers.length === 0) {
    throw new Error('Draw failed: No active subscribers found.')
  }

  // 2. Fetch all scores for active users to find their latest 5
  const userIds = activeUsers.map(u => u.id)
  const { data: allScores, error: scoresError } = await supabaseAdmin
    .from('scores')
    .select('user_id, score, date_played')
    .in('user_id', userIds)
    .order('date_played', { ascending: false })

  if (scoresError) throw new Error('Failed to fetch user scores.')

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
  // Fetch the previous draw to see if there is a rollover jackpot
  const { data: lastDraw } = await supabaseAdmin
    .from('draws')
    .select('rollover_amount')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const previousRollover = lastDraw?.rollover_amount || 0
  
  // For this MVP, we simulate that $10 from every active user goes to the pool
  const generatedPool = activeUsers.length * 10 
  const totalPool = generatedPool + previousRollover

  // Split per PRD Section 07
  const pool5 = totalPool * 0.40
  const pool4 = totalPool * 0.35
  const pool3 = totalPool * 0.25

  // PRD: "5-Match jackpot carries forward if unclaimed"
  let currentRollover = 0
  if (match5.length === 0) {
    currentRollover = pool5 
  }

  // 6. Save the Draw Event to the database
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const { data: newDraw, error: drawError } = await supabaseAdmin
    .from('draws')
    .insert({
      draw_month: currentMonth,
      winning_numbers: winningNumbersArray,
      total_pool: totalPool,
      rollover_amount: currentRollover
    })
    .select('id')
    .single()

  if (drawError || !newDraw) throw new Error(`Database rejected the draw: ${drawError?.message}`)

  // 7. Save the Winners and their splits
  const winnerInserts: any[] = []
  
  const addWinners = (winnersArray: string[], matchCount: number, tierPoolAmount: number) => {
    if (winnersArray.length > 0) {
      // PRD: "Prizes split equally among multiple winners in the same tier"
      const splitPrize = tierPoolAmount / winnersArray.length
      winnersArray.forEach(userId => {
        winnerInserts.push({
          draw_id: newDraw.id,
          user_id: userId,
          match_count: matchCount,
          prize_amount: splitPrize,
          verification_status: 'pending' // Forces them to upload proof later!
        })
      })
    }
  }

  addWinners(match5, 5, pool5)
  addWinners(match4, 4, pool4)
  addWinners(match3, 3, pool3)

  if (winnerInserts.length > 0) {
    const { error: winnerError } = await supabaseAdmin
      .from('draw_winners')
      .insert(winnerInserts)
    if (winnerError) {
      console.error("🚨 WINNER INSERT ERROR:", winnerError)
      throw new Error(`Failed to record winners: ${winnerError.message}`)
    }
  }

  // 8. Refresh the UI
  revalidatePath('/admin')
}

export async function updateVerificationStatus(formData: FormData) {
  const winnerId = formData.get('winner_id') as string
  const status = formData.get('status') as string

  const { error } = await supabaseAdmin
    .from('draw_winners')
    .update({ verification_status: status })
    .eq('id', winnerId)

  if (error) {
    console.error("🚨 UPDATE ERROR:", error)
    throw new Error('Failed to update verification status.')
  }

  revalidatePath('/admin')
}