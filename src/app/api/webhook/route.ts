import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// 1. Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-02-25.clover', // Matching your strict SDK version!
})

// 2. Initialize Supabase Admin (Bypasses RLS using the Service Role Key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  // 3. Verify the event actually came from Stripe
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    console.error(`❌ Webhook Error`)
    return NextResponse.json({ error: `Webhook Error` }, { status: 400 })
  }

  console.log(`✅ Webhook received: ${event.type}`)

  // 4. Handle the specific events we care about
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // This is the user ID we passed when creating the checkout session!
        const userId = session.client_reference_id 
        const customerId = session.customer as string

        // Retrieve the line items to see if they bought Monthly or Yearly
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        const priceId = lineItems.data[0]?.price?.id
        const plan = priceId === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID ? 'yearly' : 'monthly'

        if (userId) {
          // Update the user's profile in Supabase
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_plan: plan,
              stripe_customer_id: customerId,
            })
            .eq('id', userId)

          if (error) throw error
          console.log(`👤 User ${userId} successfully subscribed to ${plan} plan.`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const stripeCustomerId = subscription.customer as string

        // If a subscription is canceled/deleted, mark them inactive
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ subscription_status: 'inactive' })
          .eq('stripe_customer_id', stripeCustomerId)

        if (error) throw error
        console.log(`🚫 Subscription canceled for customer ${stripeCustomerId}`)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch  {
    console.error(`❌ Database Error`)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }
}