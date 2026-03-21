'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', // Ensure this matches your package version
})

/**
 * INDEPENDENT DONATION
 * Creates a one-time Stripe Checkout session for a direct charity gift.
 */
export async function createDirectDonationSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const charityId = formData.get('charity_id') as string
  const amount = parseInt(formData.get('amount') as string)

  if (!charityId || isNaN(amount) || amount < 1) {
    throw new Error('Invalid charity selection or amount.')
  }

  // Create Stripe Checkout Session for a one-time payment
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Direct Donation Support`,
            description: `100% of this contribution is earmarked for our charity partner.`,
          },
          unit_amount: amount * 100, // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/charities?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/charities?status=cancelled`,
    metadata: {
      type: 'direct_donation',
      charity_id: charityId,
      user_id: user?.id || 'anonymous',
    },
  })

  if (!session.url) throw new Error('Failed to create payment session.')
  
  // Redirect the user to Stripe
  redirect(session.url)
}

export async function addScore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const score = parseInt(formData.get('score') as string)
  const played_date = formData.get('played_date') as string

  // STABLEFORD VALIDATION
  if (isNaN(score) || score < 1 || score > 45) {
    throw new Error('Invalid score. Please enter a Stableford score between 1 and 45.')
  }

  // 1. Insert the new score
  const { error: insertError } = await supabase
    .from('scores')
    .insert({
      user_id: user.id,
      score,
      played_date,
    })

  if (insertError) throw insertError

  // 2. Enforce the "Latest 5"
  const { data: scores } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .order('played_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (scores && scores.length > 5) {
    const idsToDelete = scores.slice(5).map(s => s.id)
    await supabase
      .from('scores')
      .delete()
      .in('id', idsToDelete)
  }

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
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to submit proof')
  
  revalidatePath('/dashboard')
}

export async function deleteScore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const scoreId = formData.get('score_id') as string

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', scoreId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to delete score')
  
  revalidatePath('/dashboard')
}

export async function updateCharityPreference(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const charityId = formData.get('charity_id') as string
  const percentage = parseInt(formData.get('percentage') as string)

  const { error } = await supabase
    .from('profiles')
    .update({ 
      selected_charity_id: charityId,
      donation_percentage: percentage 
    })
    .eq('id', user.id)

  if (error) {
    console.error("🚨 CHARITY UPDATE ERROR:", error)
    throw new Error('Failed to update charity preference')
  }

  revalidatePath('/dashboard')
}

export async function updateScore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const scoreId = formData.get('score_id') as string
  const newScore = parseInt(formData.get('new_score') as string)

  if (isNaN(newScore) || newScore < 1 || newScore > 45) {
    throw new Error('Invalid score.')
  }

  const { error } = await supabase
    .from('scores')
    .update({ score: newScore })
    .eq('id', scoreId)
    .eq('user_id', user.id)

  if (error) throw error
  
  revalidatePath('/dashboard')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fullName = formData.get('full_name') as string

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) throw error
  revalidatePath('/dashboard/profile')
}

// 1. Request Email Change (Triggers OTP to new email)
export async function requestEmailChange(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ email })
  if (error) throw new Error(error.message)
}

// 2. Request Phone Change (Triggers OTP to new phone)
// Note: Phone must be E.164 format (e.g., +447123456789)
export async function requestPhoneChange(phone: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ phone })
  if (error) throw new Error(error.message)
}

// 3. Verify the OTP (This fixes the TS Error 2322)
export async function verifyUpdateOTP(token: string, type: 'email_change' | 'phone_change', value: string) {
  const supabase = await createClient()

  // We branch the call here so TypeScript knows exactly which 
  // fields (email vs phone) are being provided.
  const { error } = type === 'email_change' 
    ? await supabase.auth.verifyOtp({
        token,
        type: 'email_change',
        email: value
      })
    : await supabase.auth.verifyOtp({
        token,
        type: 'phone_change',
        phone: value
      })

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
}