/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { calculatePrizePool, getPrizePerWinner } from '@/lib/prize-engine' // 1. IMPORT ENGINE

// Initialize System Clients
const resend = new Resend(process.env.RESEND_API_KEY)
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- SECURITY GATEKEEPER ---
async function requireAdmin() {
  const supabase = await createClient()
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

  const { data: activeUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active')

  if (!activeUsers || activeUsers.length === 0) {
    throw new Error('No active subscribers found for simulation.')
  }

  const userIds = activeUsers.map(u => u.id)
  const { data: allScores } = await supabaseAdmin
    .from('scores')
    .select('user_id, score, played_date')
    .in('user_id', userIds)
    .order('played_date', { ascending: false })

  const userScoresMap = new Map<string, number[]>()
  allScores?.forEach(row => {
    const scores = userScoresMap.get(row.user_id) || []
    if (scores.length < 5) {
      scores.push(row.score)
      userScoresMap.set(row.user_id, scores)
    }
  })

  const winningNumbers = new Set<number>()
  while (winningNumbers.size < 5) {
    winningNumbers.add(Math.floor(Math.random() * 45) + 1)
  }
  const winningNumbersArray = Array.from(winningNumbers)

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

  const { data: lastDraw } = await supabaseAdmin
    .from('draws')
    .select('rollover_amount')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 2. USE CENTRALIZED ENGINE MATH
  const poolData = calculatePrizePool(activeUsers.length, lastDraw?.rollover_amount || 0)

  return {
    winningNumbers: winningNumbersArray,
    totalPool: poolData.totalPool,
    previousRollover: poolData.previousRollover,
    generatedPool: poolData.generatedPool,
    results: {
      match5: { 
        count: match5.length, 
        userIds: match5, 
        prizePerWinner: getPrizePerWinner(poolData.split.match5, match5.length) 
      },
      match4: { 
        count: match4.length, 
        userIds: match4, 
        prizePerWinner: getPrizePerWinner(poolData.split.match4, match4.length) 
      },
      match3: { 
        count: match3.length, 
        userIds: match3, 
        prizePerWinner: getPrizePerWinner(poolData.split.match3, match3.length) 
      },
    },
    willRollover: match5.length === 0,
    rolloverAmount: match5.length === 0 ? poolData.split.match5 : 0
  }
}

// --- COMMIT DRAW (With Phase 13 Email Notifications) ---
export async function commitDraw(previewData: any) {
  await requireAdmin()
  const { winningNumbers, totalPool, rolloverAmount, results } = previewData
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

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

  const winnerInserts: any[] = []
  const notifications: { email: string; matches: number; amount: string }[] = []

  const processTier = async (tierResults: any, matchCount: number) => {
    if (tierResults.count > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .in('id', tierResults.userIds)

      tierResults.userIds.forEach((userId: string) => {
        const userEmail = profiles?.find(p => p.id === userId)?.email
        
        winnerInserts.push({
          draw_id: newDraw.id,
          user_id: userId,
          match_count: matchCount,
          prize_amount: tierResults.prizePerWinner,
          verification_status: 'pending'
        })

        if (userEmail) {
          notifications.push({
            email: userEmail,
            matches: matchCount,
            amount: Number(tierResults.prizePerWinner).toFixed(2)
          })
        }
      })
    }
  }

  await processTier(results.match5, 5)
  await processTier(results.match4, 4)
  await processTier(results.match3, 3)

  if (winnerInserts.length > 0) {
    const { error: winnerError } = await supabaseAdmin.from('draw_winners').insert(winnerInserts)
    if (winnerError) throw new Error(`Winner logging failed: ${winnerError.message}`)

    for (const winner of notifications) {
      try {
        await resend.emails.send({
          from: 'Digital Heroes <winners@yourplatform.com>',
          to: winner.email,
          subject: `🏆 YOU WON! Your Monthly Results are here.`,
          html: `
            <div style="font-family: sans-serif; background: #09090b; color: white; padding: 40px; border-radius: 20px;">
              <h1 style="font-style: italic; text-transform: uppercase;">Congratulations Hero!</h1>
              <p style="color: #a1a1aa;">Your weekend round just changed the world—and won you a prize.</p>
              <div style="background: #18181b; padding: 20px; border-radius: 15px; border: 1px solid #27272a;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #3b82f6; font-weight: bold;">Matched</p>
                <h2 style="margin: 5px 0;">${winner.matches} Numbers</h2>
                <p style="margin: 15px 0 0 0; font-size: 11px; text-transform: uppercase; color: #22c55e; font-weight: bold;">Prize Amount</p>
                <h2 style="margin: 5px 0; color: #22c55e;">$${winner.amount}</h2>
              </div>
              <p style="margin-top: 20px; font-size: 13px; color: #71717a;">Log in to upload your scorecard proof and claim your payout.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: white; color: black; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; margin-top: 10px;">Claim Prize →</a>
            </div>
          `
        })
      } catch (e) {
        console.error("Failed to notify winner:", winner.email, e)
      }
    }
  }

  revalidatePath('/admin')
  return { success: true }
}

// --- CHARITY MANAGEMENT ---

export async function addCharity(formData: FormData) {
  await requireAdmin()
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const imageUrl = formData.get('image_url') as string
  const isFeatured = formData.get('is_featured') === 'on'
  const eventName = formData.get('event_name') as string
  const eventDate = formData.get('event_date') as string

  const events = eventName && eventDate ? [{ name: eventName, date: eventDate }] : []

  const { error } = await supabaseAdmin
    .from('charities')
    .insert({ name, description, image_url: imageUrl, is_featured: isFeatured, events: events })

  if (error) throw new Error('Failed to add charity partner.')
  revalidatePath('/admin')
  revalidatePath('/charities')
}

export async function updateCharity(formData: FormData) {
  await requireAdmin();

  const charityId = formData.get('charity_id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageUrl = formData.get('image_url') as string;
  const isFeatured = formData.get('is_featured') === 'on';
  const eventName = formData.get('event_name') as string;
  const eventDate = formData.get('event_date') as string;

  const events = eventName && eventDate ? [{ name: eventName, date: eventDate }] : [];

  const { error } = await supabaseAdmin
    .from('charities')
    .update({ name, description, image_url: imageUrl, is_featured: isFeatured, events: events })
    .eq('id', charityId);

  if (error) throw new Error('Failed to update charity.');

  revalidatePath('/admin');
  revalidatePath('/charities');
  redirect('/admin'); 
}

export async function deleteCharity(formData: FormData) {
  await requireAdmin()
  const charityId = formData.get('charity_id') as string
  const { error } = await supabaseAdmin.from('charities').delete().eq('id', charityId)
  if (error) throw new Error('Failed to delete charity.')
  revalidatePath('/admin')
}

// --- USER & VERIFICATION MANAGEMENT ---

export async function updateVerificationStatus(formData: FormData) {
  await requireAdmin()
  const winnerId = formData.get('winner_id') as string
  const status = formData.get('status') as string

  const { error } = await supabaseAdmin
    .from('draw_winners')
    .update({ verification_status: status })
    .eq('id', winnerId)

  if (error) throw new Error('Failed to update status.')
  revalidatePath('/admin')
}

export async function adminUpdateUser(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient() 
  const userId = formData.get('user_id') as string
  const status = formData.get('status') as string
  const plan = formData.get('plan') as string

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: status, subscription_plan: plan })
    .eq('id', userId)

  if (error) throw new Error('Failed to update user status')
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
}

export async function adminDeleteScore(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  const scoreId = formData.get('score_id') as string
  const userId = formData.get('user_id') as string

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', scoreId)

  if (error) throw new Error('Failed to delete score')
  revalidatePath(`/admin/users/${userId}`)
}

export async function approveScore(scoreId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('scores')
    .update({ 
      is_verified: true, 
      verified_at: new Date().toISOString() 
    })
    .eq('id', scoreId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}

export async function approveAllScores() {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('scores')
    .update({ 
      is_verified: true, 
      verified_at: new Date().toISOString() 
    })
    .eq('is_verified', false);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}