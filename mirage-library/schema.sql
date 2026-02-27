-- MIRAGE starter schema for local development
-- Target DB: PostgreSQL
-- Usage:
--   psql -h localhost -U postgres -d radio_db -f mirage-library/schema.sql

BEGIN;

DROP VIEW IF EXISTS event_flat CASCADE;
DROP VIEW IF EXISTS station_by_country CASCADE;
DROP TABLE IF EXISTS track_artist CASCADE;
DROP TABLE IF EXISTS event CASCADE;
DROP TABLE IF EXISTS artist CASCADE;
DROP TABLE IF EXISTS track CASCADE;
DROP TABLE IF EXISTS station CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS urls CASCADE;

CREATE TABLE location (
  location_rg_id TEXT PRIMARY KEY,
  location_rg_city TEXT,
  location_rg_country TEXT,
  location_rg_latitude DOUBLE PRECISION,
  location_rg_longitude DOUBLE PRECISION,
  location_ne_continent TEXT,
  location_ne_country TEXT,
  location_ne_countryeconomy TEXT,
  location_ne_countrygdp DOUBLE PRECISION,
  location_ne_countrypopulation BIGINT,
  location_ne_countrysovereignstate TEXT,
  location_ne_countrytype TEXT,
  location_ne_region TEXT,
  location_ne_stateprovince TEXT
);

CREATE TABLE station (
  station_rg_id TEXT PRIMARY KEY,
  station_rg_name TEXT,
  station_rg_url TEXT,
  station_se_name TEXT,
  station_se_description TEXT,
  station_se_websiteurl TEXT,
  station_ar_genre TEXT[],
  station_ar_format TEXT,
  station_ar_form TEXT,
  station_ar_frequency TEXT[],
  station_ar_languagecode TEXT
);

CREATE TABLE track (
  track_sp_id TEXT PRIMARY KEY,
  track_sp_name TEXT,
  track_sp_duration INTEGER,
  track_sp_year INTEGER,
  track_sp_popularity INTEGER,
  track_sp_loudness DOUBLE PRECISION,
  track_sp_tempo DOUBLE PRECISION,
  track_sp_key TEXT[],
  track_sp_mode INTEGER,
  track_sp_beatsperbar INTEGER,
  track_sp_danceability DOUBLE PRECISION,
  track_sp_speechiness DOUBLE PRECISION,
  track_sp_acousticness DOUBLE PRECISION,
  track_sp_instrumentalness DOUBLE PRECISION,
  track_sp_liveness DOUBLE PRECISION,
  track_sp_energy DOUBLE PRECISION,
  track_sp_valence DOUBLE PRECISION,
  track_sp_genre TEXT[],
  track_sp_timbre TEXT[],
  track_wd_instrumentation TEXT[]
);

CREATE TABLE artist (
  artist_sp_id TEXT PRIMARY KEY,
  artist_sp_name TEXT,
  artist_sp_followers BIGINT,
  artist_sp_popularity INTEGER,
  artist_sp_genre TEXT[],
  artist_sp_imageurl TEXT,
  artist_wd_country TEXT,
  artist_wd_type TEXT,
  artist_wd_description TEXT,
  artist_wd_genre TEXT[],
  artist_wd_instruments TEXT[],
  artist_wd_voicetype TEXT[],
  artist_wd_voicetypes TEXT[],
  artist_wd_ethnicities TEXT[],
  artist_wd_genders TEXT[],
  artist_wd_members TEXT[],
  artist_wd_sexualorientations TEXT[],
  artist_wd_startyear INTEGER
);

CREATE TABLE event (
  event_ma_id TEXT PRIMARY KEY,
  event_ma_metadatareliability DOUBLE PRECISION,
  event_se_description TEXT,
  event_ma_timestation TIMESTAMP,
  location_rg_id TEXT NOT NULL REFERENCES location(location_rg_id),
  station_rg_id TEXT NOT NULL REFERENCES station(station_rg_id),
  artist_sp_id TEXT REFERENCES artist(artist_sp_id),
  track_sp_id TEXT NOT NULL REFERENCES track(track_sp_id)
);

CREATE TABLE track_artist (
  track_sp_id TEXT NOT NULL REFERENCES track(track_sp_id),
  artist_sp_id TEXT NOT NULL REFERENCES artist(artist_sp_id),
  PRIMARY KEY (track_sp_id, artist_sp_id)
);

CREATE TABLE urls (
  id TEXT PRIMARY KEY,
  data TEXT UNIQUE NOT NULL
);

CREATE VIEW station_by_country AS
SELECT
  s.station_rg_id,
  s.station_rg_name,
  s.station_ar_genre,
  l.location_rg_city,
  l.location_rg_country,
  COUNT(e.event_ma_id)::INT AS total_events
FROM station s
LEFT JOIN event e ON e.station_rg_id = s.station_rg_id
LEFT JOIN location l ON e.location_rg_id = l.location_rg_id
GROUP BY s.station_rg_id, s.station_rg_name, s.station_ar_genre, l.location_rg_city, l.location_rg_country;

CREATE VIEW event_flat AS
SELECT
  e.event_ma_id,
  e.event_ma_metadatareliability,
  e.event_se_description,
  e.event_ma_timestation,
  e.location_rg_id,
  e.station_rg_id,
  e.artist_sp_id,
  e.track_sp_id,
  l.location_rg_city,
  l.location_rg_country,
  l.location_rg_latitude,
  l.location_rg_longitude,
  l.location_ne_continent,
  l.location_ne_country,
  l.location_ne_countryeconomy,
  l.location_ne_countrygdp,
  l.location_ne_countrypopulation,
  l.location_ne_countrysovereignstate,
  l.location_ne_countrytype,
  l.location_ne_region,
  l.location_ne_stateprovince,
  s.station_rg_name,
  s.station_rg_url,
  s.station_se_name,
  s.station_se_description,
  s.station_se_websiteurl,
  s.station_ar_genre,
  s.station_ar_format,
  s.station_ar_form,
  s.station_ar_frequency,
  s.station_ar_languagecode,
  t.track_sp_name,
  t.track_sp_duration,
  t.track_sp_year,
  t.track_sp_popularity,
  t.track_sp_loudness,
  t.track_sp_tempo,
  t.track_sp_key,
  t.track_sp_mode,
  t.track_sp_beatsperbar,
  t.track_sp_danceability,
  t.track_sp_speechiness,
  t.track_sp_acousticness,
  t.track_sp_instrumentalness,
  t.track_sp_liveness,
  t.track_sp_energy,
  t.track_sp_valence,
  t.track_sp_genre,
  t.track_sp_timbre,
  t.track_wd_instrumentation,
  a.artist_sp_name,
  a.artist_sp_followers,
  a.artist_sp_popularity,
  a.artist_sp_genre,
  a.artist_sp_imageurl,
  a.artist_wd_country,
  a.artist_wd_type,
  a.artist_wd_description,
  a.artist_wd_genre,
  a.artist_wd_instruments,
  a.artist_wd_voicetype,
  a.artist_wd_voicetypes,
  a.artist_wd_ethnicities,
  a.artist_wd_genders,
  a.artist_wd_members,
  a.artist_wd_sexualorientations,
  a.artist_wd_startyear
FROM event e
JOIN location l ON e.location_rg_id = l.location_rg_id
JOIN station s ON e.station_rg_id = s.station_rg_id
JOIN track t ON e.track_sp_id = t.track_sp_id
LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id;

CREATE INDEX idx_event_location ON event(location_rg_id);
CREATE INDEX idx_event_station ON event(station_rg_id);
CREATE INDEX idx_event_artist ON event(artist_sp_id);
CREATE INDEX idx_event_track ON event(track_sp_id);

INSERT INTO location (
  location_rg_id, location_rg_city, location_rg_country, location_rg_latitude, location_rg_longitude,
  location_ne_continent, location_ne_country, location_ne_countryeconomy, location_ne_countrygdp,
  location_ne_countrypopulation, location_ne_countrysovereignstate, location_ne_countrytype, location_ne_region, location_ne_stateprovince
) VALUES (
  'loc_jkt', 'Jakarta', 'Indonesia', -6.2088, 106.8456,
  'Asia', 'Indonesia', 'Developing region', 1410000000, 275000000, 'Indonesia', 'Country', 'Southeast Asia', 'Jakarta'
);

INSERT INTO station (
  station_rg_id, station_rg_name, station_rg_url, station_se_name, station_se_description, station_se_websiteurl,
  station_ar_genre, station_ar_format, station_ar_form, station_ar_frequency, station_ar_languagecode
) VALUES (
  'stn_001', 'Jakarta Pop FM', 'https://radiogarden.example/stn_001', 'Jakarta Pop FM',
  'Sample station for local MIRAGE dev', 'https://station.example',
  ARRAY['pop','adult contemporary'], 'FM', 'Music', ARRAY['101.2 FM'], 'id'
);

INSERT INTO track (
  track_sp_id, track_sp_name, track_sp_duration, track_sp_year, track_sp_popularity,
  track_sp_loudness, track_sp_tempo, track_sp_key, track_sp_mode, track_sp_beatsperbar,
  track_sp_danceability, track_sp_speechiness, track_sp_acousticness, track_sp_instrumentalness,
  track_sp_liveness, track_sp_energy, track_sp_valence, track_sp_genre, track_sp_timbre, track_wd_instrumentation
) VALUES (
  'trk_001', 'Sample Track', 210000, 2023, 65,
  -7.2, 118.5, ARRAY['C'], 1, 4,
  0.68, 0.06, 0.21, 0.01,
  0.12, 0.74, 0.62, ARRAY['pop'], ARRAY['bright'], ARRAY['guitar','synth']
);

INSERT INTO artist (
  artist_sp_id, artist_sp_name, artist_sp_followers, artist_sp_popularity, artist_sp_genre, artist_sp_imageurl,
  artist_wd_country, artist_wd_type, artist_wd_description, artist_wd_genre, artist_wd_instruments,
  artist_wd_voicetype, artist_wd_voicetypes, artist_wd_ethnicities, artist_wd_genders, artist_wd_members,
  artist_wd_sexualorientations, artist_wd_startyear
) VALUES (
  'art_001', 'Sample Artist', 120000, 70, ARRAY['pop'], NULL,
  'Indonesia', 'Person', 'Sample artist for local MIRAGE dev', ARRAY['pop'], ARRAY['voice','guitar'],
  ARRAY['mezzo-soprano'], ARRAY['mezzo-soprano'], ARRAY['Indonesian'], ARRAY['female'], ARRAY['Sample Artist'],
  ARRAY['unknown'], 2018
);

INSERT INTO event (
  event_ma_id, event_ma_metadatareliability, event_se_description, event_ma_timestation,
  location_rg_id, station_rg_id, artist_sp_id, track_sp_id
) VALUES (
  'evt_001', 0.92, 'Sample stream event', NOW(),
  'loc_jkt', 'stn_001', 'art_001', 'trk_001'
);

INSERT INTO track_artist (track_sp_id, artist_sp_id) VALUES ('trk_001', 'art_001');

COMMIT;
