'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

/**
 * STRIPE & SCORE ACTIONS (Unchanged)
 */
export async function createDirectDonationSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const charityId = formData.get('charity_id') as string
  const amount = parseInt(formData.get('amount') as string)

  if (!charityId || isNaN(amount) || amount < 1) throw new Error('Invalid amount.')

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Direct Donation Support` },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/charities?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/charities?status=cancelled`,
    metadata: { type: 'direct_donation', charity_id: charityId, user_id: user?.id || 'anonymous' },
  })

  if (!session.url) throw new Error('Failed to create session.')
  redirect(session.url)
}

export async function addScore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const score = parseInt(formData.get('score') as string)
  const played_date = formData.get('played_date') as string

  if (isNaN(score) || score < 1 || score > 45) throw new Error('Invalid score.')

  await supabase.from('scores').insert({ user_id: user.id, score, played_date })

  const { data: scores } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .order('played_date', { ascending: false })

  if (scores && scores.length > 5) {
    const idsToDelete = scores.slice(5).map(s => s.id)
    await supabase.from('scores').delete().in('id', idsToDelete)
  }

  revalidatePath('/dashboard')
}

export async function deleteScore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const scoreId = formData.get('score_id') as string
  await supabase.from('scores').delete().eq('id', scoreId).eq('user_id', user?.id)
  revalidatePath('/dashboard')
}

export async function updateScore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const scoreId = formData.get('score_id') as string
  const newScore = parseInt(formData.get('new_score') as string)
  await supabase.from('scores').update({ score: newScore }).eq('id', scoreId).eq('user_id', user?.id)
  revalidatePath('/dashboard')
}

export async function updateCharityPreference(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const charityId = formData.get('charity_id') as string
  const percentage = parseInt(formData.get('percentage') as string)
  await supabase.from('profiles').update({ selected_charity_id: charityId, donation_percentage: percentage }).eq('id', user?.id)
  revalidatePath('/dashboard')
}

export async function submitWinnerProof(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const winningId = formData.get('winning_id') as string
  const proofUrl = formData.get('proof_url') as string
  await supabase.from('draw_winners').update({ proof_image_url: proofUrl }).eq('id', winningId).eq('user_id', user?.id)
  revalidatePath('/dashboard')
}

/**
 * UPDATED: IDENTITY & PROFILE ACTIONS
 * Phone and Name are now direct updates. Email remains protected by OTP.
 */

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name: fullName,
      phone: phone // Instant update, no OTP required
    })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/dashboard/profile')
}

export async function requestEmailChange(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email })
  if (error) throw new Error(error.message)
}

// Optimized to only handle Email Verification
export async function verifyEmailUpdate(token: string, email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    token,
    type: 'email_change',
    email: email
  })

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
}