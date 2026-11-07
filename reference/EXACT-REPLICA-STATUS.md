# ManhwaHQ reference rebuild status

## Source of truth
The supplied captured pages are retained under `public/reference/` (homepage, browse, profile, manga detail, and chapter reader HTML) with the captured original Tailwind stylesheet. These are visual references, not production routes.

## Runtime assets
Large offline copies of chapter reader images were removed from `public/reference/images/`; they are not required by the frontend because manga covers and chapter pages must be loaded from the ManhwaHQ API/source URLs.

## Important status
This package is a cleaned, smaller frontend source package. It is not certified pixel-perfect: each React page still requires browser screenshot comparison against its corresponding captured reference at matching viewport sizes. Do not describe the frontend as an exact replica until that comparison is completed.

## Agreed behavior
- Homepage history strip above Trending.
- One current history row per user+manga, most recently read first.
- Resume the last-read chapter.
- Bookmarks under `/profile?tab=bookmark`.
- Profile tabs: summary, bookmark, notifications, comments, settings.
- Notifications and comments remain reserved for later implementation.
- Login and registration retain their current design.
- Search results reuse the browse layout.
- Chapter reader uses vertical scrolling.
