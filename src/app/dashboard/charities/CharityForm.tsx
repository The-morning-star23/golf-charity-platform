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
  
  // NEW: Track which charity is currently clicked so the UI can react instantly!
  const [selectedCharity, setSelectedCharity] = useState(profile?.selected_charity_id || null)

  return (
    <form action={updateCharityPreferences} className="space-y-8">
      
      {/* Percentage Slider Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Donation Allocation</h2>
            <p className="text-sm text-gray-500">Slide to adjust your contribution percentage.</p>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {percentage}%
          </div>
        </div>
        
        <input 
          type="range" 
          name="percentage" 
          min="10" 
          max="100" 
          value={percentage}
          onChange={(e) => setPercentage(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
          <span>10% (Platform Minimum)</span>
          <span>100% (Maximum Impact)</span>
        </div>
      </div>

      {/* Charity Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {charities?.map((charity) => {
          // NEW: Check if this card's ID matches our React state
          const isSelected = selectedCharity === charity.id
          
          return (
            <label 
              key={charity.id} 
              className={`relative flex flex-col bg-white rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                isSelected ? 'border-blue-600 shadow-md shadow-blue-500/10' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <input 
                type="radio" 
                name="charity_id" 
                value={charity.id} 
                checked={isSelected}
                onChange={() => setSelectedCharity(charity.id)} // NEW: Update React state on click!
                className="absolute opacity-0" 
                required
              />
              <div 
                className="h-48 w-full bg-cover bg-center" 
                style={{ backgroundImage: `url(${charity.image_url})` }}
              />
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{charity.name}</h3>
                  {charity.is_featured && (
                     <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wide">Featured</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4 flex-1">{charity.description}</p>
                <div className={`text-sm font-semibold flex items-center gap-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                  </div>
                  {isSelected ? 'Currently Supporting' : 'Select this Cause'}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {/* Sticky Save Button */}
      <div className="sticky bottom-8 bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 shadow-2xl flex justify-between items-center z-10">
        <span className="text-zinc-300 text-sm font-medium ml-2">Review your choices and save to apply.</span>
        <button className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30">
          Save Preferences
        </button>
      </div>
    </form>
  )
}