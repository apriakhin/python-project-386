### Hexlet tests and CI status:

[![Actions Status](https://github.com/apriakhin/python-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/apriakhin/python-project-386/actions)
[![CI Status](https://github.com/apriakhin/python-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/apriakhin/python-project-386/actions/workflows/ci.yml)

# Call Calendar

Call Calendar is a web application for booking calls. It consists of a Django
backend and a React frontend.

## Install

Python 3.12, [uv](https://docs.astral.sh/uv/), Node.js, and npm are required.

Copy and run the commands below in the terminal:

```sh
git clone https://github.com/apriakhin/python-project-386.git
cd python-project-386
make install
```

## Usage

Start the backend and frontend development servers:

```sh
make start
```

Open [http://localhost:5173](http://localhost:5173) in a browser. The backend
smoke endpoint is available at
[http://localhost:8000/api/health/](http://localhost:8000/api/health/).

## Development

Run linters, format code, run tests, or run all required checks:

```sh
make lint
make format
make test
make check
```
