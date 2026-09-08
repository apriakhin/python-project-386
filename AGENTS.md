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

## Agent skills

### Issue tracker

Issues are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The default canonical triage labels are used. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See `docs/agents/domain.md`.
