# ⛳️ Digital Heroes Golf

## Every Birdie Changes a Life.

Digital Heroes Golf is a high-performance, emotion-driven platform that turns the game of golf into a global engine for charitable impact. By blending a modern "SaaS-style" interface with a secure, scalable sweepstakes engine, we've created an ecosystem where players fund world-changing charities and win life-changing prize pools.

---

## 🚀 Tech Stack

- Framework: Next.js 15 (App Router, Server Actions, Asynchronous APIs)
- Styling: Tailwind CSS (Modern Dark Mode, Zinc-950 Palette)
- Database & Auth: Supabase (PostgreSQL, Row Level Security, JWT)
- Animations: Framer Motion (Scroll-triggered reveals)
- Emails: Resend (Transactional "Digital Hero" winner alerts)
- Icons: Lucide React
- Architecture: Headless & Scalable (Ready for Global/Mobile expansion)

---

## 🏗 System Architecture

The platform is built on a Decoupled Prize Engine model. Business logic is separated from the UI to ensure that the Web app, future Mobile apps, and Administrative tools always calculate prize pools and rollovers with 100% consistency.

---

## 🛠 Installation & Setup

### 1. Clone & Install

```bash
git clone https://github.com/The-morning-star23/golf-charity-platform.git
cd golf-charity-platform
npm install
```

### 2. Environment Variables

Create a `.env.local` file and populate it with your keys:

```bash
# Supabase (Client & Admin)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Resend)
RESEND_API_KEY=re_your_api_key

# Deployment
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema

Execute the SQL found in our architecture phases in your Supabase SQL Editor. This includes:

- `profiles` (with `is_admin`, `country_code`, `organization_id`)
- `scores` (linked to users)
- `draws` (history & rollover tracking)
- `draw_winners` (verification & status)
- `charities` (featured & partner data)

---

## 🧪 Testing Suite: A-Z Verification

Follow these steps to verify that all 14 Phases are operational.

### A. Authentication & Onboarding

- Sign Up: Create a new account. Verify the user appears in the Supabase Auth dashboard.
- Profile Sync: Verify a record is created in the `profiles` table automatically via the `handle_new_user` trigger.
- Role Escalation: Manually set `is_admin = true` in the DB for your test account to access the Command Center.

### B. User Experience

- Charity Selection: Navigate to `/charities` and select a partner. Verify the choice saves to your profile.
- Score Entry: Post 5 scores (between 1-45). Verify they appear in your personal "Recent Activity" and the database `scores` table.

### C. The Admin Draw Engine (The "Heart")

- Simulation Mode: Go to `/admin`. Click "Simulate Draw".
- Verify the system calculates the 40/35/25 split correctly.
- Verify it accurately identifies "Match 3", "Match 4", and "Match 5" winners from the active subscriber pool.
- Commit & Publish: Click "Commit & Publish Draw".
- Verify a new record appears in the `draws` table.
- Verify winners are logged in `draw_winners` with a pending status.
- Email Check: Verify your Resend dashboard shows "Sent" for winner notifications.

### D. Payout Verification Flow

- User Side: Log in as a winner. Upload a scorecard image (proof of play).
- Admin Side: Go to the "Winner Review Station". Verify the image is visible.
- Approval: Click "Approve" then "Mark Paid". Verify the database status updates in real-time.

### E. Scalability & API Testing

- Mobile API: Navigate to `/api/v1/prize-pool`.
- Verify it returns a clean JSON object with the current live pool and active user count.
- Responsive Audit: Use Chrome DevTools (F12) to toggle "Mobile" view. Verify that tables are scrollable and the Hero text scales without clipping.

---

## 📈 Scalability Considerations (Phase 14)

- Multi-Tenancy: The database is schema-ready for corporate accounts (`organization_id`).
- Global Readiness: All prize logic is calculated via `src/lib/prize-engine.ts`, allowing for easy currency and region filtering.
- Mobile App: The backend is "Headless," meaning a React Native or Flutter app can consume the Supabase API directly without modifying the core web infrastructure.

---

## 🛡 Security

- Row Level Security (RLS): Users can only read/write their own scores.
- Admin Gatekeeper: Every Admin Server Action is protected by a `requireAdmin()` check that verifies JWT claims against the server-side session.
- Service Role: Critical draw operations use the Supabase Service Role to bypass RLS safely on the server.

---

## 📜 License

© 2026 Digital Heroes Golf. Built for impact. All Rights Reserved.