.PHONY: install start lint format test check

install:
	uv --directory backend sync --all-groups
	npm --prefix frontend ci

start:
	uv --directory backend run python manage.py runserver localhost:8000 & npm --prefix frontend run dev -- --host localhost & wait

test:
	uv --directory backend run pytest
	npm --prefix frontend run test

lint:
	uv --directory backend run ruff check .
	uv --directory backend run ruff format --check .
	npm --prefix frontend run lint
	npm --prefix frontend run format:check

format:
	uv --directory backend run ruff format .
	npm --prefix frontend run format

check: lint test
