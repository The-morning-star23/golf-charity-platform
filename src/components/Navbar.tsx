'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions'

export default function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <header 
      className={`fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md px-6 py-5 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white text-base">DH</span>
          </div>
          <span className="text-white">Digital Heroes</span>
        </Link>

        {/* Navigation Section */}
        <div className="flex items-center gap-8">
          {/* 1. Our Charities */}
          <Link 
            href="/charities" 
            className="text-base font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Our Charities
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-8">
              {/* 2. Dashboard */}
              <Link 
                href="/dashboard" 
                className="text-base font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>

              {/* 3. NEW: Profile Settings */}
              <Link 
                href="/dashboard/profile" 
                className="text-base font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Profile
              </Link>
              
              {/* 4. Sign Out */}
              <form action={signOut}>
                <button className="bg-zinc-100 text-zinc-950 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-300 transition-all shadow-xl active:scale-95">
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link 
                href="?auth=login" 
                scroll={false} 
                className="text-base font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="?auth=register" 
                scroll={false} 
                className="bg-blue-600 text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Join the Club
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}