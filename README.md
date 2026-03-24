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

This repository does not yet include PyPI packaging metadata, so installation is currently package-source based.

1. Download the package archive:

Package archive: [mirage-library-test.zip](https://github.com/arishazakry/mirage-library/releases/tag/v1.0.0)

```bash
unzip mirage-library-test.zip
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

4. Add the extracted library directory to `PYTHONPATH`:

```bash
export PYTHONPATH="$PWD/Users/arishazakry/Documents/MIRAGE/mirage-w26/mirage-library/mirage-library:$PYTHONPATH"
```

### Configure API Access

The Python client defaults to the live dashboard API. You can override it with `MIRAGE_API_BASE` if needed.

```bash
export MIRAGE_API_BASE="https://dashboard.mirage-project.org/api"
```

### Run a Smoke Test

Use the built-in endpoint test script:

```bash
python3 Users/arishazakry/Documents/MIRAGE/mirage-w26/mirage-library/mirage-library/test.py
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

## Available Functions

### Search

- `search(...)`: main search interface with query text, filters, pagination, and convenience keyword arguments like country, artist, track, and station.
- `search_suggest(query, field='artist_sp_name', category='artist', limit=10)`: autocomplete suggestions for search fields.

### Location

- `get_locations()`: return all available locations as a DataFrame.
- `get_location(location_id)`: return metadata for a single location.
- `get_location_fields()`: list supported location filter fields.
- `get_countries()`: convenience alias for location listing.

### Station

- `get_stations_by_city(city=None)`: return stations, optionally filtered by city.
- `get_station_fields()`: list supported station filter fields.

### Metadata

- `get_track_meta(track_id)`: return detailed metadata for a specific track.

### Visualization

- `get_viz_data(viz_type='general', **params)`: generic visualization endpoint wrapper.
- `get_map_data(**params)`: map aggregation data.
- `get_network_data(**params)`: network graph data for relationships such as artists.
- `get_histogram_data(field, **params)`: histogram data for a selected field.
- `get_scatter_data(x_field, y_field, **params)`: scatter plot data for two metrics.
- `get_radar_data(**params)`: radar chart data.
- `get_average_stats(**params)`: aggregate summary statistics.

### Filters And Export

- `get_available_filters()`: return the list of supported filters and metadata.
- `get_data_range(field=None)`: return min/max range data for numeric fields.
- `download_data(format='csv', filters=None, query=None, ids=None)`: download filtered export data as bytes.
- `export_to_csv(dataframe, filename)`: save a DataFrame to CSV locally.

### Convenience Helpers

- `get_tracks_by_country(country, limit=100)`: country-filtered search shortcut.
- `get_tracks_by_artist(artist, limit=100)`: artist-filtered search shortcut.
- `get_statistics()`: high-level corpus summary built from multiple endpoints.

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
