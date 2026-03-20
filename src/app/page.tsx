import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const supabase = await createClient()

  // Fetch only the 'featured' charities to showcase on the homepage
  const { data: featuredCharities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .limit(2)

  return (
    <div className="selection:bg-blue-500/30">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 px-4 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1]">
            Play Golf. <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Make an Impact.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The modern golf club built for purpose. Track your scores, fund world-changing charities, and win exclusive monthly draws with every swing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="?auth=register" scroll={false} className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-8 py-4 rounded-full hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 text-lg">
              Start Your Membership
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-zinc-900 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">⛳️</div>
              <h3 className="text-2xl font-bold">1. Track Your Game</h3>
              <p className="text-zinc-400 leading-relaxed">Log your Stableford scores in our beautiful rolling ledger. We always keep your best, most recent 5 rounds.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">🤝</div>
              <h3 className="text-2xl font-bold">2. Choose Your Cause</h3>
              <p className="text-zinc-400 leading-relaxed">Direct up to 100% of your subscription to a partnered charity of your choice. You control your impact.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">🏆</div>
              <h3 className="text-2xl font-bold">3. Win the Draw</h3>
              <p className="text-zinc-400 leading-relaxed">Every active subscriber is automatically entered into our secure, randomized monthly prize draw.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Causes We Champion</h2>
              <p className="text-zinc-400 text-lg">Your membership directly funds these incredible organizations. Here are our current featured partners.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredCharities?.map((charity) => (
              <div key={charity.id} className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 transition-all hover:border-zinc-700">
                <div 
                  className="h-64 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                  style={{ backgroundImage: `url(${charity.image_url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 w-full p-8">
                  <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                    Featured
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{charity.name}</h3>
                  <p className="text-zinc-300 line-clamp-2">{charity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto bg-blue-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to tee off?</h2>
            <p className="text-blue-100 text-lg md:text-xl max-w-xl mx-auto">
              Join hundreds of golfers making a difference on and off the course.
            </p>
            <Link href="/register" className="inline-block bg-white text-blue-600 font-bold px-10 py-4 rounded-full hover:bg-zinc-100 transition-all hover:scale-105 active:scale-95 shadow-xl text-lg">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  )
}