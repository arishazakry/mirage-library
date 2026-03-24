# mirage-library

Python client for the MIRAGE dashboard API.

## Overview

`mirage-library` wraps the live MIRAGE dashboard endpoints for programmatic access from Python. The current production API base is:

```bash
https://dashboard.mirage-project.org/api
```

## Quick Start

### Requirements

- Python 3.10+
- `pip`

### Installation

This repository does not yet include PyPI packaging metadata, so installation is currently source-based.

1. Clone the repository:

```bash
git clone <repo-url>
cd mirage-library
```

2. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install runtime dependencies:

```bash
pip install requests pandas
```

4. Add the library source directory to `PYTHONPATH`:

```bash
export PYTHONPATH="$PWD/mirage-library:$PYTHONPATH"
```

### Configure API Access

The Python client defaults to the live dashboard API. You can override it with `MIRAGE_API_BASE` if needed.

```bash
export MIRAGE_API_BASE="https://dashboard.mirage-project.org/api"
```

### Run a Smoke Test

Use the built-in endpoint test script:

```bash
python3 mirage-library/test.py
```

## Usage

```python
from lib import MIRAGEClient

client = MIRAGEClient()

results = client.search(limit=5)
print(results.head())

locations = client.get_locations()
print(locations.head())
```

You can also point the client to another deployment:

```python
from lib import MIRAGEClient

client = MIRAGEClient(base_url="https://dashboard.mirage-project.org/api")
```

## API Coverage

The client targets these dashboard routes:

- `POST /search`
- `POST /search/suggest`
- `GET /location`
- `GET /location/{id}`
- `GET /location/fields`
- `GET /station/city`
- `GET /station/fields`
- `GET /meta/{id}`
- `POST /meta/viz`
- `POST /meta/viz/map`
- `POST /meta/viz/network`
- `POST /meta/viz/hist`
- `POST /meta/viz/scatter`
- `POST /meta/viz/radar`
- `POST /meta/viz/average`
- `GET /filters/available`
- `GET /range`
- `POST /download`

## Current Status

Live endpoint testing against `https://dashboard.mirage-project.org/api` confirmed that most routes are reachable and returning data.

Known issues from current testing:

- `/meta/viz/hist` returned `No valid metrics provided.`
- `/range` returned `500 Internal Server Error`

## Project Layout

- [`mirage-library/lib.py`](/Users/arishazakry/Documents/MIRAGE/mirage-w26/mirage-library/mirage-library/lib.py)
  Python client implementation
- [`mirage-library/test.py`](/Users/arishazakry/Documents/MIRAGE/mirage-w26/mirage-library/mirage-library/test.py)
  Endpoint smoke-test script
- [`mirage-library/miragelib-test`](/Users/arishazakry/Documents/MIRAGE/mirage-w26/mirage-library/mirage-library/miragelib-test)
  Local development helper for Postgres, Elasticsearch, and Next.js

## Development

If you need to run the dashboard app locally instead of using the deployed API:

```bash
npm install
npm run dev
```

The local API routes are served by the Next.js app in this repository. For local backend dependencies, see:

- [`env.local.example`](/Users/arishazakry/Documents/MIRAGE/mirage-w26/mirage-library/env.local.example)
- [`mirage-library/miragelib-test`](/Users/arishazakry/Documents/MIRAGE/mirage-w26/mirage-library/mirage-library/miragelib-test)
