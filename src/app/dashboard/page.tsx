/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { addScore, submitWinnerProof, deleteScore } from './actions'
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

  // Fetch user's winnings
  const { data: winnings } = await supabase
    .from('draw_winners')
    .select(`
      id, prize_amount, match_count, verification_status, proof_image_url,
      draws ( draw_month, winning_numbers )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // GATEKEEPER: If they aren't active, don't let them use the dashboard
  if (profile?.subscription_status !== 'active') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-800 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Active Plan Required</h2>
          <p className="text-zinc-400 mb-6">You need an active subscription to access the clubhouse, enter scores, and join the draws.</p>
          <Link href="/subscribe" className="block w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-500 transition-colors">
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 text-zinc-50">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Status */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg p-6 md:p-8 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">The Clubhouse</h1>
            <p className="text-zinc-400">
              Welcome back, {profile?.full_name || user.email?.split('@')[0]}
            </p>
          </div>
          <div className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700">
            <span className="text-sm text-zinc-400 block mb-1">Status</span>
            <span className="text-green-400 font-medium capitalize flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {profile.subscription_plan} Plan Active
            </span>
          </div>
          <Link href="/dashboard/charities" className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors text-center shadow-sm">
            Manage Impact
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Score Entry Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Log a Score</h2>
              <form action={addScore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Stableford Score (1-45)</label>
                  <input 
                    type="number" 
                    name="score" 
                    min="1" 
                    max="45" 
                    required 
                    className="w-full rounded-lg px-4 py-2 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., 36"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Date Played</label>
                  <input 
                    type="date" 
                    name="played_date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg px-4 py-2 bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <button className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-500 transition-colors shadow-sm">
                  Save Score
                </button>
              </form>
            </div>
          </div>

          {/* Score History Column */}
          <div className="md:col-span-2">
            <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Your Last 5 Scores</h2>
                <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">{scores?.length || 0}/5 Logged</span>
              </div>
              
              {scores && scores.length > 0 ? (
                <div className="space-y-3">
                  {scores.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600 transition-colors group">
                      
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {format(new Date(s.played_date), 'MMMM d, yyyy')}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-2xl font-bold text-blue-500">
                          {s.score}
                        </div>
                        
                        {/* Delete Score Form */}
                        <form action={deleteScore}>
                          <input type="hidden" name="score_id" value={s.id} />
                          <button 
                            type="submit"
                            title="Delete Score"
                            className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-500/10 focus:opacity-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </form>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-700 rounded-xl">
                  No scores logged yet. Start playing!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Winnings & Rewards Section */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-6 md:p-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Winnings & Rewards</h2>
              <p className="text-zinc-400 text-sm mt-1">Upload proof to claim your draw prizes.</p>
            </div>
            <div className="text-3xl font-black text-green-500">
              ${winnings?.reduce((acc, curr) => acc + Number(curr.prize_amount), 0).toFixed(2) || '0.00'}
            </div>
          </div>

          {winnings && winnings.length > 0 ? (
            <div className="space-y-4">
              {winnings.map((win: any) => (
                <div key={win.id} className="border border-zinc-700/50 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-800/30">
                  <div>
                    <div className="font-bold text-white">{win.draws?.draw_month} Draw</div>
                    <div className="text-sm text-zinc-400 mt-1">
                      Matched {win.match_count} Numbers • <span className="text-green-500 font-bold">${Number(win.prize_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  {win.verification_status === 'pending' && !win.proof_image_url ? (
                    <form action={submitWinnerProof} className="flex gap-2 w-full md:w-auto">
                      <input type="hidden" name="winning_id" value={win.id} />
                      <input
                        type="url"
                        name="proof_url"
                        placeholder="Paste image URL..."
                        required
                        className="flex-1 md:w-48 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors shadow-sm">
                        Submit
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                        win.verification_status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        win.verification_status === 'paid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        win.verification_status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {win.verification_status === 'pending' ? 'Proof Under Review' : win.verification_status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-700 rounded-xl">
               You haven&apos;t matched any numbers yet. Keep logging scores!
             </div>
          )}
        </div>

      </div>
    </div>
  )
}