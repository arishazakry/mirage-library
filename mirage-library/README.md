# mirage-library

`mirage-library` is a Python wrapper around the API routes implemented in the Mirage Dashboard backend at [src/app/api](/Users/arishasz/Documents/mirage-dash/src/app/api).

The wrapper lives in [lib.py](/Users/arishasz/Documents/mirage-dash/mirage-library/lib.py). It sends HTTP requests to the dashboard API and returns Python-friendly results, mainly `pandas.DataFrame`, `dict`, `list`, or raw bytes.

The stable, intended surface for external use is the search, location, station, metadata, filter, range, and download endpoints. The wrapper intentionally avoids the internal `/meta/viz/*` dashboard routes.

## Requirements

Install the Python dependencies used by [lib.py](/Users/arishasz/Documents/mirage-dash/mirage-library/lib.py):

```bash
python3 -m pip install requests pandas
```

If you are using a virtual environment, activate it before installing packages.

## API Base Configuration

`MIRAGEClient` resolves its API base URL in this order:

1. `base_url=` passed directly to `MIRAGEClient(...)`
2. `MIRAGE_API_BASE` environment variable
3. fallback: `http://localhost:3000/api`

Examples:

```bash
export MIRAGE_API_BASE="http://localhost:3000/api"
```

```bash
export MIRAGE_API_BASE="https://your-production-domain/api"
```

## Basic Usage

```python
from lib import MIRAGEClient

client = MIRAGEClient()
tracks = client.search(country="Indonesia", limit=10)
print(tracks.head())
```

You can also pass the base URL explicitly:

```python
from lib import MIRAGEClient

client = MIRAGEClient(base_url="http://localhost:3000/api")
```

## Return Types

- Search and table-like endpoints usually return `pandas.DataFrame`
- Lookup and metadata endpoints usually return `dict`
- Suggest endpoints usually return `list`
- Download returns raw `bytes`

## Available Functions

### Search

- `search(query=None, country=None, artist=None, track=None, station=None, limit=100, offset=0, **filters) -> pd.DataFrame`
- `search_suggest(query, field="artist_sp_name", category="artist", limit=10) -> List[str]`

Example:

```python
tracks = client.search(query="pop", limit=25)
indo_tracks = client.search(country="Indonesia", limit=50)
suggestions = client.search_suggest("tay")
```

### Location and Station

- `get_locations() -> pd.DataFrame`
- `get_location(location_id) -> Dict`
- `get_location_fields() -> List[str]`
- `get_countries() -> pd.DataFrame`
- `get_stations_by_city(city=None) -> pd.DataFrame`
- `get_station_fields() -> List[str]`

Example:

```python
locations = client.get_locations()
jakarta_stations = client.get_stations_by_city("Jakarta")
```

### Track Metadata

- `get_track_meta(track_id) -> Dict`

Example:

```python
meta = client.get_track_meta("evt_001")
```

## Filters and Utilities

- `get_available_filters() -> Dict`
- `get_data_range(index, fields) -> Dict`
- `download_data(format="csv", filters=None, query=None, ids=None) -> bytes`

Example:

```python
filters = client.get_available_filters()
ranges = client.get_data_range("radio_events", ["track_mb_year", "track_mb_duration"])
csv_bytes = client.download_data(filters={"location_rg_country": {"value": ["Indonesia"]}})
```

## Convenience Methods

- `get_tracks_by_country(country, limit=100) -> pd.DataFrame`
- `get_tracks_by_artist(artist, limit=100) -> pd.DataFrame`
- `get_statistics() -> Dict`
- `export_to_csv(dataframe, filename) -> None`
- `quick_search(country, limit=100) -> pd.DataFrame`

Example:

```python
tracks = client.get_tracks_by_country("Indonesia", limit=100)
client.export_to_csv(tracks, "indonesia_tracks.csv")
```

## Running the API Smoke Test

The test script is [test.py](/Users/arishasz/Documents/mirage-dash/mirage-library/test.py).

By default, it covers the stable endpoint surface exposed through `mirage-library`.

Run it against local backend:

```bash
export MIRAGE_API_BASE="http://localhost:3000/api"
python3 /Users/arishasz/Documents/mirage-dash/mirage-library/test.py
```

Run it against another environment:

```bash
export MIRAGE_API_BASE="https://your-production-domain/api"
python3 /Users/arishasz/Documents/mirage-dash/mirage-library/test.py
```

## Importing the Full Corpus into Local Postgres

The full corpus CSV can be imported into the local Postgres database used by `mirage-dash`.

Files involved:

- [corpus_init.sql](/Users/arishasz/Documents/mirage-dash/mirage-library/corpus_init.sql)
- [corpus_transform.sql](/Users/arishasz/Documents/mirage-dash/mirage-library/corpus_transform.sql)
- [import_corpus.sh](/Users/arishasz/Documents/mirage-dash/mirage-library/import_corpus.sh)

Default corpus path:

```bash
/Users/arishasz/Downloads/AllData/MIRAGE_MetaCorpus_v1.csv
```

Run the importer:

```bash
/Users/arishasz/Documents/mirage-dash/mirage-library/import_corpus.sh
```

Run the importer with an explicit CSV path:

```bash
/Users/arishasz/Documents/mirage-dash/mirage-library/import_corpus.sh /Users/arishasz/Downloads/AllData/MIRAGE_MetaCorpus_v1.csv
```

What it does:

- initializes a staging table called `mirage_corpus_raw`
- streams the CSV into Postgres
- populates normalized tables: `location`, `station`, `track`, `artist`, `event`, `track_artist`
- rebuilds the API-facing views: `event_flat` and `station_by_country`

Notes:

- If a Docker container named `mirage-lib-postgres` exists, the script uses `docker exec`
- Otherwise it falls back to local `psql`
- The script uses `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, and `PG_DATABASE` if set

## Notes

- The wrapper uses the Mirage Dashboard API. It does not connect directly to Postgres or Elasticsearch.
- For local development, the backend at `mirage-dash` must be running and properly configured.
- If `requests` or `pandas` is missing, install them in the same Python environment used to run the script.
