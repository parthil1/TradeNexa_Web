# TradeNexa

India’s B2B marketplace frontend — connect buyers with verified sellers, browse catalogs, post RFQs, send product inquiries, and chat in real time.

**Live:** [mart-self.vercel.app](https://mart-self.vercel.app)

## Features

- **Public site** — landing, categories, products, benefits, FAQ, contact
- **Buyer portal** — search, categories, suppliers, RFQs, inquiries, wishlist, chats
- **Seller portal** — dashboard, catalog, products, leads, quotations, inquiries, chats
- **Auth** — phone OTP via backend API, role-based registration (buyer / seller / both)
- **Profile gate** — products, catalog, RFQ, inquiry, and chat routes require a completed business profile (`is_completed_profile`)
- **Push notifications** — Firebase Cloud Messaging (FCM) for web push

## Tech stack

| Layer | Stack |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion, Lucide |
| State | Redux Toolkit, React Context |
| API | Axios → Railway backend (`/api/v1`) |
| Realtime | Socket.IO (chat) |
| Push | Firebase Cloud Messaging |

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cp .env.example .env.local
# Fill Firebase + API values in .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Environment variables

Copy `.env.example` → `.env.local` (local) or set the same keys in **Vercel → Settings → Environment Variables**.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BACKEND_ORIGIN` | Backend origin (media, CORS-related hosts) |
| `NEXT_PUBLIC_API_BASE_URL` | REST API base (`…/api/v1`) |
| `API_PROXY_TARGET` | Optional legacy proxy target |
| `NEXT_PUBLIC_FIREBASE_*` | FCM web app config + VAPID key (login `fcm_token`) |

Never commit real secrets. `.env.local` stays local; production values live in Vercel.

## Project structure

```
app/                 # App Router — public, /buyer/*, /seller/*, API routes
components/          # UI — portal, catalog, RFQ, chat, auth, common
context/             # Auth, Chat, Notifications, Wishlist, Geo, ActiveRole
services/            # API clients (catalog, profile, RFQ, chat, FCM, …)
store/               # Redux (UI, filters, reference data)
config/              # Endpoints and app config
types/               # Shared TypeScript types
utils/               # Helpers (auth, profile gate, form data, …)
public/              # Static assets + FCM service worker
```

## Auth & profile flow

1. Send / verify phone OTP against the backend
2. Register with name, email, role, and business type (if new)
3. Complete business profile (company, address, GST/PAN, category, …)
4. Until `is_completed_profile` is true, gated routes (products, catalog, RFQs, inquiries, chats) open the **Complete Profile** modal instead of the page

## Deploy (Vercel)

```bash
npx vercel --prod --yes
```

Or connect the GitHub repo in the Vercel dashboard and push to `main`. Ensure all `NEXT_PUBLIC_*` / Firebase env vars are set for Production.

**Production alias:** https://mart-self.vercel.app  
**Backend:** Railway (`NEXT_PUBLIC_API_BASE_URL` in `.env.example`)

## License

Private — all rights reserved.
