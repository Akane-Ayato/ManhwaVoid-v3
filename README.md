<div align="center">

<img src="https://i.pinimg.com/736x/95/f1/6e/95f16e8abb78d5066f797196a976fb2b.jpg" alt="Manhwa Void — main artwork" width="100%" />

<br />

<img src="./public/logo-mark.png" alt="Manhwa Void logo" width="104" />

# MANHWA VOID

### DISCOVER · READ · CONTINUE

**A modern manga, manhwa, manhua and webtoon reading experience.**

<br />

[![React](https://img.shields.io/badge/React-18.3-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![React Router](https://img.shields.io/badge/React_Router-6.28-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Axios](https://img.shields.io/badge/Axios-1.7-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/explore/progressive-web-apps)

<br />

[Explore the features](#-experience) · [Run locally](#-getting-started) · [Deployment](#-deployment) · [Credits](#-project-credits)

</div>

---

## ◈ About the project

**Manhwa Void** is a responsive, reader-focused frontend for discovering and reading manga, manhwa, manhua and webtoons. It brings catalogue discovery, title details, chapter reading and personal reading tools together in one interface.

The frontend is built with **React, TypeScript and Vite**. It communicates with the ManhwaHQ API through a small API client layer, with authentication-aware requests, token refresh handling and a same-origin production proxy.

The visual direction combines a dark-first interface, a distinctive book-and-roses emblem, a Cinzel Decorative wordmark, clean typography and focused reading layouts. A light theme is also available.

## ✦ Experience

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>⌂ Discover</h3>
      <ul>
        <li>Homepage catalogue sections.</li>
        <li>Browse manga, manhwa, manhua and webtoons.</li>
        <li>Explore by genre and sort by latest, popularity, rating or title.</li>
        <li>Search with live suggestions.</li>
        <li>Random-title discovery.</li>
        <li>Pagination for catalogue browsing.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>▤ Title details</h3>
      <ul>
        <li>Cover artwork and title backdrop.</li>
        <li>Primary, native and alternative titles.</li>
        <li>Synopsis and catalogue metadata.</li>
        <li>Chapter list and reading entry points.</li>
        <li>Continue-reading shortcut when local progress exists.</li>
        <li>Bookmark and share actions.</li>
        <li>Related-title recommendations when supplied by the API.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>▣ Reader</h3>
      <ul>
        <li>Dedicated, distraction-reduced chapter reader.</li>
        <li>Previous and next chapter navigation.</li>
        <li>Reading progress indicator.</li>
        <li>Local chapter-read state and resume position.</li>
        <li>Back-to-top control for long chapters.</li>
        <li>Chapter list panel and reader controls.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>◎ Personal library</h3>
      <ul>
        <li>Account registration and sign-in.</li>
        <li>Bookmarks and reading history.</li>
        <li>Profile summary and public profiles.</li>
        <li>Recent activity and notification settings.</li>
        <li>Account settings and data export.</li>
        <li>Reading progress stored locally, with supported history synced through the API.</li>
      </ul>
    </td>
  </tr>
</table>

## ◈ Interface & design

- **Dark-first styling:** a deep charcoal foundation with violet accents and a matching light theme.
- **Responsive layout:** desktop navigation, compact mobile menu and layouts designed for smaller screens.
- **Purpose-built components:** reusable manga cards, covers, avatars, pagination, search, loading states, empty states and error states.
- **Reader-focused presentation:** chapter content gets its own layout rather than the full catalogue navigation.
- **Consistent iconography:** Lucide React icons.
- **Typography:** Inter for interface text and a locally bundled Cinzel Decorative display font for the brand wordmark.
- **Motion and feedback:** transitions, loading indicators and toast messages where appropriate.

## ◈ App routes

| Route | Purpose |
|---|---|
| `/` | Homepage and discovery sections |
| `/browse` | Catalogue, search, genre, type and sorting filters |
| `/title/:slug` | Manga/manhwa/manhua/webtoon details |
| `/title/:slug/chapter/:chapter` | Chapter reader |
| `/login` | Sign in |
| `/register` | Create an account |
| `/profile` | Signed-in personal profile |
| `/user/:username` | Public user profile |

The profile supports these tabs:

`summary` · `bookmark` · `history` · `notifications` · `export` · `settings`

Legacy routes are redirected where supported: `/read/:slug/:chapter`, `/search`, `/history` and `/library`.

## ⌨ Keyboard shortcuts

Shortcuts available in the chapter reader:

| Key | Action |
|---|---|
| `←` Left Arrow | Open the previous chapter, when available |
| `→` Right Arrow | Open the next chapter, when available |
| `Esc` Escape | Close the chapter list panel |

Arrow-key chapter navigation is ignored while typing in form fields or using modifier-key combinations. Escape also closes dismissible menus and dialogs.

## ◈ Technology

### Core stack

| Technology | Role |
|---|---|
| [React 18](https://react.dev/) | Component-based UI |
| [TypeScript](https://www.typescriptlang.org/) | Typed application code |
| [Vite 6](https://vite.dev/) | Development server and production bundler |
| [React Router 6](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | HTTP client and API requests |
| [Lucide React](https://lucide.dev/) | Interface icons |
| CSS | Responsive layout, themes and component styling |

### Supporting capabilities

- **PWA:** web app manifest, install experience, app icons and production service worker.
- **Offline fallback:** a dedicated offline page; API requests are not cached by the service worker.
- **Authentication:** shared access-token refresh flow and protected profile routes.
- **Caching:** small client-side TTL cache for selected API data.
- **Code splitting:** reader, profile and authentication pages are lazy-loaded.
- **Production proxy:** Vercel Edge Function forwards `/api/v1/*` requests to the backend without bundling the backend address into the browser JavaScript.
- **Build safety check:** post-build script checks the generated bundle for backend configuration leaks.

## ◈ Project structure

```text
ManhwaVoid-v3-main/
├── api/
│   └── proxy.ts              # Vercel API reverse proxy
├── public/
│   ├── logo-mark.png         # Brand emblem
│   ├── art/                  # Public artwork
│   ├── avatars/              # Default avatar artwork
│   ├── fonts/                # Local display font
│   ├── icons/                # PWA and platform icons
│   ├── manifest.webmanifest
│   ├── offline.html
│   └── sw.js                 # Production service worker
├── src/
│   ├── components/           # Shared UI components
│   ├── context/              # Auth, bookmarks, theme and toast state
│   ├── hooks/                # Reusable React hooks
│   ├── lib/                  # API client, HTTP, cache and utilities
│   ├── pages/                # Home, browse, title, reader and auth
│   │   └── profile/          # Personal profile tabs
│   ├── styles/               # Base, layout, page and reader styles
│   ├── types/                # API and application types
│   ├── App.tsx
│   ├── config.ts
│   └── main.tsx
├── scripts/
│   └── check-leak.mjs        # Production bundle leak check
├── index.html
├── package.json
├── package-lock.json
├── vercel.json
└── vite.config.ts
```

## ◈ Getting started

### Requirements

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-included_with_Node.js-CB3837?style=flat-square&logo=npm&logoColor=white)](https://www.npmjs.com/)

- Node.js 20 or newer (recommended).
- npm.
- A running compatible ManhwaHQ API for live catalogue and account functionality.

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd ManhwaVoid-v3-main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the API target (optional)

By default, the Vite development server proxies `/api` to `http://127.0.0.1:8000`.

If your API runs elsewhere, create `.env.local`:

```env
VITE_DEV_API_TARGET=http://127.0.0.1:8000
```

Optional branding/API settings:

```env
VITE_SITE_NAME=Manhwa Void
VITE_API_BASE_URL=/api/v1
```

Do not put private API credentials, proxy secrets or the real production backend URL in any `VITE_*` variable. Vite exposes `VITE_*` values to client-side code.

### 4. Start the development server

Start the API separately, then run:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run typecheck` | Run TypeScript project checks |
| `npm run build` | Type-check and create the production build |
| `npm run preview` | Preview the production build locally |

The production build is written to `dist/`. The `postbuild` script runs the bundle leak check automatically after a successful build.

## ◈ Deployment

### Vercel (configured deployment)

This repository includes `vercel.json` and `api/proxy.ts` for a Vercel deployment.

1. Push the frontend repository to GitHub.
2. Import the repository into Vercel.
3. Use the Vite framework preset.
4. Add the following server-side environment variables in Vercel:

   | Variable | Value |
   |---|---|
   | `BACKEND_URL` | Backend origin only, e.g. `https://api.example.com` |
   | `BACKEND_PROXY_SECRET` | Optional shared secret, if the API enforces proxy authentication |

5. Deploy the project.
6. Check `/api/v1/_proxy-status` on the deployed site. Confirm that `proxy` is `ok` and `backendConfigured` is `true`.
7. Test `/api/v1/health`.

`BACKEND_URL` must be the backend origin without `/api/v1` at the end. Changing the variable requires a new deployment.

### How API requests are routed

```text
Visitor's browser
       │
       │  /api/v1/...
       ▼
Manhwa Void frontend (Vercel)
       │
       │  api/proxy.ts
       │  BACKEND_URL + optional proxy secret
       ▼
ManhwaHQ FastAPI backend
       │
       ▼
MongoDB Atlas / source services
```

The browser calls the frontend's same-origin `/api/v1` path. The actual backend address is stored in Vercel's server-side `BACKEND_URL` variable and is not embedded in the frontend bundle.

If deploying to another static host, configure an equivalent reverse proxy for `/api/v1/*` or deliberately configure a direct API URL and the API's CORS allowlist. The default production configuration is designed around the same-origin proxy.

### Production notes

- Serve the site over HTTPS to enable PWA installation and service-worker features.
- Keep `BACKEND_URL` and `BACKEND_PROXY_SECRET` server-side; never rename them to `VITE_*`.
- Configure the API's proxy-secret validation to match `BACKEND_PROXY_SECRET` if using the optional shared-secret protection.
- Keep the API's CORS allowlist restricted to the required frontend origins when direct browser access is enabled.
- The service worker is registered only in production and does not cache `/api` requests.
- Set the Open Graph image to an absolute URL in `index.html` when the final production domain is known.

## ◈ Project credits

<div align="center">

<table>
  <tr>
    <td align="center" width="50%">
      <img src="https://i.pinimg.com/736x/8c/60/23/8c6023c1d024dcfac090183ef67a3c38.jpg" width="180" alt="API owner artwork" />
      <h3>Qυαɳxι ヅ ⁶⁶⁶</h3>
      <strong>API & Backend</strong>
      <br />
      <a href="https://t.me/quanxi_core">Telegram · @quanxi_core</a>
    </td>
    <td align="center" width="50%">
      <img src="https://i.pinimg.com/736x/b3/6b/96/b36b961c056a2ea95d44c14dc8c18d3a.jpg" width="180" alt="Frontend owner artwork" />
      <h3>㊝ ˢᵘⁿᵍメJɪɴᴡᴏᴏ !!</h3>
      <strong>Frontend & UI</strong>
      <br />
      <a href="https://t.me/sungjinwoo_ex">Telegram · @sungjinwoo_ex</a>
    </td>
  </tr>
</table>

**Manhwa Void**  
*Designed to make discovering and continuing your next read feel effortless.*

</div>

---

<div align="center">

<img src="./public/logo-mark.png" width="54" alt="Manhwa Void" />

### MANHWA VOID

**READ · DISCOVER · CONTINUE**

<sub>Frontend project · React + TypeScript + Vite</sub>

</div>
