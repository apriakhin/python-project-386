# Vitest and Testing Library for frontend tests

The landing page needs tests, and they must run in GitHub Actions. We chose
Vitest with Testing Library and jsdom because Vitest reuses the Vite config
and transform pipeline, so there is no second build setup to maintain, and
Testing Library asserts on user-visible behaviour instead of implementation
details. The suite runs through `npm run test` in both `make test` and CI.
Alternatives considered: Jest (extra config, no Vite reuse) and Playwright
(browser-level confidence, but slower and heavier than this static page
warrants).
