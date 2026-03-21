/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { requestEmailChange, requestPhoneChange, verifyUpdateOTP, updateProfile } from '../actions'

export default function ProfileForm({ profile, userEmail, userPhone }: any) {
  const [loading, setLoading] = useState(false)
  const [verifyMode, setVerifyMode] = useState<'none' | 'email' | 'phone'>('none')
  const [otp, setOtp] = useState('')
  const [pendingValue, setPendingValue] = useState('')

  const handleInitialUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      // 1. Update Name (Standard)
      await updateProfile(formData)

      // 2. Check for Email Change
      const newEmail = formData.get('email') as string
      if (newEmail !== userEmail) {
        await requestEmailChange(newEmail)
        setPendingValue(newEmail)
        setVerifyMode('email')
      }

      // 3. Check for Phone Change
      const newPhone = formData.get('phone') as string
      if (newPhone !== userPhone) {
        await requestPhoneChange(newPhone)
        setPendingValue(newPhone)
        setVerifyMode('phone')
      }

      if (newEmail === userEmail && newPhone === userPhone) {
        alert("Profile name updated!")
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async () => {
    setLoading(true)
    try {
      await verifyUpdateOTP(otp, verifyMode === 'email' ? 'email_change' : 'phone_change', pendingValue)
      setVerifyMode('none')
      setOtp('')
      alert("Verified and updated successfully!")
    } catch (err: any) {
      alert("Invalid code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (verifyMode !== 'none') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl text-center">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Verify {verifyMode === 'email' ? 'Email' : 'Phone'}</h3>
          <p className="text-sm text-zinc-400 mt-2">We sent a 6-digit code to <span className="text-white font-bold">{pendingValue}</span></p>
          <input 
            type="text" 
            placeholder="000000" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mt-6 w-full max-w-[200px] text-center bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-2xl font-black tracking-[0.5em] outline-none focus:border-blue-500 transition-all"
          />
          <div className="flex gap-3 mt-8">
            <button onClick={() => setVerifyMode('none')} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl text-sm">Cancel</button>
            <button onClick={handleOTPVerify} disabled={loading} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl text-sm hover:bg-blue-500 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Confirm Code'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleInitialUpdate} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Full Name</label>
        <input name="full_name" defaultValue={profile?.full_name} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
        <input name="email" type="email" defaultValue={userEmail} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phone Number (with Country Code)</label>
        <input name="phone" type="tel" defaultValue={userPhone} placeholder="+1 555 000 0000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <button disabled={loading} className="w-full bg-white text-zinc-950 font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95">
        {loading ? 'Processing...' : 'Save & Verify Changes'}
      </button>
    </form>
  )
}