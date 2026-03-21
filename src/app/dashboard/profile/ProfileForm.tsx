/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { requestEmailChange, verifyEmailUpdate, updateProfile } from '../actions'

export default function ProfileForm({ profile, userEmail }: any) {
  const [loading, setLoading] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [otp, setOtp] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const newEmail = formData.get('email') as string
    
    try {
      // 1. Update Name & Phone instantly in the profiles table
      await updateProfile(formData)

      // 2. Check if the email has actually changed
      if (newEmail !== userEmail) {
        await requestEmailChange(newEmail)
        setPendingEmail(newEmail)
        setIsVerifyingEmail(true)
      } else {
        alert("Profile updated successfully!")
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while updating profile")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    setLoading(true)
    try {
      await verifyEmailUpdate(otp, pendingEmail)
      setIsVerifyingEmail(false)
      setOtp('')
      alert("Email verified and updated successfully!")
    } catch (err: any) {
      alert("Invalid verification code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // OTP Verification View
  if (isVerifyingEmail) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2rem] text-center">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Verify Your Email</h3>
          <p className="text-sm text-zinc-400 mt-2">
            We sent a code to <span className="text-white font-bold">{pendingEmail}</span>
          </p>
          
          <input 
            type="text" 
            placeholder="000000" 
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mt-6 w-full max-w-[200px] text-center bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-4 text-2xl font-black tracking-[0.3em] outline-none focus:border-blue-500 transition-all"
          />
          
          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => setIsVerifyingEmail(false)} 
              className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleVerifyEmail} 
              disabled={loading || otp.length < 6} 
              className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl text-sm hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Verifying...' : 'Confirm Code'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Standard Profile View
  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Full Name</label>
        <input 
          name="full_name" 
          type="text"
          defaultValue={profile?.full_name || ''} 
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          required 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
        <input 
          name="email" 
          type="email" 
          defaultValue={userEmail} 
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          required 
        />
        <p className="text-[9px] text-zinc-600 font-bold uppercase italic tracking-tighter">Changing email requires a verification code.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phone Number (Direct Update)</label>
        <input 
          name="phone" 
          type="tel" 
          defaultValue={profile?.phone || ''} 
          placeholder="+1 555 000 0000" 
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
        />
      </div>

      <button 
        disabled={loading} 
        className="w-full bg-white text-zinc-950 font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Save Profile Settings'}
      </button>
    </form>
  )
}