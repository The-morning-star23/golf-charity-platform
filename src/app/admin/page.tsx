/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { executeMonthlyDraw, updateVerificationStatus } from './actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. Fetch Analytics Data
  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  const { data: drawsData } = await supabase.from('draws').select('total_pool')
  const totalPrizePool = drawsData?.reduce((sum, draw) => sum + Number(draw.total_pool), 0) || 0

  // Simulate charity contribution (10% of $100/mo sub for active users)
  const estimatedCharityTotal = (activeUsersCount || 0) * 10 

  // 2. Fetch Pending Verifications (Users who uploaded proof)
  const { data: pendingVerifications } = await supabase
    .from('draw_winners')
    .select(`
      id, match_count, prize_amount, proof_image_url, verification_status,
      draws ( draw_month ),
      profiles ( email )
    `)
    .not('proof_image_url', 'is', null)
    .in('verification_status', ['pending', 'approved']) // Show pending to approve, and approved to pay!
    .order('created_at', { ascending: false })

  // 3. Fetch Draw History
  const { data: pastDraws } = await supabase
    .from('draws')
    .select(`
      id, draw_month, created_at, winning_numbers, total_pool, rollover_amount,
      draw_winners (
        id, match_count, prize_amount, verification_status,
        profiles ( email )
      )
    `)
    .order('created_at', { ascending: false })

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
              <p className="text-zinc-400">Manage draws, verify winners, and view platform analytics.</p>
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

                  {/* Admin Action Buttons */}
                  <div className="flex gap-2 w-full md:w-auto">
                    {item.verification_status === 'pending' ? (
                      <>
                        <form action={updateVerificationStatus}>
                          <input type="hidden" name="winner_id" value={item.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button className="bg-green-600/20 text-green-500 border border-green-600/30 hover:bg-green-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                            Approve
                          </button>
                        </form>
                        <form action={updateVerificationStatus}>
                          <input type="hidden" name="winner_id" value={item.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button className="bg-red-600/20 text-red-500 border border-red-600/30 hover:bg-red-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                            Reject
                          </button>
                        </form>
                      </>
                    ) : (
                      <form action={updateVerificationStatus}>
                        <input type="hidden" name="winner_id" value={item.id} />
                        <input type="hidden" name="status" value="paid" />
                        <button className="bg-blue-600 text-white hover:bg-blue-500 px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg">
                          Mark as Paid
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
              No pending verifications or payouts at this time.
            </div>
          )}
        </div>

        {/* The Draw Engine Control */}
        <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Execute Monthly Lottery</h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              Generates 5 random numbers, checks all active subscriber scores, calculates tier splits, and rolls over un-won jackpots.
            </p>
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
                        <div key={i} className="w-10 h-10 bg-zinc-800 border border-zinc-700 text-white font-bold rounded-full flex items-center justify-center shadow-md">
                          {num}
                        </div>
                      ))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-500 uppercase tracking-wide font-bold">Total Pool</div>
                      <div className="text-xl font-black text-green-500">${draw.total_pool.toFixed(2)}</div>
                      {draw.rollover_amount > 0 && (
                         <div className="text-xs text-amber-500 font-bold mt-1">Rolled over: ${draw.rollover_amount.toFixed(2)}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Verified Winners</h4>
                    {draw.draw_winners && draw.draw_winners.length > 0 ? (
                      draw.draw_winners.map((winner: any) => (
                        <div key={winner.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                          <div className="flex items-center gap-4">
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-2 py-1 rounded">
                              Match {winner.match_count}
                            </span>
                            <span className="font-medium text-white">{winner.profiles?.email}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-green-500">${winner.prize_amount.toFixed(2)}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                              winner.verification_status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              winner.verification_status === 'paid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              winner.verification_status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
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
            <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
              No lottery draws have been executed yet.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}