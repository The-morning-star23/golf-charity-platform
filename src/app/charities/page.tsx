import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PublicCharitiesPage() {
  const supabase = await createClient()

  // Fetch all available charities for the public directory
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-zinc-50">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Play Golf. <span className="text-blue-500">Make an Impact.</span>
          </h1>
          <p className="text-lg text-zinc-400">
            A minimum of 10% of every Digital Heroes subscription goes directly to a cause of your choice. Explore our partnered charities below.
          </p>
        </div>

        {/* Charity Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {charities?.map((charity) => (
            <div key={charity.id} className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors flex flex-col group">
              <div 
                className="h-56 w-full bg-cover bg-center border-b border-zinc-800 relative overflow-hidden" 
                style={{ backgroundImage: `url(${charity.image_url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent"></div>
                {charity.is_featured && (
                  <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
                    Featured Partner
                  </div>
                )}
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">{charity.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed flex-1 mb-8">
                  {charity.description}
                </p>
                
                <Link 
                  href="?auth=register" 
                  scroll={false}
                  className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-colors text-center text-sm border border-zinc-700 hover:border-blue-500"
                >
                  Support this Cause
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}