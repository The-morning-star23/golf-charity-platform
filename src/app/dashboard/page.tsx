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
  if (!user) redirect('/')

  // 1. Fetch the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. LIVE JACKPOT MATH (Phase 07 Logic)
  // Fetch latest draw to get the rollover amount
  const { data: latestDraw } = await supabase
    .from('draws')
    .select('rollover_amount')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Count active subscribers to estimate the current month's "New Money" pool
  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  const previousRollover = latestDraw?.rollover_amount || 0
  const monthlyNewPool = (activeUsersCount || 0) * 10
  
  // The Jackpot is 40% of the current monthly pool plus any previous rollover
  // Formula: $$EstimatedJackpot = (ActiveUsers \times 10 \times 0.40) + LastRollover$$
  const estimatedJackpot = (monthlyNewPool * 0.40) + previousRollover

  // 3. Fetch scores and winnings
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_date', { ascending: false })
    .order('created_at', { ascending: false })

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
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 text-zinc-50 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* --- LIVE JACKPOT HERO --- */}
        <div className="relative overflow-hidden bg-blue-600 rounded-3xl p-8 md:p-12 shadow-2xl shadow-blue-500/20 group">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white mb-4">
                Current Jackpot Pool
              </span>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2">
                ${estimatedJackpot.toFixed(2)}
              </h2>
              <p className="text-blue-100 font-medium">
                Log 5 scores to qualify for the next draw.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[200px]">
              <span className="text-blue-200 text-xs font-bold uppercase mb-2">My Qualifiers</span>
              <div className="text-4xl font-black text-white">{scores?.length || 0} / 5</div>
              <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((scores?.length || 0) / 5) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header & Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-2xl shadow-lg p-6 border border-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Welcome Back</p>
              <h1 className="text-xl font-bold text-white">
                {profile?.full_name || user.email?.split('@')[0]}
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-tight">{profile.subscription_plan} Plan</span>
            </div>
          </div>

          <Link href="/dashboard/charities" className="bg-zinc-900 rounded-2xl shadow-lg p-6 border border-zinc-800 flex justify-between items-center hover:bg-zinc-800/50 transition-colors">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Your Impact</p>
              <p className="text-white font-bold">Manage Charity Preferences</p>
            </div>
            <span className="text-blue-500">→</span>
          </Link>
        </div>

        {/* Score Management Grid */}
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
                        <div className="text-2xl font-bold text-blue-500">{s.score}</div>
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
                <div key={win.id} className="border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950">
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
             <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
               You haven&apos;t matched any numbers yet. Keep logging scores!
             </div>
          )}
        </div>

      </div>
    </div>
  )
}