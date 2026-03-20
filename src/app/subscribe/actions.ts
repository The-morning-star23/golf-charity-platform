'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-02-25.clover', // Standard API version
})

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient()
  
  // Get the current logged-in user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?auth=login')
  }

  // Create the Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'auto',
    customer_email: user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    // Where Stripe sends them after a successful payment
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    // Where Stripe sends them if they click the back button
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
    // CRITICAL: This links the Stripe payment back to our Supabase user ID
    client_reference_id: user.id, 
  })

  if (session.url) {
    redirect(session.url)
  } else {
    throw new Error('Could not create Stripe checkout session')
  }
}