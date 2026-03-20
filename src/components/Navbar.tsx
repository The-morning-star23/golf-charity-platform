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
      className={`fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md px-6 py-4 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-extrabold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">DH</span>
          </div>
          Digital Heroes
        </Link>

        <Link href="/charities" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:block">
            Our Charities
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors hidden sm:block">
                Dashboard
              </Link>
              <form action={signOut}>
                <button className="bg-zinc-800 text-white px-5 py-2 rounded-full hover:bg-zinc-700 transition-colors shadow-lg border border-zinc-700">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="?auth=login" scroll={false} className="text-zinc-400 hover:text-white transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link href="?auth=register" scroll={false} className="bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                Join the Club
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}