import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { addScore } from './actions'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the user's profile to check subscription status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch the user's scores
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_date', { ascending: false })
    .order('created_at', { ascending: false })

  // GATEKEEPER: If they aren't active, don't let them use the dashboard
  if (profile?.subscription_status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Plan Required</h2>
          <p className="text-gray-500 mb-6">You need an active subscription to access the clubhouse, enter scores, and join the draws.</p>
          <Link href="/subscribe" className="block w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors">
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Status */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg p-6 md:p-8 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">The Clubhouse</h1>
            <p className="text-zinc-400">Welcome back, {user.email}</p>
          </div>
          <div className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700">
            <span className="text-sm text-zinc-400 block mb-1">Status</span>
            <span className="text-green-400 font-medium capitalize flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {profile.subscription_plan} Plan Active
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Score Entry Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Log a Score</h2>
              <form action={addScore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stableford Score (1-45)</label>
                  <input 
                    type="number" 
                    name="score" 
                    min="1" 
                    max="45" 
                    required 
                    className="w-full rounded-lg px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., 36"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Played</label>
                  <input 
                    type="date" 
                    name="played_date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Save Score
                </button>
              </form>
            </div>
          </div>

          {/* Score History Column */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Last 5 Scores</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{scores?.length || 0}/5 Logged</span>
              </div>
              
              {scores && scores.length > 0 ? (
                <div className="space-y-3">
                  {scores.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-200 transition-colors">
                      <div className="font-medium text-gray-900">
                        {format(new Date(s.played_date), 'MMMM d, yyyy')}
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {s.score}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                  No scores logged yet. Start playing!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}