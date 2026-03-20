import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CharityForm from './CharityForm'

export const dynamic = 'force-dynamic'

export default async function CharitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the user's current profile to see what they already selected
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_charity_id, charity_percentage')
    .eq('id', user.id)
    .single()

  // Fetch all available charities
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-4 inline-block items-center gap-1">
            ← Back to Clubhouse
          </Link>
          <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-800">
            <h1 className="text-3xl font-bold text-white mb-2">Impact Center</h1>
            <p className="text-zinc-400 max-w-2xl">
              Choose the cause you want to support. A minimum of 10% of your subscription goes directly to your selected charity, but you can increase it up to 100%.
            </p>
          </div>
        </div>

        {/* Render our interactive client component, passing down the data */}
        <CharityForm profile={profile} charities={charities} />

      </div>
    </div>
  )
}