/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { executeMonthlyDraw } from './actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch past draws AND their nested winners in one massive query!
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-4 inline-block items-center gap-1">
            ← Back to App
          </Link>
          <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
              <p className="text-zinc-400">Manage monthly draws, view financial pools, and verify winners.</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-mono font-bold hidden sm:block">
              RESTRICTED ACCESS
            </div>
          </div>
        </div>

        {/* The Draw Engine Control */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Execute Monthly Lottery</h2>
            <p className="text-gray-500 text-sm max-w-xl">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Draw History & Winners</h2>
          
          {pastDraws && pastDraws.length > 0 ? (
            <div className="space-y-6">
              {pastDraws.map((draw: any) => (
                <div key={draw.id} className="border-2 border-gray-100 rounded-xl p-6">
                  
                  {/* Draw Header Data */}
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{draw.draw_month}</h3>
                      <p className="text-sm text-gray-500">Executed on {new Date(draw.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {draw.winning_numbers.map((num: number, i: number) => (
                        <div key={i} className="w-10 h-10 bg-black text-white font-bold rounded-full flex items-center justify-center shadow-md">
                          {num}
                        </div>
                      ))}
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500 uppercase tracking-wide font-bold">Total Pool</div>
                      <div className="text-xl font-black text-green-600">${draw.total_pool.toFixed(2)}</div>
                      {draw.rollover_amount > 0 && (
                         <div className="text-xs text-amber-600 font-bold">Rolled over: ${draw.rollover_amount.toFixed(2)}</div>
                      )}
                    </div>
                  </div>

                  {/* Winners List for this Draw */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Verified Winners</h4>
                    {draw.draw_winners && draw.draw_winners.length > 0 ? (
                      draw.draw_winners.map((winner: any) => (
                        <div key={winner.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-4">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                              Match {winner.match_count}
                            </span>
                            <span className="font-medium text-gray-900">{winner.profiles?.email}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-green-600">${winner.prize_amount.toFixed(2)}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                              winner.verification_status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {winner.verification_status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No users matched 3 or more numbers in this draw.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              No lottery draws have been executed yet.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}