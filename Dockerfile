# syntax=docker/dockerfile:1

FROM node:24-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM python:3.14-slim AS runtime

COPY --from=ghcr.io/astral-sh/uv:0.12.4 /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    FRONTEND_DIST=/app/frontend_dist

RUN groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --create-home app

WORKDIR /app/backend

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY backend/ ./
RUN uv sync --locked --no-dev

COPY --from=frontend-build /app/frontend/dist /app/frontend_dist

RUN chmod +x docker-entrypoint.sh \
    && chown -R app:app /app

USER app

EXPOSE 8000

CMD ["./docker-entrypoint.sh"]
