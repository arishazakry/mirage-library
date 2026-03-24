"""
test_endpoints.py - Test all MIRAGE endpoints

Run after Tuesday meeting to verify each endpoint works
"""

import requests
import json
import os

# Default to the deployed dashboard API.
# Override with: MIRAGE_API_BASE="https://your-host/api"
BASE_URL = os.getenv('MIRAGE_API_BASE', 'https://dashboard.mirage-project.org/api')


def parse_sse_events(raw_text):
    """Parse basic SSE stream into event dicts."""
    events = []
    current_event = "message"
    for line in raw_text.splitlines():
        if line.startswith("event:"):
            current_event = line.split(":", 1)[1].strip()
        elif line.startswith("data:"):
            payload = line.split(":", 1)[1].strip()
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                pass
            events.append({"event": current_event, "data": payload})
    return events

def test_endpoint(name, endpoint, method='GET', params=None, payload=None):
    """Test a single endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"Endpoint: {method.upper()} {endpoint}")
    if params:
        print(f"Params: {params}")
    if payload:
        print(f"Payload: {json.dumps(payload, indent=2)}")
    print('='*60)
    
    try:
        url = f"{BASE_URL}{endpoint}"
        if method.upper() == 'POST':
            response = requests.post(url, params=params, json=payload, timeout=20)
        else:
            response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        content_type = response.headers.get('Content-Type', '')
        if 'application/json' in content_type:
            data = response.json()
        elif 'text/event-stream' in content_type:
            data = parse_sse_events(response.text)
            error_events = [e for e in data if e.get('event') == 'error']
            if error_events:
                raise RuntimeError(f"SSE error event received: {error_events[0].get('data')}")
        else:
            data = response.text

        print("✓ Success!")
        print(f"Response type: {type(data)}")
        print(f"Content-Type: {content_type}")
        
        if isinstance(data, list):
            print(f"Items: {len(data)}")
            if data:
                print("First item:")
                print(json.dumps(data[0], indent=2))
        elif isinstance(data, dict):
            print("Keys:", list(data.keys()))
            print("Sample data:")
            print(json.dumps(data, indent=2)[:500])
        else:
            print("Sample data:")
            print(str(data)[:500])
        
        return data
        
    except Exception as e:
        print(f"✗ Error: {e}")
        response = getattr(e, 'response', None)
        if response is not None:
            print(f"Status: {response.status_code}")
            print("Response body:")
            print(response.text[:1000])
        return None


# Test each endpoint
if __name__ == '__main__':
    print("MIRAGE API ENDPOINT TESTS")
    print("="*60)
    
    # 1. Search
    test_endpoint(
        "Search - General",
        "/search",
        method='POST',
        payload={
            'query': None,
            'filters': {},
            'from': 0,
            'size': 5
        }
    )
    
    test_endpoint(
        "Search - By Country",
        "/search",
        method='POST',
        payload={
            'query': None,
            'filters': {
                'location_rg_country': {'value': ['Indonesia']}
            },
            'from': 0,
            'size': 5
        }
    )
    
    test_endpoint(
        "Search Suggestions",
        "/search/suggest",
        method='POST',
        payload={
            'field': 'artist_sp_name',
            'category': 'artist',
            'query': 'taylor',
            'size': 10
        }
    )
    
    # 2. Locations
    test_endpoint(
        "All Locations",
        "/location"
    )
    
    test_endpoint(
        "Location Fields",
        "/location/fields"
    )
    
    # 3. Stations
    test_endpoint(
        "Stations by City",
        "/station/city",
        params={'city': 'Jakarta'}
    )
    
    test_endpoint(
        "Station Fields",
        "/station/fields"
    )
    
    # 4. Visualizations
    test_endpoint(
        "Viz - Map",
        "/meta/viz/map",
        method='POST',
        payload={
            'query': {'key': '*', 'value': ''},
            'filters': {}
        }
    )
    
    test_endpoint(
        "Viz - Network",
        "/meta/viz/network",
        method='POST',
        payload={
            'query': {'key': '*', 'value': ''},
            'filters': {},
            'metadataVariable': 'artists',
            'maxNodes': 50
        }
    )
    
    test_endpoint(
        "Viz - Histogram",
        "/meta/viz/hist",
        method='POST',
        payload={
            'query': {'key': '*', 'value': ''},
            'filters': {},
            'metrics': ['track_sp_energy']
        }
    )
    
    test_endpoint(
        "Viz - Average Stats",
        "/meta/viz/average",
        method='POST',
        payload={
            'query': {'key': '*', 'value': ''},
            'filters': {}
        }
    )
    
    # 5. Filters
    test_endpoint(
        "Available Filters",
        "/filters/available"
    )
    
    # 6. Utilities
    test_endpoint(
        "Data Range",
        "/range",
        params={
            'index': 'artists',
            'fields': 'artist_sp_popularity,artist_sp_followers'
        }
    )
    
    print("\n" + "="*60)
    print("TESTING COMPLETE!")
    print("="*60)
