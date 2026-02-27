"""
MIRAGE-Query: Python Client for MIRAGE-MetaCorpus
Uses existing dashboard API endpoints
"""

import requests
import pandas as pd
from typing import Optional, List, Dict, Any
import warnings
import json
import os


class MIRAGEClient:
    """
    Python client for MIRAGE-MetaCorpus API
    
    Wraps the existing dashboard API endpoints for programmatic access
    
    Example:
        >>> from mirage_query import MIRAGEClient
        >>> client = MIRAGEClient()
        >>> tracks = client.search(country='Indonesia', limit=100)
    """
    
    def __init__(self, 
                 base_url: Optional[str] = None,
                 timeout: int = 30):
        """
        Initialize MIRAGE API client
        
        Args:
            base_url: Base URL for API.
                Defaults to MIRAGE_API_BASE env var, then http://localhost:3000/api
            timeout: Request timeout in seconds (default: 30)
        """
        resolved_base_url = base_url or os.getenv('MIRAGE_API_BASE', 'http://localhost:3000/api')
        self.base_url = resolved_base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'mirage-query-python/1.0',
            'Accept': 'application/json'
        })
    
    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Any:
        """Internal method to make GET requests"""
        url = f'{self.base_url}{endpoint}'
        
        try:
            response = self.session.get(
                url,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.Timeout:
            raise TimeoutError(f"Request timed out after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            raise requests.HTTPError(f"Request failed: {e}")

    def _post(self, endpoint: str, payload: Optional[Dict] = None, expect_bytes: bool = False) -> Any:
        """Internal method to make POST requests"""
        url = f'{self.base_url}{endpoint}'

        try:
            response = self.session.post(
                url,
                json=payload or {},
                timeout=self.timeout
            )
            response.raise_for_status()

            if expect_bytes:
                return response.content

            content_type = response.headers.get('Content-Type', '')
            if 'text/event-stream' in content_type:
                events = []
                current_event = 'message'
                for line in response.text.splitlines():
                    if line.startswith('event:'):
                        current_event = line.split(':', 1)[1].strip()
                    elif line.startswith('data:'):
                        raw = line.split(':', 1)[1].strip()
                        try:
                            payload = json.loads(raw)
                        except json.JSONDecodeError:
                            payload = raw
                        events.append({'event': current_event, 'data': payload})
                return {'events': events}

            return response.json()

        except requests.exceptions.Timeout:
            raise TimeoutError(f"Request timed out after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            raise requests.HTTPError(f"Request failed: {e}")

    @staticmethod
    def _build_filters(country: Optional[str] = None,
                       artist: Optional[str] = None,
                       track: Optional[str] = None,
                       station: Optional[str] = None,
                       extra_filters: Optional[Dict] = None) -> Dict:
        """Build API-compatible filters payload."""
        filters: Dict[str, Dict[str, Any]] = {}

        if country:
            filters['location_rg_country'] = {'value': [country]}
        if artist:
            filters['artist_sp_name'] = {'value': [artist]}
        if track:
            filters['track_sp_name'] = {'value': [track]}
        if station:
            filters['station_rg_name'] = {'value': [station]}

        for key, value in (extra_filters or {}).items():
            if isinstance(value, dict) and 'value' in value:
                filters[key] = value
            elif isinstance(value, (list, tuple)):
                filters[key] = {'value': list(value)}
            else:
                filters[key] = {'value': [value]}

        return filters
    
    
    # ================================================================
    # SEARCH - Main search functionality
    # ================================================================
    
    def search(self,
               query: Optional[str] = None,
               country: Optional[str] = None,
               artist: Optional[str] = None,
               track: Optional[str] = None,
               station: Optional[str] = None,
               limit: int = 100,
               offset: int = 0,
               **filters) -> pd.DataFrame:
        """
        Search for tracks in the MIRAGE corpus
        
        Uses: POST /api/search
        
        Args:
            query: General search query
            country: Filter by country name
            artist: Filter by artist name
            track: Filter by track name
            station: Filter by station
            limit: Maximum results (default: 100)
            offset: Pagination offset (default: 0)
            **filters: Additional filters (passed to API)
            
        Returns:
            pandas.DataFrame with search results
            
        Example:
            >>> # Search for tracks in Indonesia
            >>> tracks = client.search(country='Indonesia', limit=50)
            >>> 
            >>> # Search for specific artist
            >>> tracks = client.search(artist='Aisha Retno')
            >>> 
            >>> # General search
            >>> tracks = client.search(query='pop music')
        """
        payload = {
            'query': {'key': '*', 'value': query} if query else None,
            'filters': self._build_filters(country, artist, track, station, filters),
            'from': offset,
            'size': limit,
        }
        data = self._post('/search', payload)
        
        # Convert to DataFrame
        if isinstance(data, list):
            return pd.DataFrame(data)
        elif isinstance(data, dict) and 'results' in data:
            return pd.DataFrame(data['results'])
        elif isinstance(data, dict) and 'data' in data:
            return pd.DataFrame(data['data'])
        else:
            return pd.DataFrame(data)
    
    
    def search_suggest(self,
                      query: str,
                      field: str = 'artist_sp_name',
                      category: str = 'artist',
                      limit: int = 10) -> List[str]:
        """
        Get search suggestions (autocomplete)
        
        Uses: POST /api/search/suggest
        
        Args:
            query: Partial search query
            field: Field name to suggest on (default: artist_sp_name)
            category: Search category/index root (default: artist)
            limit: Maximum suggestions (default: 10)
            
        Returns:
            List of suggestions
            
        Example:
            >>> suggestions = client.search_suggest('tay')
            >>> # Returns: ['Taylor Swift', 'Tay Zonday', ...]
        """
        payload = {
            'query': query,
            'field': field,
            'category': category,
            'size': limit
        }
        data = self._post('/search/suggest', payload)
        
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and 'suggestions' in data:
            return data['suggestions']
        else:
            return []
    
    
    # ================================================================
    # LOCATION - Countries & Geographic data
    # ================================================================
    
    def get_locations(self) -> pd.DataFrame:
        """
        Get all locations (countries) in the corpus
        
        Uses: GET /api/location
        
        Returns:
            pandas.DataFrame with location data
            
        Example:
            >>> locations = client.get_locations()
            >>> print(locations[['country', 'total_events']])
        """
        data = self._get('/location')
        return pd.DataFrame(data)
    
    
    def get_location(self, location_id: str) -> Dict:
        """
        Get detailed information about a specific location
        
        Uses: GET /api/location/{id}
        
        Args:
            location_id: Location identifier
            
        Returns:
            Dictionary with location details
            
        Example:
            >>> loc = client.get_location('indonesia')
            >>> print(loc['country'], loc['total_events'])
        """
        data = self._get(f'/location/{location_id}')
        return data
    
    
    def get_location_fields(self) -> List[str]:
        """
        Get available location fields
        
        Uses: GET /api/location/fields
        
        Returns:
            List of available fields
        """
        data = self._get('/location/fields')
        return data if isinstance(data, list) else data.get('fields', [])
    
    
    def get_countries(self) -> pd.DataFrame:
        """
        Convenience method to get all countries
        
        Returns:
            pandas.DataFrame with countries
            
        Example:
            >>> countries = client.get_countries()
            >>> print(f"Total countries: {len(countries)}")
        """
        return self.get_locations()
    
    
    # ================================================================
    # STATION - Radio station data
    # ================================================================
    
    def get_stations_by_city(self, city: Optional[str] = None) -> pd.DataFrame:
        """
        Get radio stations, optionally filtered by city
        
        Uses: GET /api/station/city
        
        Args:
            city: City name (optional)
            
        Returns:
            pandas.DataFrame with stations
            
        Example:
            >>> stations = client.get_stations_by_city('Jakarta')
            >>> print(stations[['station_name', 'frequency']])
        """
        params = {'city': city} if city else {}
        data = self._get('/station/city', params)
        return pd.DataFrame(data)
    
    
    def get_station_fields(self) -> List[str]:
        """
        Get available station fields
        
        Uses: GET /api/station/fields
        
        Returns:
            List of available fields
        """
        data = self._get('/station/fields')
        return data if isinstance(data, list) else data.get('fields', [])
    
    
    # ================================================================
    # META - Track metadata
    # ================================================================
    
    def get_track_meta(self, track_id: str) -> Dict:
        """
        Get metadata for a specific track
        
        Uses: GET /api/meta/{id}
        
        Args:
            track_id: Track identifier
            
        Returns:
            Dictionary with track metadata
            
        Example:
            >>> meta = client.get_track_meta('12345')
            >>> print(meta['track_name'], meta['artist_name'])
        """
        data = self._get(f'/meta/{track_id}')
        return data
    
    
    # ================================================================
    # VISUALIZATIONS - Data for charts/graphs
    # ================================================================
    
    def get_viz_data(self, viz_type: str = 'general', **params) -> Dict:
        """
        Get visualization data
        
        Uses: POST /api/meta/viz or /api/meta/viz/{type}
        
        Args:
            viz_type: Type of visualization 
                     ('general', 'map', 'network', 'hist', 'scatter', 'radar', 'average')
            **params: Additional parameters for the visualization
            
        Returns:
            Dictionary with visualization data
            
        Example:
            >>> # Get map data
            >>> map_data = client.get_viz_data('map', country='Indonesia')
            >>> 
            >>> # Get histogram data
            >>> hist_data = client.get_viz_data('hist', field='tempo')
        """
        if viz_type == 'general':
            endpoint = '/meta/viz'
        else:
            endpoint = f'/meta/viz/{viz_type}'
        
        data = self._post(endpoint, params)
        return data
    
    
    def get_map_data(self, **params) -> Dict:
        """
        Get geographic map visualization data
        
        Uses: POST /api/meta/viz/map
        
        Returns:
            Dictionary with map coordinates and values
            
        Example:
            >>> map_data = client.get_map_data()
            >>> # Use for geographic heatmap
        """
        return self.get_viz_data('map', **params)
    
    
    def get_network_data(self, **params) -> Dict:
        """
        Get network graph data (artist/track relationships)
        
        Uses: POST /api/meta/viz/network
        
        Returns:
            Dictionary with nodes and edges for network graph
            
        Example:
            >>> network = client.get_network_data(country='Indonesia')
            >>> # Use for network visualization
        """
        return self.get_viz_data('network', **params)
    
    
    def get_histogram_data(self, field: str, **params) -> Dict:
        """
        Get histogram data for a field
        
        Uses: POST /api/meta/viz/hist
        
        Args:
            field: Field to create histogram for
            **params: Additional parameters
            
        Returns:
            Dictionary with histogram bins and counts
            
        Example:
            >>> hist = client.get_histogram_data('tempo')
            >>> # Use for histogram visualization
        """
        params['field'] = field
        return self.get_viz_data('hist', **params)
    
    
    def get_scatter_data(self, x_field: str, y_field: str, **params) -> Dict:
        """
        Get scatter plot data
        
        Uses: POST /api/meta/viz/scatter
        
        Args:
            x_field: Field for X axis
            y_field: Field for Y axis
            **params: Additional parameters
            
        Returns:
            Dictionary with x, y coordinates
            
        Example:
            >>> scatter = client.get_scatter_data('energy', 'valence')
            >>> # Use for scatter plot
        """
        params.update({'metrics': [x_field, y_field]})
        return self.get_viz_data('scatter', **params)
    
    
    def get_radar_data(self, **params) -> Dict:
        """
        Get radar chart data
        
        Uses: POST /api/meta/viz/radar
        
        Returns:
            Dictionary with radar chart values
            
        Example:
            >>> radar = client.get_radar_data(country='Indonesia')
            >>> # Use for radar/spider chart
        """
        return self.get_viz_data('radar', **params)
    
    
    def get_average_stats(self, **params) -> Dict:
        """
        Get average statistics
        
        Uses: POST /api/meta/viz/average
        
        Returns:
            Dictionary with average values
            
        Example:
            >>> stats = client.get_average_stats(country='Mexico')
            >>> print(stats['avg_tempo'], stats['avg_energy'])
        """
        return self.get_viz_data('average', **params)
    
    
    # ================================================================
    # FILTERS & UTILITIES
    # ================================================================
    
    def get_available_filters(self) -> Dict:
        """
        Get available filter options
        
        Uses: GET /api/filters/available
        
        Returns:
            Dictionary with available filters and their values
            
        Example:
            >>> filters = client.get_available_filters()
            >>> print(filters['countries'])
            >>> print(filters['genres'])
        """
        data = self._get('/filters/available')
        return data
    
    
    def get_data_range(self, field: Optional[str] = None) -> Dict:
        """
        Get data ranges for fields
        
        Uses: GET /api/range
        
        Args:
            field: Specific field to get range for (optional)
            
        Returns:
            Dictionary with min/max values
            
        Example:
            >>> ranges = client.get_data_range('tempo')
            >>> print(f"Tempo range: {ranges['min']} - {ranges['max']}")
        """
        params = {'field': field} if field else {}
        data = self._get('/range', params)
        return data
    
    
    def download_data(self,
                     format: str = 'csv',
                     filters: Optional[Dict] = None,
                     query: Optional[Dict] = None,
                     ids: Optional[List[str]] = None) -> bytes:
        """
        Download filtered data
        
        Uses: POST /api/download
        
        Args:
            format: Download format ('csv', 'json', etc.)
            filters: Filters to apply
            query: Optional backend query object, e.g. {'key': '*', 'value': 'pop'}
            ids: Optional list of event IDs to export
            
        Returns:
            Raw bytes of downloaded file
            
        Example:
            >>> data = client.download_data(
            ...     format='csv',
            ...     filters={'country': 'Indonesia'}
            ... )
            >>> with open('indonesia_tracks.csv', 'wb') as f:
            ...     f.write(data)
        """
        if format != 'csv':
            warnings.warn("Backend /download currently streams CSV output; 'format' is ignored.")

        payload = {
            'ids': ids,
            'filters': filters or {},
            'query': query
        }
        return self._post('/download', payload, expect_bytes=True)
    
    
    # ================================================================
    # CONVENIENCE METHODS (Common use cases)
    # ================================================================
    
    def get_tracks_by_country(self, country: str, limit: int = 100) -> pd.DataFrame:
        """
        Convenience method: Get tracks from a specific country
        
        Args:
            country: Country name
            limit: Maximum results
            
        Returns:
            pandas.DataFrame with tracks
            
        Example:
            >>> tracks = client.get_tracks_by_country('Indonesia', limit=200)
        """
        return self.search(country=country, limit=limit)
    
    
    def get_tracks_by_artist(self, artist: str, limit: int = 100) -> pd.DataFrame:
        """
        Convenience method: Get tracks by a specific artist
        
        Args:
            artist: Artist name
            limit: Maximum results
            
        Returns:
            pandas.DataFrame with tracks
            
        Example:
            >>> tracks = client.get_tracks_by_artist('Aisha Retno')
        """
        return self.search(artist=artist, limit=limit)
    
    
    def get_statistics(self) -> Dict:
        """
        Get overall corpus statistics
        
        Returns:
            Dictionary with corpus statistics
            
        Example:
            >>> stats = client.get_statistics()
            >>> print(f"Total tracks: {stats['total_tracks']}")
        """
        # Combine data from multiple sources
        locations = self.get_locations()
        filters = self.get_available_filters()
        
        return {
            'total_countries': len(locations),
            'available_filters': filters,
            'locations': locations.to_dict('records')
        }
    
    
    def export_to_csv(self, dataframe: pd.DataFrame, filename: str):
        """
        Export DataFrame to CSV
        
        Args:
            dataframe: pandas DataFrame to export
            filename: Output filename
            
        Example:
            >>> tracks = client.get_tracks_by_country('Indonesia')
            >>> client.export_to_csv(tracks, 'indonesia.csv')
        """
        dataframe.to_csv(filename, index=False)
        print(f"✓ Exported {len(dataframe)} rows to {filename}")
    
    
    def __repr__(self):
        return f'MIRAGEClient(base_url="{self.base_url}")'


# ================================================================
# MODULE-LEVEL CONVENIENCE FUNCTIONS
# ================================================================

def quick_search(country: str, limit: int = 100) -> pd.DataFrame:
    """
    Quick search for tracks in a country
    
    Example:
        >>> from mirage_query import quick_search
        >>> tracks = quick_search('Indonesia', limit=50)
    """
    client = MIRAGEClient()
    return client.get_tracks_by_country(country, limit)
