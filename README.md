# Doable

**Turn overwhelming tasks into doable steps.**

Doable is an AI-powered productivity coach that helps you break down daunting tasks, stay accountable, and actually get things done. Whether you're procrastinating, burned out, or just don't know where to start — Doable meets you where you are.

**Live app:** [doable-ten.vercel.app](https://doable-ten.vercel.app)

## Features

### AI Coach
- Conversational AI coach powered by Claude that understands *why* you're stuck (too big? scared? no idea where to start?)
- Breaks tasks into small, actionable steps tailored to your specific blocker
- Provides motivational reflections and celebrates your wins
- Photo proof verification — snap a pic to prove you did the work

### Smart Reminders
- Preset quick buttons (30 min, 1 hour, 2 hours, tomorrow 9am) or custom time picker
- Server-side Web Push notifications that work even when the app is closed
- Active reminder dashboard with easy cancellation

### Compete with Friends
- Unique friend codes to connect with others
- Live leaderboard with points, streaks, and rankings
- Earn points by completing steps and staying consistent

### Analytics & Calendar
- Weekly streak tracking and productivity trends
- Visual calendar view of completed tasks
- Charts powered by Recharts

### Progressive Web App
- Installable on mobile and desktop
- Works offline with service worker caching
- Native push notifications via Web Push API

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend:** Next.js App Router API routes
- **AI:** Anthropic Claude API (via `@anthropic-ai/sdk`)
- **Database:** MongoDB Atlas
- **Auth:** NextAuth.js (Google OAuth + email/password with bcrypt)
- **Notifications:** Web Push API with VAPID authentication
- **Charts:** Recharts
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster
- Anthropic API key
- Google OAuth credentials (for Google sign-in)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/Elitriare/doable.git
   cd doable
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

4. Generate VAPID keys for push notifications:
   ```bash
   npx web-push generate-vapid-keys
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See [`.env.example`](.env.example) for the full list of required environment variables.

## License

MIT
