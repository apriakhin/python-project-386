.PHONY: install dev dev-backend dev-frontend migrate start-backend test test-backend test-frontend lint build check

install:
	uv sync --directory backend --locked
	npm ci --prefix frontend

dev:
	$(MAKE) --no-print-directory -j2 dev-backend dev-frontend

dev-backend:
	uv run --directory backend python manage.py runserver

dev-frontend:
	npm --prefix frontend run dev

migrate:
	uv run --directory backend python manage.py migrate

start-backend:
	uv run --directory backend gunicorn config.wsgi --bind 0.0.0.0:$${PORT:-8000}

test: test-backend test-frontend

test-backend:
	uv run --directory backend pytest

test-frontend:
	npm --prefix frontend run test

lint:
	uv run --directory backend ruff check .
	uv run --directory backend ruff format --check .
	npm --prefix frontend run lint

build:
	npm --prefix frontend run build

check: lint test build
	uv run --directory backend python manage.py check
