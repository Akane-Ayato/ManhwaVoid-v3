# ManhwaVoid integrated control center

- Private entry route: `/quanxi` (not `/admin`).
- The route is integrated into the existing React Router app and is lazy-loaded.
- It reuses the existing AuthContext, JWT token refresh and same-origin `/api/v1` proxy.
- No admin link is added to public navigation.
- The control center currently includes: overview, upstream catalogue search/editorial overrides, chapter visibility, homepage layout, user status/role management, system health, scraper diagnostics, worker cache controls, site settings, and audit history.
- A normal user cannot gain access by visiting `/quanxi`; the backend authorizes every operation independently.
- Admin API requests use a private, schema-excluded router. They are not included in the custom public developer portal.

The API paths are not a credential. A browser app cannot guarantee that request paths remain secret after delivery. Access control is enforced by the backend.
