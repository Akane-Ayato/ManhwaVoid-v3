# ManhwaHQ reference implementation notes

This revision uses the supplied ManhwaHQ capture as the visual source of truth.

- `src/styles/original-manhwahq.css` is the captured production stylesheet from the supplied reference archive.
- `public/reference/images/` contains the supplied reference image assets (covers, avatars, reader samples, and site imagery).
- `public/logo.png` uses the supplied ManhwaHQ logo.
- The React application remains responsible for routing, API requests, authentication, and user interactions. The captured Next.js runtime scripts are intentionally not executed; the frontend uses the existing ManhwaHQ API instead.

## API request policy

- Homepage: one cached `GET /home` request.
- Reading history: only for an authenticated user, and only on the homepage/history page.
- Browse/search: `GET /browse` with the active filters and pagination.
- Details: `GET /manga/{slug}`; recommendations and chapters are loaded only when their sections/pages need them.
- Reader: chapter endpoint only, with vertical image loading.
- Account pages: profile/bookmarks/history endpoints only when those pages are opened.

The reference archive contains captured HTML and the original CSS, but not a complete source repository for the original website. React page behavior is therefore implemented against the supplied API rather than reusing the original site's private Next.js runtime.
