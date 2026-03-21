/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { updateVerificationStatus, addCharity, deleteCharity } from './actions'
import DrawControl from './DrawControl'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. GATEKEEPER
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard') 

  // 2. DATA FETCHING
  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  const { data: drawsData } = await supabase.from('draws').select('total_pool')
  const totalPrizePool = drawsData?.reduce((sum, draw) => sum + Number(draw.total_pool), 0) || 0
  const estimatedCharityTotal = (activeUsersCount || 0) * 10 

  const { data: allCharities } = await supabase.from('charities').select('*').order('name', { ascending: true })

  // Charity Payout Report Logic
  const { data: userCharitySelections } = await supabase
    .from('profiles')
    .select('selected_charity_id')
    .eq('subscription_status', 'active')

  const charityReport = allCharities?.map(charity => {
    const activeSupporters = userCharitySelections?.filter(s => s.selected_charity_id === charity.id).length || 0
    return {
      ...charity,
      payout: activeSupporters * 10,
      supporterCount: activeSupporters
    }
  }).sort((a, b) => b.payout - a.payout) || []

  // Queues and History (Updated for Phase 09)
  const { data: pendingVerifications } = await supabase
    .from('draw_winners')
    .select(`id, match_count, prize_amount, proof_image_url, verification_status, draws ( draw_month ), profiles ( email, full_name )`)
    .not('proof_image_url', 'is', null)
    .neq('verification_status', 'paid')
    .order('created_at', { ascending: false })

  const { data: pastDraws } = await supabase
    .from('draws')
    .select(`id, draw_month, created_at, winning_numbers, total_pool, rollover_amount, draw_winners ( id, match_count, prize_amount, verification_status, profiles ( email ) )`)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 text-zinc-50 pb-24">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-white mb-4 inline-block transition-colors">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Admin Command Center</h1>
          </div>
          <div className="bg-red-600/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase">
            Restricted Access
          </div>
        </div>

        {/* ANALYTICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Active Subs</p>
            <p className="text-4xl font-black text-white">{activeUsersCount || 0}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Pool Distributed</p>
            <p className="text-4xl font-black text-green-500">${totalPrizePool.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Monthly Charity Impact</p>
            <p className="text-4xl font-black text-blue-500">${estimatedCharityTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* DRAW ENGINE */}
        <DrawControl />

        {/* VERIFICATION QUEUE (Winner Review Station) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Winner Review Station</h2>
            <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">
              {pendingVerifications?.length || 0} Pending
            </span>
          </div>
          <div className="space-y-4">
            {pendingVerifications && pendingVerifications.length > 0 ? pendingVerifications.map((item: any) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 space-y-1">
                  <p className="text-white font-bold">{item.profiles?.full_name || item.profiles?.email}</p>
                  <p className="text-xs text-zinc-500 uppercase font-black">{item.draws?.draw_month} • Matched {item.match_count}</p>
                  <p className="text-green-500 font-black text-xl">${Number(item.prize_amount).toFixed(2)}</p>
                </div>

                {/* Proof Link */}
                <div className="w-full md:w-auto">
                  <a 
                    href={item.proof_image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-center hover:bg-blue-600/20 transition-colors"
                  >
                    <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">View Scorecard Proof ↗</span>
                  </a>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {item.verification_status === 'pending' ? (
                    <>
                      <form action={updateVerificationStatus} className="flex-1">
                        <input type="hidden" name="winner_id" value={item.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className="w-full bg-green-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-green-500 transition-colors">Approve</button>
                      </form>
                      <form action={updateVerificationStatus} className="flex-1">
                        <input type="hidden" name="winner_id" value={item.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="w-full bg-red-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-red-500 transition-colors">Reject</button>
                      </form>
                    </>
                  ) : (
                    <form action={updateVerificationStatus} className="w-full">
                      <input type="hidden" name="winner_id" value={item.id} />
                      <input type="hidden" name="status" value="paid" />
                      <button className="w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20">Mark as Paid</button>
                    </form>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl italic text-zinc-600">
                The verification queue is clear.
              </div>
            )}
          </div>
        </div>

        {/* CHARITY MANAGEMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-fit">
            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Charity Partners</h2>
            <form action={addCharity} className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <input name="name" placeholder="Charity Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" required />
                <input name="image_url" placeholder="Image URL" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <textarea name="description" placeholder="Description" rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500" required />
              
              {/* Feature/Event Fields */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" name="is_featured" id="is_featured" className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-blue-600 focus:ring-0" />
                  <label htmlFor="is_featured" className="text-xs font-bold text-zinc-400 uppercase">Feature on Homepage</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input name="event_name" placeholder="Event Name (optional)" className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white" />
                  <input name="event_date" placeholder="Date (e.g. Oct 12)" className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                Add Partner & Sync
              </button>
            </form>
            
            <div className="space-y-3">
              {allCharities?.map(c => (
                <div key={c.id} className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800 rounded-2xl group">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{c.name}</span>
                    {c.is_featured && <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-amber-500/20">Featured</span>}
                  </div>
                  <form action={deleteCharity}>
                    <input type="hidden" name="charity_id" value={c.id} />
                    <button className="text-zinc-700 hover:text-red-500 transition-colors p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-fit">
            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Payout Report</h2>
            <div className="space-y-3">
              {charityReport.map((charity) => (
                <div key={charity.id} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-white font-bold text-sm">{charity.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black">{charity.supporterCount} Members</p>
                  </div>
                  <p className="text-xl font-black text-blue-500">${charity.payout.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DRAW HISTORY (READ ONLY) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8 uppercase tracking-tight">Draw Ledger</h2>
          <div className="space-y-6">
            {pastDraws?.map((draw: any) => (
              <div key={draw.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
                <div className="flex flex-wrap justify-between items-center gap-6">
                  <div>
                    <h3 className="text-xl font-black text-white">{draw.draw_month}</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{new Date(draw.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {draw.winning_numbers.map((n: number) => (
                      <div key={n} className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center font-bold text-white text-sm bg-zinc-900 shadow-inner">{n}</div>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-green-500 font-black text-xl">${draw.total_pool.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Total Pool</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}