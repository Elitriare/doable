## Inspiration

95% of college students regularly procrastinate (American Psychological Association, 2021). We've all been there — staring at a massive assignment, feeling so overwhelmed that we don't even know where to start. The result? We put it off, pull an all-nighter the day before, and burn out. Existing to-do list apps and AI assistants can break tasks down, but they just hand you another overwhelming list. We wanted something different: a coach that walks you through one step at a time, understands *why* you're stuck, and actually holds you accountable with proof verification.

## What it does

Doable is an AI-powered productivity coach that turns overwhelming tasks into bite-sized, doable steps — and makes sure you actually do them.

- **Tell it why you're stuck.** Before breaking down your task, Doable asks why you're procrastinating — is it too big? Too boring? Scary? No idea where to start? The AI tailors its approach based on your specific blocker.
- **One step at a time.** Instead of dumping a long to-do list on you, Doable guides you through one micro-task at a time with a progress bar, acting as a real coach rather than a task manager.
- **Proof verification.** Before you can move to the next step, you upload a photo proving you completed it. Our AI uses image recognition to verify it's legitimate — no cheating allowed.
- **Smart reminders.** Schedule reminders with quick presets or a custom time picker. Notifications are delivered via Web Push, so they work even when the app is closed.
- **Compete with friends.** Connect with friends using unique codes, earn points for completing steps, and climb the leaderboard. A little healthy competition goes a long way.
- **Analytics & streaks.** Track your productivity trends, maintain daily streaks, and visualise your progress over time.
- **Google Calendar integration.** Don't want to manually input tasks? Pull them directly from your Google Calendar.
- **Spotify integration.** Prefer to work with music? Play your playlist right inside the app.
- **Reward system.** Complete a task and get celebrated with confetti, points, and a flip-through diary of all your proof photos showing how far you've come.

## How we built it

- **Frontend:** Next.js 16 with React 19, TypeScript, and Tailwind CSS 4 for a clean, responsive mobile-first UI. Framer Motion handles animations, and Recharts powers the analytics visualisations.
- **AI Engine:** Anthropic's Claude API powers the intelligent task breakdown, adapting its coaching style based on the user's specific procrastination blocker. It also handles proof-of-completion image verification.
- **Backend:** Next.js App Router API routes with MongoDB Atlas for persistent storage of tasks, user profiles, reminders, friend connections, and leaderboard data.
- **Authentication:** NextAuth.js supporting both Google OAuth and email/password sign-up with bcrypt password hashing.
- **Notifications:** Full Web Push implementation with VAPID authentication, server-side reminder scheduling, and a service worker for background push delivery.
- **PWA:** Installable as a progressive web app on mobile and desktop with offline service worker caching.

## Challenges we ran into

- **Data isolation between accounts.** Early on, we discovered that when a second user logged in on the same browser, they could see the previous user's tasks because localStorage is browser-scoped, not user-scoped. We solved this by making the database the single source of truth and adding a user-scope check that clears local data on account switch.
- **Build-time crashes with Web Push.** The `web-push` library's VAPID configuration was running at module load time during Next.js static analysis, crashing the build when environment variables weren't available. We had to refactor to lazy initialization inside request handlers.
- **Balancing coach vs. task list.** We went through several iterations of the UX — our first version just showed a list of broken-down tasks, which felt no different from ChatGPT. We pivoted to a step-by-step guided flow with a progress bar that reveals one task at a time, which felt much more like having an actual coach.
- **Proof verification accuracy.** Getting the AI to reliably distinguish between legitimate proof photos and random images required careful prompt engineering and iterating on the verification criteria.

## Accomplishments that we're proud of

- The app genuinely feels different from existing productivity tools — the combination of personalised blocker-based coaching, one-step-at-a-time guidance, and proof verification creates accountability that a regular to-do list can't match.
- A polished, mobile-first UI with smooth animations and a cohesive design system that looks and feels like a real product, not a hackathon prototype.
- Full-stack Web Push notifications that work even when the app is closed — a real technical achievement for a hackathon timeframe.
- The competitive leaderboard and friend system adds a social layer that keeps users coming back.
- Our hand-drawn rabbit mascot that reacts to different situations (burned out, scared, distracted, locked in) gives the app personality and makes the coaching feel warm rather than robotic.

## What we learned

- How Web Push notifications actually work end-to-end — VAPID keys, service workers, push subscriptions, and the entire lifecycle of a background notification.
- The importance of making the database the single source of truth in a multi-device/multi-account world, rather than relying on client-side storage.
- That UX matters more than features — showing one step at a time instead of a full list was a small change that completely transformed how the app feels to use.
- How to build secure API routes from the ground up — input validation, auth checks, mass assignment prevention, and error message sanitisation.

## What's next for Doable

- **Vercel Cron integration** for reminders that fire reliably even when no users have the app open, ensuring no reminder is ever missed.
- **Group accountability** — create study groups where members can see each other's progress in real time and cheer each other on.
- **Habit tracking** — extend beyond one-off tasks to recurring habits, helping users build long-term productive routines.
- **App blocking integration** — partner with focus apps to automatically block distracting apps while a user is working through their steps.
- **Richer analytics** — deeper insights into procrastination patterns, peak productivity hours, and personalised tips based on historical data.
- **Offline mode** — full offline support with background sync, so users can complete steps and upload proofs even without internet, with everything syncing when they reconnect.
