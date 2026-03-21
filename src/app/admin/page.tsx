/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { 
  updateVerificationStatus, 
  addCharity, 
  deleteCharity, 
  updateCharity,
  approveScore,
  approveAllScores 
} from './actions'
import DrawControl from './DrawControl'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }> 
}) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams
  const editId = resolvedSearchParams.edit

  // 1. GATEKEEPER
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard') 

  // 2. ANALYTICS DATA
  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  const { data: drawsData } = await supabase.from('draws').select('total_pool')
  const totalPrizePool = drawsData?.reduce((sum, draw) => sum + Number(draw.total_pool), 0) || 0
  const estimatedCharityTotal = (activeUsersCount || 0) * 10 

  const { data: allCharities } = await supabase.from('charities').select('*').order('name', { ascending: true })

  // 3. CHARITY REPORT LOGIC
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

  const editingCharity = editId ? allCharities?.find(c => c.id === editId) : null;

  // 4. QUEUES & HISTORY
  const { data: pendingScores } = await supabase
    .from('scores')
    .select('*, profiles(email)')
    .eq('is_verified', false)
    .order('created_at', { ascending: false });

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
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Link 
                href="/dashboard" 
                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500 transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Switch to Player View
              </Link>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 animate-pulse">
                Live Admin Mode
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Admin <span className="text-blue-600">Command</span> Center
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="bg-zinc-900 border border-zinc-800 text-white px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-zinc-800 transition-all flex items-center gap-2 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-blue-500 transition-colors"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Manage Users
            </Link>
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Active Subscribers</p>
            <p className="text-4xl font-black text-white">{activeUsersCount || 0}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Distributed</p>
            <p className="text-4xl font-black text-green-500">${totalPrizePool.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Monthly Charity Impact</p>
            <p className="text-4xl font-black text-blue-500">${estimatedCharityTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* DRAW ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DrawControl />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 h-fit shadow-2xl text-center">
            <h2 className="text-xl font-black text-white mb-4 uppercase italic">System Logic</h2>
            <p className="text-xs text-zinc-500 mb-6 uppercase tracking-widest font-bold">Default: Pure Randomized</p>
            <button className="w-full bg-zinc-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Configure Algorithm</button>
          </div>
        </div>

        {/* SCORE VERIFICATION STATION */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Score <span className="text-blue-500">Verification</span> Station</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">{pendingScores?.length || 0} Rounds Pending Audit</p>
            </div>
            
            {pendingScores && pendingScores.length > 0 && (
              <form action={approveAllScores}>
                <button className="bg-green-600/10 text-green-500 border border-green-500/20 px-6 py-2 rounded-full text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all shadow-lg shadow-green-500/5">
                  Approve All Rounds
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            {pendingScores && pendingScores.length > 0 ? pendingScores.map((score) => (
              <div key={score.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-zinc-700 transition-all">
                <div className="flex-1">
                  <p className="text-white font-black text-lg">{score.profiles?.email}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                    Stableford: <span className="text-blue-500">{score.score}</span> • Played: {format(new Date(score.played_date), 'MMM dd')}
                  </p>
                </div>
                
                <form action={async () => {
                  'use server'
                  await approveScore(score.id)
                }}>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/10">
                    Verify Round
                  </button>
                </form>
              </div>
            )) : (
              <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest">No rounds awaiting verification.</p>
              </div>
            )}
          </div>
        </div>

        {/* WINNER REVIEW STATION (Prize Claims) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter italic">Winner <span className="text-green-500">Review</span> Station</h2>
          <div className="space-y-4">
            {pendingVerifications && pendingVerifications.length > 0 ? pendingVerifications.map((item: any) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 group">
                <div className="flex-1">
                  <p className="text-white font-black text-lg">{item.profiles?.full_name || item.profiles?.email}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{item.draws?.draw_month} • Match {item.match_count}</p>
                  <p className="text-green-500 font-black text-2xl">${Number(item.prize_amount).toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <form action={updateVerificationStatus}>
                    <input type="hidden" name="winner_id" value={item.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Approve</button>
                  </form>
                  <form action={updateVerificationStatus}>
                    <input type="hidden" name="winner_id" value={item.id} />
                    <input type="hidden" name="status" value="paid" />
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Mark Paid</button>
                  </form>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-zinc-600 italic">Queue clear.</p>
            )}
          </div>
        </div>

        {/* CHARITY & IMPACT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic">Charity <span className="text-blue-600">Partners</span></h2>
            <form action={editingCharity ? updateCharity : addCharity} className="space-y-4 mb-8">
              {editingCharity && <input type="hidden" name="charity_id" value={editingCharity.id} />}
              <input name="name" defaultValue={editingCharity?.name} placeholder="Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none" required />
              <input name="image_url" defaultValue={editingCharity?.image_url} placeholder="Image URL" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none" required />
              <button className={`w-full font-black py-4 rounded-2xl ${editingCharity ? 'bg-amber-500' : 'bg-blue-600'} text-white uppercase text-xs tracking-widest`}>
                {editingCharity ? 'Update Partner' : 'Add Partner'}
              </button>
            </form>
            <div className="space-y-3">
              {allCharities?.map(c => (
                <div key={c.id} className="flex justify-between items-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <span className="text-sm font-bold text-white">{c.name}</span>
                  <div className="flex gap-2">
                    <Link href={`?edit=${c.id}`} className="p-2 text-zinc-600 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></Link>
                    <form action={deleteCharity}><input type="hidden" name="charity_id" value={c.id} /><button className="p-2 text-zinc-800 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button></form>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic">Impact <span className="text-blue-600">Report</span></h2>
            <div className="space-y-4">
              {charityReport.map((charity) => (
                <div key={charity.id} className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-white font-black text-sm">{charity.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{charity.supporterCount} Supporters</p>
                  </div>
                  <p className="text-2xl font-black text-blue-500">${charity.payout.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DRAW LEDGER */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter italic">Draw <span className="text-zinc-500">Ledger</span></h2>
          <div className="space-y-4">
            {pastDraws?.map((draw: any) => (
              <div key={draw.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 group hover:border-zinc-700 transition-all">
                <div className="flex flex-wrap justify-between items-center gap-8">
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{draw.draw_month}</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{new Date(draw.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-3">
                    {draw.winning_numbers.map((n: number) => (
                      <div key={n} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center font-black text-white text-sm bg-zinc-900">{n}</div>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-green-500 font-black text-2xl tracking-tighter">${draw.total_pool.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Prize Pool</p>
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