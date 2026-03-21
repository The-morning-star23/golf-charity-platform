import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 text-zinc-50">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link href="/dashboard" className="text-sm font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
          ← Back to Clubhouse
        </Link>
        
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Account <span className="text-blue-600">Secure</span></h1>
          <p className="text-zinc-500 font-medium">Verified updates for email and mobile.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <ProfileForm 
            profile={profile} 
            userEmail={user.email} 
            userPhone={user.phone} 
          />
        </div>
      </div>
    </div>
  )
}