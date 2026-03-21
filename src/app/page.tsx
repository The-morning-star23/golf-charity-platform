import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image' // 1. IMPORT NEXT IMAGE
import { ArrowRight, Heart, Trophy, Target, ChevronDown } from 'lucide-react'
import LandingClientWrapper from '@/components/LandingClientWrapper'

export default async function LandingPage() {
  const supabase = await createClient()
  
  const { data: featuredCharities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .limit(3)

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      <LandingClientWrapper>
        
        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-5xl w-full text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              The New Era of Charitable Play
            </div>

            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] mb-8">
              Every Birdie <br />
              <span className="text-blue-600">Changes a Life.</span>
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              Turn your weekend rounds into real-world impact. Join a community of golfers funding global charities and winning life-changing prize pools every single month.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/subscribe" className="group relative bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-2xl shadow-white/5">
                Start Impacting Now
                <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-700 animate-bounce">
            <ChevronDown size={32} />
          </div>
        </section>

        {/* IMPACT METER */}
        <section className="py-24 border-y border-zinc-900 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Total Lives Affected</p>
                <h3 className="text-5xl font-black italic tracking-tighter">12,450+</h3>
              </div>
              <div>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Charity Contributions</p>
                <h3 className="text-5xl font-black italic tracking-tighter">$240,000</h3>
              </div>
              <div>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Monthly Prize Pool</p>
                <h3 className="text-5xl font-black italic tracking-tighter text-green-500">$15,000</h3>
              </div>
            </div>
          </div>
        </section>

        {/* RESTORED & OPTIMIZED: FEATURED CHARITIES SECTION */}
        <section className="py-32 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                  Driven by <br /><span className="text-blue-600">Purpose.</span>
                </h2>
              </div>
              <Link href="/charities" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                View All Partners →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCharities?.map((charity) => (
                <div key={charity.id} className="group relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-zinc-900 border border-zinc-800">
                  {/* 2. REPLACED <img> WITH <Image /> */}
                  <Image 
                    src={charity.image_url} 
                    alt={charity.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="absolute inset-0 object-cover opacity-60 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  <div className="absolute bottom-0 p-8 space-y-2">
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter">{charity.name}</h4>
                    <p className="text-zinc-400 text-sm font-medium line-clamp-2">{charity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-32 px-6 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-[3rem] hover:border-blue-500/50 transition-all group">
                <div className="mb-8 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit"><Target className="text-blue-500" size={40} /></div>
                <h4 className="text-2xl font-black uppercase italic mb-4">Play Your Game</h4>
                <p className="text-zinc-500 font-medium">Log your scores from any course. Your standard weekend round is all it takes.</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-[3rem] hover:border-blue-500/50 transition-all group">
                <div className="mb-8 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit"><Heart className="text-red-500" size={40} /></div>
                <h4 className="text-2xl font-black uppercase italic mb-4">Fund a Future</h4>
                <p className="text-zinc-500 font-medium">40% of your membership goes directly to the charity you choose to support.</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-[3rem] hover:border-blue-500/50 transition-all group">
                <div className="mb-8 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit"><Trophy className="text-amber-500" size={40} /></div>
                <h4 className="text-2xl font-black uppercase italic mb-4">Win the Draw</h4>
                <p className="text-zinc-500 font-medium">Every verified score enters you into the monthly pool. Match numbers, win big.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto bg-blue-600 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
            <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none mb-8">
              Ready to Play <br /> for Something <br /> Bigger?
            </h2>
            <Link href="/subscribe" className="inline-block bg-white text-blue-600 px-12 py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] hover:bg-zinc-950 hover:text-white transition-all shadow-2xl">
              Become a Member
            </Link>
          </div>
        </section>

      </LandingClientWrapper>
    </div>
  )
}