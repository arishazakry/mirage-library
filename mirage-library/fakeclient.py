"""Example consumer script for the mirage-library wrapper.

This file simulates how an external user would interact with the package:
- instantiate MIRAGEClient
- call wrapper methods directly
- work with the returned Python objects
"""

from lib import MIRAGEClient


def main() -> None:
    client = MIRAGEClient()

    print(f"Using API base: {client.base_url}")

    print("\nSearch tracks by country")
    tracks = client.search(country="Indonesia", limit=5)
    if tracks.empty:
        print("No tracks returned.")
    else:
        print(tracks[["event_ma_id", "artist_sp_name", "track_sp_name"]].head())

    print("\nList available locations")
    locations = client.get_locations()
    if locations.empty:
        print("No locations returned.")
    else:
        print(locations[["location_rg_city", "location_rg_country"]].head())

    print("\nSearch suggestions")
    suggestions = client.search_suggest("tay")
    print(suggestions[:5])

    print("\nAvailable filters")
    filters = client.get_available_filters()
    print(filters[:3] if isinstance(filters, list) else filters)

    print("\nDownload filtered data")
    csv_bytes = client.download_data(
        filters={"location_rg_country": {"value": ["Indonesia"]}}
    )
    print(f"Downloaded {len(csv_bytes)} bytes")


if __name__ == "__main__":
    main()
