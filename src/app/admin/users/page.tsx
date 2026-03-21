import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  // 1. UNWRAP the searchParams promise
  const resolvedSearchParams = await searchParams
  const queryTerm = resolvedSearchParams.q

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Gatekeeper
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  // Search Logic
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  
  // 2. Use the unwrapped queryTerm
  if (queryTerm) {
    query = query.ilike('email', `%${queryTerm}%`)
  }
  const { data: users } = await query

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest">← Back to Command Center</Link>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter mt-2">Member <span className="text-blue-600">Registry</span></h1>
          </div>
        </div>

        {/* Search Bar */}
        <form className="relative">
          <input 
            name="q"
            defaultValue={queryTerm} // Pre-fill with the active search
            placeholder="Search by email..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-600"
          />
        </form>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Plan</th>
                <th className="px-8 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-white">{u.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      u.subscription_status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {u.subscription_status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-zinc-400 uppercase">{u.subscription_plan}</td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-[8px] text-zinc-700 block mb-1 uppercase font-bold tracking-tighter">ID: {u.id.slice(0,8)}...</span>
                    <Link 
                      href={`/admin/users/${u.id}`} 
                      className="text-xs font-bold bg-zinc-800 hover:bg-white hover:text-black px-4 py-2 rounded-lg transition-all"
                    >
                      Manage Scores & Plan
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}