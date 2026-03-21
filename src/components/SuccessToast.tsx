'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function SuccessToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          className="fixed bottom-10 right-10 bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl z-50 border border-blue-400/50"
        >
          <CheckCircle className="text-white" />
          <span className="font-black uppercase tracking-widest text-xs">Action Verified</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}