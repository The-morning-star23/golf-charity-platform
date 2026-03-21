import { createClient } from '@/utils/supabase/server'
import { updateProfile } from '../actions'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Link href="/dashboard" className="text-zinc-500 hover:text-white mb-8 inline-block transition-colors">
        ← Back to Dashboard
      </Link>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-zinc-400 mb-8 text-sm">Manage your public profile and account identity.</p>
        
        <form action={updateProfile} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Full Name
            </label>
            <input 
              name="full_name"
              type="text"
              defaultValue={profile?.full_name || ''}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input 
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
            />
            <p className="mt-2 text-[10px] text-zinc-600 italic">Email changes must be requested through support for security.</p>
          </div>

          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}