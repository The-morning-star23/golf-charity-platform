import { signup } from '@/app/login/actions'
import Link from 'next/link'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Join the Club.
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Track scores, support charities, and win.
        </p>

        <form className="flex flex-col gap-4">
          <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1" htmlFor="full_name">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                required
                className="w-full rounded-lg px-4 py-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
            <input
              className="w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              name="email" type="email" placeholder="you@example.com" required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
            <input
              className="w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              type="password" name="password" placeholder="••••••••" required
            />
          </div>

          <button
            formAction={signup}
            className="w-full bg-black text-white rounded-md px-4 py-3 mt-4 font-medium hover:bg-gray-800 transition-colors"
          >
            Create Account
          </button>

          {resolvedSearchParams?.message && (
            <p className="mt-4 p-3 bg-red-50 text-red-600 text-sm text-center rounded-md border border-red-100">
              {resolvedSearchParams.message}
            </p>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-black hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}