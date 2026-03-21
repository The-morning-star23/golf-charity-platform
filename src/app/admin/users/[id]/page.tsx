import { createClient } from '@/utils/supabase/server'
import { adminUpdateUser, adminDeleteScore } from '../../actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// NEXT.JS 15 FIX: params is now a Promise
export default async function UserDetailPage(props: { 
  params: Promise<{ id: string }> 
}) {
  // 1. Await the params before accessing the ID
  const resolvedParams = await props.params
  const userId = resolvedParams.id

  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  
  // 2. Auth Gate
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', adminUser?.id)
    .single()

  if (!adminProfile?.is_admin) redirect('/dashboard')

  // 3. Data Fetching using the unwrapped userId
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: userScores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .order('played_date', { ascending: false })

  if (!targetUser) redirect('/admin/users')

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-50">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link href="/admin/users" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
          ← Back to Registry
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">
              Edit <span className="text-blue-600">Member</span>
            </h1>
            <p className="text-zinc-500 font-medium">{targetUser.email}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
            targetUser.subscription_status === 'active' 
              ? 'bg-green-600/10 text-green-500 border-green-500/20' 
              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
          }`}>
            {targetUser.subscription_status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PROFILE OVERRIDE */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight italic">Account Override</h2>
            <form action={adminUpdateUser} className="space-y-4">
              <input type="hidden" name="user_id" value={targetUser.id} />
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Subscription Status</label>
                <select name="status" defaultValue={targetUser.subscription_status} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Plan Type</label>
                <select name="plan" defaultValue={targetUser.subscription_plan} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-600">
                  <option value="free">Free</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                Push Updates
              </button>
            </form>
          </div>

          {/* SCORE HISTORY MANAGEMENT */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight italic">Score Ledger</h2>
            <div className="space-y-3">
              {userScores && userScores.length > 0 ? userScores.map((score) => (
                <div key={score.id} className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800 rounded-2xl group hover:border-zinc-700 transition-all">
                  <div>
                    <p className="text-lg font-black text-white tracking-tighter">{score.score} Points</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(score.played_date).toLocaleDateString()}</p>
                  </div>
                  <form action={adminDeleteScore}>
                    <input type="hidden" name="score_id" value={score.id} />
                    <input type="hidden" name="user_id" value={targetUser.id} />
                    <button className="text-zinc-800 hover:text-red-500 transition-colors p-2 active:scale-90">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </form>
                </div>
              )) : (
                <p className="text-center py-8 text-zinc-600 italic text-sm">No scores recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}