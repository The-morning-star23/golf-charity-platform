'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthModal() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // 1. The URL is our single source of truth
  const authType = searchParams.get('auth')
  const isOpen = authType === 'login' || authType === 'register'
  
  // 2. Derive isLogin directly instead of using useState/useEffect!
  const isLogin = authType === 'login' 

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Supabase Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!isOpen) return null

  const closeModal = () => {
    router.push(pathname, { scroll: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isLogin) {
      // LOGIN FLOW -> Send to Dashboard
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      // REGISTRATION FLOW -> Send to Subscribe Page
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else {
        if (data.user && fullName) {
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id)
        }
        // PERFECT UX ROUTING: Send new users to the pricing page!
        router.push('/subscribe')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={closeModal}></div>

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <button onClick={closeModal} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800">
          ✕
        </button>

        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <span className="text-white text-xl font-bold">DH</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          {isLogin ? 'Welcome Back' : 'Join the Club'}
        </h2>
        <p className="text-sm text-zinc-400 mb-8">
          {isLogin ? 'Sign in to access your dashboard.' : 'Start tracking scores and making an impact.'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => router.push(`?auth=${isLogin ? 'register' : 'login'}`, { scroll: false })}
            className="text-blue-500 font-semibold hover:text-blue-400 transition-colors"
          >
            {isLogin ? 'Join here' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}