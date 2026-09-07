# Project Guide

## Structure

- `backend/` is an independent Django and uv project; `GET /api/health/` is the smoke endpoint.
- `frontend/` is an independent React and Vite project.

## Commands

- Install: `make install`
- Start both apps: `make start`
- Lint both apps: `make lint`
- Format both apps: `make format`
- Test both apps: `make test`
- Check: `make check`

## Commits

Use Conventional Commits: `<type>(<scope>): <description>`. Use `feat:` for features, `fix:` for fixes, and `!` or a `BREAKING CHANGE:` footer for breaking changes.
