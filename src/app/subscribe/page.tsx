import { createCheckoutSession } from './actions'

export default function SubscribePage() {
  // Grab the Price IDs from our environment variables
  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!
  const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Join the Movement.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track your scores, enter the monthly draws, and support charities with every swing. Choose your plan below.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-stretch">
        {/* Monthly Plan Card - Restyled to Light Dark */}
        <div className="bg-zinc-900 rounded-2xl shadow-xl p-8 flex flex-col border border-zinc-700/50">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Monthly</h2>
          <div className="flex items-baseline gap-1 mb-6 border-b border-zinc-700 pb-6">
            <span className="text-5xl font-extrabold text-white tracking-tighter">$10</span>
            <span className="text-zinc-400 font-medium">/month</span>
          </div>
          <ul className="space-y-4 mb-10 flex-1 text-zinc-300">
            <li className="flex items-center gap-3">✓ Enter up to 5 rolling scores</li>
            <li className="flex items-center gap-3">✓ Automatic entry into monthly draws</li>
            <li className="flex items-center gap-3">✓ 10% minimum charity contribution</li>
            <li className="flex items-center gap-3">✓ Cancel anytime</li>
          </ul>
          <form action={createCheckoutSession.bind(null, monthlyPriceId)} className="w-full">
            <button className="w-full bg-zinc-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:bg-zinc-600 active:scale-[0.98] focus:ring-2 focus:ring-zinc-400 focus:outline-none">
              Subscribe Monthly
            </button>
          </form>
        </div>

        {/* Yearly Plan Card - Highlighted, Also Light Dark */}
        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 flex flex-col border-2 border-blue-500 relative overflow-hidden">
          {/* Best Value Badge */}
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl tracking-wide uppercase">
            BEST VALUE
          </div>
          
          <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Yearly</h2>
          <div className="flex items-baseline gap-1 mb-6 border-b border-zinc-700 pb-6">
            <span className="text-5xl font-extrabold text-white tracking-tighter">$100</span>
            <span className="text-zinc-400 font-medium">/year</span>
          </div>
          <ul className="space-y-4 mb-10 flex-1 text-zinc-300">
            <li className="flex items-center gap-3 text-white font-medium">✓ Save $20 annually</li>
            <li className="flex items-center gap-3">✓ Everything in Monthly</li>
            <li className="flex items-center gap-3">✓ Priority charity spotlight voting</li>
            <li className="flex items-center gap-3">✓ Premium support</li>
          </ul>
          
          {/* BEAUTIFUL BLUE BUTTON */}
          <form action={createCheckoutSession.bind(null, yearlyPriceId)} className="w-full">
            <button className="w-full bg-zinc-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus:ring-4 focus:ring-blue-300 focus:outline-none">
              Subscribe Yearly
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}