import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Digital Heroes | Play Golf. Make an Impact.',
  description: 'The modern golf club built for purpose. Track scores, fund charities, and win monthly draws.',
  icons: {
    icon: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/26f3.png', 
    apple: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/26f3.png', 
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      {/* Notice the pt-[76px] to offset the fixed header! */}
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen flex flex-col pt-[76px]`}>
        
        {/* Our Smart Navbar */}
        <Navbar isLoggedIn={!!user} />

        <main className="flex-1">
          {children}
        </main>

        <footer className="py-8 text-center text-zinc-600 text-sm border-t border-zinc-900 bg-zinc-950">
          <p>© {new Date().getFullYear()} Digital Heroes Golf. Built for impact.</p>
        </footer>

      </body>
    </html>
  )
}