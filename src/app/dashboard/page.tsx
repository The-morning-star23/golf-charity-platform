import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Double check auth state on the server component
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Clubhouse.</h1>
        <p className="text-gray-500 mb-6">You are logged in as: <span className="font-medium text-black">{user.email}</span></p>
        
        <form action="/auth/signout" method="post">
          <button className="bg-red-50 text-red-600 px-4 py-2 rounded-md border border-red-100 hover:bg-red-100 transition-colors">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}