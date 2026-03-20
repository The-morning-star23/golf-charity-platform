/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { executeMonthlyDraw } from './actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. Fetch past draws, joining with the profiles table to get the winner's email
  const { data: pastDraws } = await supabase
    .from('draws')
    .select(`
      id,
      draw_month,
      created_at,
      profiles ( email )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1">
            ← Back to App
          </Link>
          <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
              <p className="text-zinc-400">Manage monthly draws and platform operations.</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-mono font-bold">
              RESTRICTED ACCESS
            </div>
          </div>
        </div>

        {/* The Draw Engine Control */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Execute Monthly Draw</h2>
            <p className="text-gray-500 text-sm">
              This will randomly select one winner from the pool of currently active subscribers. 
              This action cannot be undone.
            </p>
          </div>
          
          <form action={executeMonthlyDraw}>
            <button className="bg-gray-800 text-white font-bold px-8 py-4 rounded-xl hover:bg-gray-600 transition-colors shadow-lg active:scale-95 flex items-center gap-2">
              <span className="text-xl">🎲</span> Run the Draw
            </button>
          </form>
        </div>

        {/* History Ledger */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Draw History Ledger</h2>
          
          {pastDraws && pastDraws.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pastDraws.map((draw: any) => (
                <div key={draw.id} className="py-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-900">{draw.draw_month}</div>
                    <div className="text-sm text-gray-500">
                      Executed on {new Date(draw.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg font-medium">
                    Winner: {draw.profiles?.email || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              No draws have been executed yet.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}