'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Wait 3 seconds for the Webhook to finish, then go to dashboard
    const timer = setTimeout(() => {
      router.push('/dashboard')
      router.refresh() // Crucial: This clears the cache so middleware sees the 'active' status
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Welcome to the Club</h1>
        <p className="text-zinc-400 font-medium">
          We&apos;re finalizing your membership. You&apos;ll be redirected to your dashboard in a moment...
        </p>
        <div className="flex justify-center gap-1.5">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  )
}