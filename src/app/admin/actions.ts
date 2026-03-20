'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Use the Service Role Key to safely bypass RLS for administrative tasks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function executeMonthlyDraw() {
  // 1. Fetch all users who have an active subscription
  const { data: eligibleUsers, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('subscription_status', 'active')

  if (fetchError) throw new Error('Failed to fetch eligible users.')
  
  if (!eligibleUsers || eligibleUsers.length === 0) {
    throw new Error('Draw failed: No active subscribers found.')
  }

  // 2. The Randomizer Engine: Pick a random winner from the array
  const randomIndex = Math.floor(Math.random() * eligibleUsers.length)
  const winner = eligibleUsers[randomIndex]

  // 3. Generate the current month string (e.g., "October 2023")
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  // 4. Save the result permanently to the database
  const { error: insertError } = await supabaseAdmin
    .from('draws')
    .insert({
      draw_month: currentMonth,
      winner_id: winner.id,
    })

  if (insertError) {
    console.error("🚨 SUPABASE INSERT ERROR:", insertError)
    throw new Error(`Database rejected the draw: ${insertError.message}`)
  }

  // 5. Refresh the admin page to show the new winner
  revalidatePath('/admin')
}