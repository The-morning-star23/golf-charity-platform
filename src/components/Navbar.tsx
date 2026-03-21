'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions'

export default function Navbar({ 
  isLoggedIn, 
  subscriptionStatus 
}: { 
  isLoggedIn: boolean,
  subscriptionStatus?: string | null 
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 1. Handle Scroll (Hide/Show Navbar)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false)
        setIsDropdownOpen(false) 
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // 2. Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header 
      className={`fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md px-6 py-4 transition-transform duration-300 border-b border-zinc-900/50 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white text-base font-black">DH</span>
          </div>
          <span className="text-white hidden sm:block">Digital Heroes</span>
        </Link>

        {/* Navigation Section */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/charities" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest">
            Charities
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-6 md:gap-8">
              {/* REBRANDED: Clubhouse -> Dashboard */}
              <Link href="/dashboard" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest">
                Dashboard
              </Link>

              {/* PROFILE DROPDOWN TRIGGER */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-xl transition-all active:scale-95"
                >
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"></path></svg>
                </button>

                {/* THE DROPDOWN MENU */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Member Tools</p>
                    </div>
                    
                    <Link 
                      href="/dashboard/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l-.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      Account Settings
                    </Link>

                    {/* DYNAMIC PLAN LINK */}
                    <Link 
                      href={subscriptionStatus === 'active' ? '/dashboard' : '/subscribe'} 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
                      {subscriptionStatus === 'active' ? 'My Subscription' : 'Upgrade Plan'}
                    </Link>

                    <div className="h-px bg-zinc-800 my-2" />

                    <form action={signOut} className="w-full">
                      <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                        Sign Out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="?auth=login" scroll={false} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link 
                href="?auth=register" 
                scroll={false} 
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Join Club
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}