# Client-side routing with react-router

The landing page must lead to the booking page, and the app already needs a
second destination for upcoming calls, so the frontend needs client-side
routing. We chose `react-router` with `BrowserRouter` because it is the
de-facto standard for Vite + React apps, keeps URLs shareable, and avoids
hand-rolled history handling. Alternatives considered: conditional rendering
with local state (no shareable URLs, breaks on refresh) and TanStack Router
(more ceremony than this app needs).
