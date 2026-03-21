/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { addScore, submitWinnerProof, deleteScore, updateScore } from './actions'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, charities(name)')
    .eq('id', user.id)
    .single()

  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  // Live Jackpot Math
  const { data: latestDraw } = await supabase.from('draws').select('rollover_amount').order('created_at', { ascending: false }).limit(1).maybeSingle()
  const estimatedJackpot = ((activeUsersCount || 0) * 10 * 0.40) + (latestDraw?.rollover_amount || 0)

  const { data: scores } = await supabase.from('scores').select('*').eq('user_id', user.id).order('played_date', { ascending: false })
  const { data: winnings } = await supabase.from('draw_winners').select(`id, prize_amount, match_count, verification_status, proof_image_url, draws ( draw_month )`).eq('user_id', user.id)

  if (profile?.subscription_status !== 'active') redirect('/subscribe')

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 text-zinc-50 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 1. PARTICIPATION & JACKPOT (Upcoming Draws) */}
        <div className="relative overflow-hidden bg-blue-600 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-500/20">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-4">Upcoming Jackpot</span>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">${estimatedJackpot.toFixed(2)}</h2>
              <p className="text-blue-100 font-medium mt-2">Draws Entered: {winnings?.length || 0} lifetime</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center min-w-[200px]">
              <span className="text-blue-200 text-[10px] font-black uppercase mb-2 block">Qualifier Progress</span>
              <div className="text-5xl font-black text-white">{scores?.length || 0}/5</div>
              <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${Math.min(((scores?.length || 0) / 5) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATUS & RENEWAL + 3. CHARITY & % */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-[2rem] p-6 border border-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Subscription Status</p>
              <h1 className="text-xl font-bold text-white capitalize">{profile.subscription_plan} Active</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                Renewal: {profile.current_period_end ? format(new Date(profile.current_period_end), 'MMM dd, yyyy') : 'Monthly'}
              </p>
            </div>
            <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-500 text-[10px] font-black uppercase">Live</div>
          </div>

          <Link href="/dashboard/charities" className="bg-zinc-900 rounded-[2rem] p-6 border border-zinc-800 flex justify-between items-center hover:bg-zinc-800/50 transition-colors">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Impact Selection</p>
              <p className="text-white font-bold">{profile.charities?.name || 'Select Charity'}</p>
              <p className="text-[10px] text-blue-500 font-black uppercase mt-1">{profile.donation_percentage || 10}% Contribution</p>
            </div>
            <span className="text-blue-500 font-black text-xs">Edit →</span>
          </Link>
        </div>

        {/* 4. SCORE ENTRY AND EDIT INTERFACE */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-zinc-900 rounded-[2rem] border border-zinc-800 p-8">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-tight">Log New Score</h2>
            <form action={addScore} className="space-y-4">
              <input type="number" name="score" min="1" max="45" required className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Stableford Score" />
              <input type="date" name="played_date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:invert" />
              <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">Save Round</button>
            </form>
          </div>

          <div className="md:col-span-2 bg-zinc-900 rounded-[2rem] border border-zinc-800 p-8">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-tight">Active Rounds (Editable)</h2>
            <div className="space-y-3">
              {scores?.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800 rounded-2xl group">
                  <div className="flex-1">
                    <p className="font-bold text-white">{format(new Date(s.played_date), 'MMMM dd')}</p>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-wider">
                      {s.is_verified ? (
                        <span className="text-green-500">Verified at {format(new Date(s.verified_at || s.created_at), 'HH:mm')}</span>
                      ) : (
                        <span className="text-zinc-500">Logged at {format(new Date(s.created_at), 'HH:mm')} • Pending</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <form action={updateScore} className="flex items-center gap-2">
                      <input type="hidden" name="score_id" value={s.id} />
                      <input type="number" name="new_score" defaultValue={s.score} className="w-12 bg-transparent text-2xl font-black text-blue-500 text-center outline-none focus:ring-b-2 focus:ring-blue-500" />
                      <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase opacity-0 group-hover:opacity-100 transition-all">Update</button>
                    </form>
                    <form action={deleteScore}>
                      <input type="hidden" name="score_id" value={s.id} />
                      <button className="text-zinc-800 hover:text-red-500 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Winnings & Proof Upload */}
        <div className="bg-zinc-900 rounded-[2rem] border border-zinc-800 p-8">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-tight">Winnings & Verification</h2>
          <div className="space-y-4">
            {winnings?.map((win: any) => (
              <div key={win.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-xs font-black text-zinc-500 uppercase">{win.draws?.draw_month} Draw</p>
                  <p className="text-lg font-black text-green-500">${Number(win.prize_amount).toFixed(2)}</p>
                </div>
                {win.verification_status === 'pending' && !win.proof_image_url ? (
                  <form action={submitWinnerProof} className="flex gap-2 w-full md:w-auto">
                    <input type="hidden" name="winning_id" value={win.id} />
                    <input name="proof_url" placeholder="Scorecard Link..." required className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase">Submit</button>
                  </form>
                ) : (
                  <span className="text-[10px] font-black px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full uppercase tracking-widest">{win.verification_status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}