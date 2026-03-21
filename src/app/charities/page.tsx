import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PublicCharitiesPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const searchQuery = searchParams.q || ''

  // 1. Fetch charities with search logic
  let query = supabase
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`)
  }

  const { data: charities } = await query

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-zinc-50">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header & Search Section */}
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
              Our <span className="text-blue-500">Impact</span> Partners
            </h1>
            <p className="text-lg text-zinc-400 font-medium">
              Every swing supports a cause. Select a charity to benefit from your monthly subscription or make a direct contribution.
            </p>
          </div>

          {/* Search Input (Phase 08 Requirement) */}
          <form className="relative max-w-md mx-auto group">
            <input 
              type="text" 
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by charity name..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
            />
            <button className="absolute right-4 top-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </form>
        </div>

        {/* Charity Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {charities?.map((charity) => (
            <div key={charity.id} className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all duration-300 flex flex-col group hover:shadow-2xl hover:shadow-blue-500/5">
              
              {/* Image & Featured Badge */}
              <div 
                className="h-64 w-full bg-cover bg-center relative" 
                style={{ backgroundImage: `url(${charity.image_url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                {charity.is_featured && (
                  <div className="absolute top-6 left-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                    Featured Partner
                  </div>
                )}
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{charity.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed flex-1 mb-8 italic">
                  &quot;{charity.description}&quot;
                </p>

                {/* Upcoming Events (Phase 08 Requirement) */}
                {charity.events && charity.events.length > 0 && (
                  <div className="mb-8 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Upcoming Event</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{charity.events[0].name}</span>
                      <span className="text-[10px] text-zinc-500">{charity.events[0].date}</span>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                   <Link 
                    href="?auth=register" 
                    scroll={false}
                    className="bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all text-center text-xs uppercase tracking-widest"
                  >
                    Join Club
                  </Link>
                  <Link 
                    href={`/donate/${charity.id}`}
                    className="bg-zinc-800 text-zinc-300 font-bold py-4 rounded-2xl hover:bg-zinc-700 transition-all text-center text-xs uppercase tracking-widest border border-zinc-700"
                  >
                    Direct Gift
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {charities?.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <p className="text-zinc-500 font-medium">No charities found matching "{searchQuery}"</p>
            <Link href="/charities" className="text-blue-500 text-sm mt-2 inline-block">Clear search</Link>
          </div>
        )}

      </div>
    </div>
  )
}