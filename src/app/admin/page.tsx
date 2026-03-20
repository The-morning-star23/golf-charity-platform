/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { executeMonthlyDraw, updateVerificationStatus, addCharity, deleteCharity } from './actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // ---------------- NEW GATEKEEPER ----------------
  // 1. Check if anyone is logged in at all
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Check if the logged-in user is an ADMIN
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    // KICK THEM OUT! They are just a normal user.
    redirect('/dashboard') 
  }
  // ------------------------------------------------

  // 1. Fetch Analytics Data
  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  const { data: drawsData } = await supabase.from('draws').select('total_pool')
  const totalPrizePool = drawsData?.reduce((sum, draw) => sum + Number(draw.total_pool), 0) || 0
  const estimatedCharityTotal = (activeUsersCount || 0) * 10 

  // 2. Fetch Pending Verifications
  const { data: pendingVerifications } = await supabase
    .from('draw_winners')
    .select(`id, match_count, prize_amount, proof_image_url, verification_status, draws ( draw_month ), profiles ( email )`)
    .not('proof_image_url', 'is', null)
    .in('verification_status', ['pending', 'approved'])
    .order('created_at', { ascending: false })

  // 3. Fetch Draw History
  const { data: pastDraws } = await supabase
    .from('draws')
    .select(`id, draw_month, created_at, winning_numbers, total_pool, rollover_amount, draw_winners ( id, match_count, prize_amount, verification_status, profiles ( email ) )`)
    .order('created_at', { ascending: false })

  // 4. NEW: Fetch All Users
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // 5. NEW: Fetch All Charities
  const { data: allCharities } = await supabase
    .from('charities')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 text-zinc-50">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-blue-500 hover:text-blue-400 mb-4 inline-block items-center gap-1 transition-colors">
            ← Back to App
          </Link>
          <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
              <p className="text-zinc-400">Manage draws, verify winners, and control platform data.</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-mono font-bold hidden sm:block">
              RESTRICTED ACCESS
            </div>
          </div>
        </div>

        {/* Analytics KPIs */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col justify-center">
            <span className="text-zinc-400 text-sm font-medium mb-1">Total Active Subscribers</span>
            <span className="text-3xl font-bold text-white">{activeUsersCount || 0}</span>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col justify-center">
            <span className="text-zinc-400 text-sm font-medium mb-1">Total Prize Pools Generated</span>
            <span className="text-3xl font-bold text-green-500">${totalPrizePool.toFixed(2)}</span>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col justify-center">
            <span className="text-zinc-400 text-sm font-medium mb-1">Est. Charity Contributions</span>
            <span className="text-3xl font-bold text-blue-500">${estimatedCharityTotal.toFixed(2)} / mo</span>
          </div>
        </div>

        {/* ---------------- NEW: USER MANAGEMENT ---------------- */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8 overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-6">User Directory</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-sm text-zinc-400">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {allUsers?.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 font-medium text-white">{u.full_name || '—'}</td>
                    <td className="py-4 text-zinc-400">{u.email}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        u.subscription_status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {u.subscription_status || 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-right text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- NEW: CHARITY MANAGEMENT ---------------- */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Add New Charity Form */}
          <div className="md:col-span-1 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Add New Charity</h2>
            <form action={addCharity} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Charity Name</label>
                <input type="text" name="name" required className="w-full rounded-lg px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Golfers for Good" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                <textarea name="description" required rows={3} className="w-full rounded-lg px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Short description..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Image URL</label>
                <input type="url" name="image_url" required className="w-full rounded-lg px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_featured" className="rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-blue-500" />
                <span className="text-sm text-zinc-300">Feature on Homepage</span>
              </label>
              <button className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-500 transition-colors text-sm">
                Add Charity
              </button>
            </form>
          </div>

          {/* List of Existing Charities */}
          <div className="md:col-span-2 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-6 h-full">
            <h2 className="text-lg font-bold text-white mb-4">Active Partnerships</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {allCharities?.map((charity) => (
                <div key={charity.id} className="flex justify-between items-center p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-cover bg-center border border-zinc-700" style={{ backgroundImage: `url(${charity.image_url})` }} />
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {charity.name}
                        {charity.is_featured && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded uppercase">Featured</span>}
                      </div>
                      <div className="text-xs text-zinc-500 line-clamp-1 max-w-sm">{charity.description}</div>
                    </div>
                  </div>
                  <form action={deleteCharity}>
                    <input type="hidden" name="charity_id" value={charity.id} />
                    <button className="text-zinc-600 hover:text-red-500 transition-colors p-2" title="Remove Charity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------------- EXISTING MODULES ---------------- */}

        {/* Verification Queue */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            Verification & Payout Queue
            {pendingVerifications && pendingVerifications.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pendingVerifications.length}</span>
            )}
          </h2>
          {pendingVerifications && pendingVerifications.length > 0 ? (
            <div className="space-y-4">
              {pendingVerifications.map((item: any) => (
                <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-white">{item.profiles?.email}</span>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-1 rounded uppercase font-bold">
                        Match {item.match_count}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-400 mb-2">
                      {item.draws?.draw_month} Draw • <span className="text-green-500 font-bold">${Number(item.prize_amount).toFixed(2)}</span>
                    </div>
                    <a href={item.proof_image_url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      🔗 View Proof Image
                    </a>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    {item.verification_status === 'pending' ? (
                      <>
                        <form action={updateVerificationStatus}>
                          <input type="hidden" name="winner_id" value={item.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button className="bg-green-600/20 text-green-500 border border-green-600/30 hover:bg-green-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Approve</button>
                        </form>
                        <form action={updateVerificationStatus}>
                          <input type="hidden" name="winner_id" value={item.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button className="bg-red-600/20 text-red-500 border border-red-600/30 hover:bg-red-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Reject</button>
                        </form>
                      </>
                    ) : (
                      <form action={updateVerificationStatus}>
                        <input type="hidden" name="winner_id" value={item.id} />
                        <input type="hidden" name="status" value="paid" />
                        <button className="bg-blue-600 text-white hover:bg-blue-500 px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg">Mark as Paid</button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">No pending verifications or payouts at this time.</div>
          )}
        </div>

        {/* The Draw Engine Control */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Execute Monthly Lottery</h2>
            <p className="text-zinc-400 text-sm max-w-xl">Generates 5 random numbers, checks all active subscriber scores, calculates tier splits, and rolls over un-won jackpots.</p>
          </div>
          <form action={executeMonthlyDraw}>
            <button className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 active:scale-95 flex items-center gap-2 whitespace-nowrap">
              <span className="text-xl">🎲</span> Run the Draw
            </button>
          </form>
        </div>

        {/* History Ledger */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8">
          <h2 className="text-xl font-bold text-white mb-6">Draw History & Winners</h2>
          {pastDraws && pastDraws.length > 0 ? (
            <div className="space-y-6">
              {pastDraws.map((draw: any) => (
                <div key={draw.id} className="border-2 border-zinc-800 rounded-xl p-6 bg-zinc-950">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-zinc-800">
                    <div>
                      <h3 className="text-lg font-bold text-white">{draw.draw_month}</h3>
                      <p className="text-sm text-zinc-500">Executed on {new Date(draw.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {draw.winning_numbers.map((num: number, i: number) => (
                        <div key={i} className="w-10 h-10 bg-zinc-800 border border-zinc-700 text-white font-bold rounded-full flex items-center justify-center shadow-md">{num}</div>
                      ))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-500 uppercase tracking-wide font-bold">Total Pool</div>
                      <div className="text-xl font-black text-green-500">${draw.total_pool.toFixed(2)}</div>
                      {draw.rollover_amount > 0 && <div className="text-xs text-amber-500 font-bold mt-1">Rolled over: ${draw.rollover_amount.toFixed(2)}</div>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Verified Winners</h4>
                    {draw.draw_winners && draw.draw_winners.length > 0 ? (
                      draw.draw_winners.map((winner: any) => (
                        <div key={winner.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                          <div className="flex items-center gap-4">
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-2 py-1 rounded">Match {winner.match_count}</span>
                            <span className="font-medium text-white">{winner.profiles?.email}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-green-500">${winner.prize_amount.toFixed(2)}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${winner.verification_status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : winner.verification_status === 'paid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : winner.verification_status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {winner.verification_status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 italic">No users matched 3 or more numbers in this draw.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">No lottery draws have been executed yet.</div>
          )}
        </div>

      </div>
    </div>
  )
}