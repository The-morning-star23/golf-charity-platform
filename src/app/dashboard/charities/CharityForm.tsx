'use client'

import { useState } from 'react'
import { updateCharityPreferences } from './actions'

type Profile = { selected_charity_id: string | null; charity_percentage: number | null }
type Charity = { id: string; name: string; description: string; image_url: string; is_featured: boolean }

export default function CharityForm({ 
  profile, 
  charities 
}: { 
  profile: Profile | null; 
  charities: Charity[] | null 
}) {
  const [percentage, setPercentage] = useState(profile?.charity_percentage || 10)
  const [selectedCharity, setSelectedCharity] = useState(profile?.selected_charity_id || null)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <form action={async (formData) => {
      setIsSaving(true)
      await updateCharityPreferences(formData)
      setIsSaving(false)
    }} className="space-y-8 relative">
      
      {/* Percentage Slider Area */}
      <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Donation Allocation</h2>
            <p className="text-sm text-zinc-400">Slide to adjust your contribution percentage.</p>
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {percentage}%
          </div>
        </div>
        
        <input 
          type="range" 
          name="percentage" 
          min="10" 
          max="100" 
          step="5"
          value={percentage}
          onChange={(e) => setPercentage(Number(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-2 font-medium">
          <span>10% (Platform Minimum)</span>
          <span>100% (Maximum Impact)</span>
        </div>
      </div>

      {/* Charity Grid */}
      <div className="grid md:grid-cols-2 gap-6 pb-24"> {/* Added pb-24 so the sticky footer doesn't hide the bottom cards */}
        {charities?.map((charity) => {
          const isSelected = selectedCharity === charity.id
          
          return (
            <label 
              key={charity.id} 
              className={`relative flex flex-col bg-zinc-900 rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                isSelected ? 'border-blue-600 shadow-lg shadow-blue-500/20 bg-blue-900/10' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <input 
                type="radio" 
                name="charity_id" 
                value={charity.id} 
                checked={isSelected}
                onChange={() => setSelectedCharity(charity.id)} 
                className="absolute opacity-0" 
                required
              />
              <div 
                className="h-48 w-full bg-cover bg-center border-b border-zinc-800" 
                style={{ backgroundImage: `url(${charity.image_url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80"></div>
              </div>
              <div className="p-6 flex-1 flex flex-col z-10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{charity.name}</h3>
                  {charity.is_featured && (
                     <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wide">Featured</span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 mb-6 flex-1">{charity.description}</p>
                <div className={`text-sm font-semibold flex items-center gap-3 ${isSelected ? 'text-blue-500' : 'text-zinc-500'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-zinc-600'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                  </div>
                  {isSelected ? 'Currently Supporting' : 'Select this Cause'}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-5xl bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-700 shadow-2xl flex justify-between items-center z-50">
        <span className="text-zinc-300 text-sm font-medium ml-2 hidden sm:block">Review your choices and save to apply.</span>
        <button 
          disabled={isSaving}
          className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}