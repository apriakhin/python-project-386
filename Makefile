.PHONY: install dev dev-backend dev-frontend migrate start-backend test test-backend test-frontend lint build check generate-api

install:
	uv sync --directory backend --locked
	npm ci --prefix frontend

# Source: frontend/tsp/main.tsp. Outputs: OpenAPI, frontend SDK, Django models/routes.
generate-api:
	npm --prefix frontend run generate:openapi
	npm --prefix frontend run generate:sdk
	uv run --directory backend datamodel-codegen --input ../api/generated/@typespec/openapi3/openapi.yaml --input-file-type openapi --output core/generated/models.py --output-model-type pydantic_v2.BaseModel --use-standard-collections --use-union-operator --disable-timestamp --use-double-quotes --formatters builtin --strict-nullable --extra-fields forbid
	uv run --directory backend python scripts/generate_api.py
	uv run --directory backend ruff format core/generated/models.py core/generated/views.py

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
