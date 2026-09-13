# Repository Guide

## Structure

- `backend/`: Django 6.1 project; `config` contains project settings and root URLs, while apps such as `core` contain domain behavior and tests.
- `frontend/`: React 19 and TypeScript application built with Vite 8 and Mantine 9.
- Python dependencies and tool settings are in `backend/pyproject.toml` and `backend/uv.lock`; frontend dependencies are in `frontend/package.json` and `frontend/package-lock.json`.

## Commands

- Install dependencies: `make install`
- Run Django and Vite together: `make dev`
- Run Django: `make dev-backend`
- Run Vite: `make dev-frontend`
- Apply migrations: `make migrate`
- Run the production backend: `make start-backend`
- Run tests: `make test`
- Run linters and formatting checks: `make lint`
- Type-check and build the frontend: `make build`
- Run the complete local CI suite: `make check`

## Conventions

- Python 3.14 and Node.js 24 are pinned in `backend/.python-version` and `frontend/.node-version`.
- Keep project configuration in `backend/config/` and domain behavior in Django apps under `backend/`; mount APIs below `/api/`.
- Add pytest tests near the relevant Django app and create migrations for model changes.
- Prefer Mantine components and responsive props before adding custom frontend equivalents.
- Update `backend/uv.lock` or `frontend/package-lock.json` whenever dependencies change.
- Backend configuration comes from `backend/.env` locally and environment variables in production; never commit `.env` or secrets.
- Production requires `SECRET_KEY`, `DEBUG=False`, `DATABASE_URL`, and `ALLOWED_HOSTS`.
- Never commit local artifacts such as `.venv/`, `frontend/node_modules/`, `frontend/dist/`, caches, or `backend/db.sqlite3`.
- Do not delete or modify `.github/workflows/hexlet-check.yml`.
- Use Conventional Commits: `<type>[optional scope]: <description>`. Use `feat:` for features, `fix:` for fixes, and `!` or a `BREAKING CHANGE:` footer for breaking changes.

## Agent skills

### Issue tracker

Issues and specs live in this repo's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
