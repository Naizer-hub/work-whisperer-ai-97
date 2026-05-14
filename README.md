Aria — How it was built

Stack
- Framework: TanStack Start (React 19 + Vite 7), SSR on Cloudflare Workers
- Styling: Tailwind v4 with semantic OKLCH tokens in `src/styles.css` ("Cloud White" theme), Inter + Instrument Serif fonts
- UI: shadcn/ui components, lucide-react icons, sonner toasts, react-markdown

Backend (Lovable Cloud / Supabase)
- One `messages` table (`user_id`, `role`, `content`, `mode`) with Row-Level Security so users only see their own history
- Email/password auth via Supabase, session managed in the browser client

AI layer
- Lovable AI Gateway via Vercel AI SDK (`@ai-sdk/openai-compatible`)
- Model: `google/gemini-3-flash-preview`
- `LOVABLE_API_KEY` stays server-side, never exposed to the browser

Server functions (`createServerFn`, auth-protected)
- `sendMessage` — saves the user message, loads last 40 messages for context, calls Gemini with a mode-specific system prompt + ethics note, saves the reply
- `clearHistory` — wipes the user's messages
- Handles 429 (rate limit) and 402 (credits) gateway errors with friendly messages

Five assistant modes (each with its own tuned system prompt)
1. Chat — general workplace Q&A
2. Email — drafts with subject/greeting/body/sign-off
3. Meeting — TL;DR + decisions + action items + open questions
4. Tasks — prioritized plan with owners, effort, dependencies
5. Research — structured overview with explicit uncertainty flagging

Frontend routes
- `/` — landing page with hero + feature grid
- `/auth` — sign in / sign up
- `/app` — single-conversation workspace: sidebar mode switcher, markdown chat bubbles, optimistic UI, suggested prompts, clear-history, sign-out, mobile mode dropdown

Responsible AI
- Ethics directive injected into every prompt (no fabrication, flag uncertainty, avoid sensitive data, remind user to verify)
- Footer reminder in the chat header
<img width="1350" height="602" alt="Aria" src="https://github.com/user-attachments/assets/90e6e7bb-73f8-48eb-bf4e-88f12788cb37" />
"C:\Users\CAPACITI-JHB\OneDrive\Pictures\Screenshots\Aria.png"
