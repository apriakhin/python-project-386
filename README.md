### Hexlet tests and linter status:

[![Actions Status](https://github.com/apriakhin/python-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/apriakhin/python-project-386/actions)
[![CI Status](https://github.com/apriakhin/python-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/apriakhin/python-project-386/actions/workflows/ci.yml)

# Call Calendar

Call Calendar is a service for selecting available time slots and scheduling
events. The backend is built with Django, while the interface uses React,
TypeScript, Vite, and Mantine.

## Install

Python 3.14, Node.js 24, [uv](https://docs.astral.sh/uv/), and npm are
required. The Python and Node.js versions are pinned in their respective
project files.

Clone the repository and install the dependencies:

```sh
git clone https://github.com/apriakhin/python-project-386.git
cd python-project-386
make install
cp backend/.env.example backend/.env
```

Apply the database migrations:

```sh
make migrate
```

A data migration creates an editable daily availability schedule from
09:00 to 18:00 Moscow time if the calendar has no schedule yet. Slots are
calculated from that schedule; the public booking window is today plus 13 days.
You can change or remove the intervals in Django admin.

Start the backend and frontend together:

```sh
make dev
```

To run them separately, use `make dev-backend` and `make dev-frontend` in
different terminal sessions.

## Usage

Open [http://localhost:5173](http://localhost:5173) in a browser. The API
health endpoint is available at
[http://localhost:8000/api/health/](http://localhost:8000/api/health/).

## Checks

Run the tests, linters, and production build:

```sh
make test
make lint
make build
```

The `make check` command runs the complete local CI suite. GitHub Actions runs
the same checks on every push and pull request.

## Environment

Backend settings are loaded from `backend/.env`. SQLite is used by default for
local development. Set `DATABASE_URL` to switch to PostgreSQL:

```dotenv
SECRET_KEY=replace-with-a-random-secret
DEBUG=False
DATABASE_URL=postgresql://user:password@host:5432/database
ALLOWED_HOSTS=api.example.com
```

Cloud platforms should provide these values as environment variables instead
of committing a `.env` file. Start the production server with:

```sh
PORT=8000 make start-backend
```

The server binds to `0.0.0.0` and uses the platform-provided `PORT` value.

## Docker

The multi-stage `Dockerfile` builds the frontend with Node.js and packages the
Django backend with Gunicorn. At startup the container applies migrations,
collects static files, and serves the API and the compiled frontend (including
the `/book` and `/events` routes) from a single origin on `PORT`:

```sh
docker build -t call-calendar .
docker run --rm -p 8000:8000 \
  -e PORT=8000 \
  -e SECRET_KEY=replace-with-a-random-secret \
  -e DEBUG=False \
  -e DATABASE_URL=postgresql://user:password@host:5432/database \
  call-calendar
```

Open [http://localhost:8000](http://localhost:8000) to reach the app. Cloud
platforms set `PORT` and `DATABASE_URL` for you; `RENDER_EXTERNAL_HOSTNAME` is
picked up automatically when running on Render.

## Releases

Release Please maintains a release PR based on
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). GitHub
Actions must be allowed to create pull requests for this workflow to work.
