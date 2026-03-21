/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { generateDrawPreview, commitDraw } from './actions'

export default function DrawControl() {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const data = await generateDrawPreview()
      setPreview(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!confirm("Confirm and publish results? This will notify winners and roll over jackpots.")) return
    setLoading(true)
    try {
      await commitDraw(preview)
      setPreview(null)
      alert("Draw successfully published!")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Monthly Draw Engine</h2>
          <p className="text-zinc-400 text-sm max-w-xl">
            Run a simulation to verify winners and prize splits before officially publishing to the blockchain ledger.
          </p>
        </div>
        {!preview ? (
          <button 
            onClick={handleSimulate}
            disabled={loading}
            className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
          >
            {loading ? 'Calculating...' : '🎲 Simulate Draw'}
          </button>
        ) : (
          <div className="flex gap-3">
             <button 
              onClick={() => setPreview(null)}
              className="bg-zinc-800 text-white font-bold px-6 py-4 rounded-xl hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleCommit}
              disabled={loading}
              className="bg-green-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-500/20 active:scale-95"
            >
              {loading ? 'Publishing...' : '🚀 Confirm & Publish'}
            </button>
          </div>
        )}
      </div>

      {/* Simulation Results Preview */}
      {preview && (
        <div className="mt-8 p-6 bg-blue-600/5 border border-blue-500/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-wrap justify-between items-center gap-6 mb-8">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Simulated Numbers</span>
              <div className="flex gap-2">
                {preview.winningNumbers.map((n: number) => (
                  <div key={n} className="w-12 h-12 bg-blue-600 text-white font-black rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 text-lg">
                    {n}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1">Total Prize Pool</span>
              <span className="text-3xl font-black text-white">${preview.totalPool.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="text-sm font-bold text-zinc-400 mb-1">Match 5 (Jackpot)</div>
              <div className="text-xl font-bold text-white">{preview.results.match5.count} Winners</div>
              <div className="text-xs text-blue-500 mt-1 font-mono">${preview.results.match5.prizePerWinner.toFixed(2)} each</div>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="text-sm font-bold text-zinc-400 mb-1">Match 4</div>
              <div className="text-xl font-bold text-white">{preview.results.match4.count} Winners</div>
              <div className="text-xs text-blue-500 mt-1 font-mono">${preview.results.match4.prizePerWinner.toFixed(2)} each</div>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="text-sm font-bold text-zinc-400 mb-1">Match 3</div>
              <div className="text-xl font-bold text-white">{preview.results.match3.count} Winners</div>
              <div className="text-xs text-blue-500 mt-1 font-mono">${preview.results.match3.prizePerWinner.toFixed(2)} each</div>
            </div>
          </div>

          {preview.willRollover && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-500 text-sm font-medium flex items-center gap-2">
              ⚠️ No Match-5 winner. <strong>${preview.rolloverAmount.toFixed(2)}</strong> will roll over to next month.
            </div>
          )}
        </div>
      )}
    </div>
  )
}