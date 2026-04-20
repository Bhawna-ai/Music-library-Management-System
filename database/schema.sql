-- Music Library Management System Database Schema
-- 4th Semester Student Project

-- Artists Table
CREATE TABLE artists (
    artist_id INT PRIMARY KEY AUTO_INCREMENT,
    artist_name VARCHAR(100) NOT NULL UNIQUE,
    bio TEXT,
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genres Table
CREATE TABLE genres (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    genre_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Albums Table
CREATE TABLE albums (
    album_id INT PRIMARY KEY AUTO_INCREMENT,
    album_name VARCHAR(100) NOT NULL,
    artist_id INT NOT NULL,
    release_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE
);

-- Tracks Table
CREATE TABLE tracks (
    track_id INT PRIMARY KEY AUTO_INCREMENT,
    track_title VARCHAR(100) NOT NULL,
    album_id INT NOT NULL,
    artist_id INT NOT NULL,
    genre_id INT NOT NULL,
    duration INT,  -- Duration in seconds
    release_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
);

-- Playlists Table
CREATE TABLE playlists (
    playlist_id INT PRIMARY KEY AUTO_INCREMENT,
    playlist_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist Tracks (Junction Table)
CREATE TABLE playlist_tracks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    playlist_id INT NOT NULL,
    track_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE,
    UNIQUE KEY unique_playlist_track (playlist_id, track_id)
);

-- Indexes for better query performance
CREATE INDEX idx_artist_name ON artists(artist_name);
CREATE INDEX idx_album_artist ON albums(artist_id);
CREATE INDEX idx_track_title ON tracks(track_title);
CREATE INDEX idx_track_artist ON tracks(artist_id);
CREATE INDEX idx_track_genre ON tracks(genre_id);
CREATE INDEX idx_playlist_name ON playlists(playlist_name);

-- Sample Queries for Music Library Operations

-- 1. Search songs by title
SELECT t.track_title, a.artist_name, g.genre_name, ab.album_name
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
JOIN genres g ON t.genre_id = g.genre_id
JOIN albums ab ON t.album_id = ab.album_id
WHERE t.track_title LIKE '%search_term%'
ORDER BY t.track_title;

-- 2. Search songs by artist
SELECT t.track_title, a.artist_name, g.genre_name, ab.album_name
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
JOIN genres g ON t.genre_id = g.genre_id
JOIN albums ab ON t.album_id = ab.album_id
WHERE a.artist_name LIKE '%artist_name%'
ORDER BY t.track_title;

-- 3. Search songs by genre
SELECT t.track_title, a.artist_name, g.genre_name, ab.album_name
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
JOIN genres g ON t.genre_id = g.genre_id
JOIN albums ab ON t.album_id = ab.album_id
WHERE g.genre_name = 'genre_name'
ORDER BY t.track_title;

-- 4. Get all songs in an album
SELECT t.track_title, a.artist_name, g.genre_name, t.duration
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
JOIN genres g ON t.genre_id = g.genre_id
WHERE t.album_id = album_id
ORDER BY t.track_title;

-- 5. Get playlist with all tracks
SELECT p.playlist_name, t.track_title, a.artist_name, g.genre_name, t.duration
FROM playlists p
JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
JOIN tracks t ON pt.track_id = t.track_id
JOIN artists a ON t.artist_id = a.artist_id
JOIN genres g ON t.genre_id = g.genre_id
WHERE p.playlist_id = playlist_id
ORDER BY pt.added_at;

-- 6. Get total duration of playlist
SELECT p.playlist_name, SEC_TO_TIME(SUM(t.duration)) as total_duration, COUNT(t.track_id) as track_count
FROM playlists p
JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
JOIN tracks t ON pt.track_id = t.track_id
WHERE p.playlist_id = playlist_id
GROUP BY p.playlist_id;

-- 7. Get top genres (song count)
SELECT g.genre_name, COUNT(t.track_id) as song_count
FROM genres g
JOIN tracks t ON g.genre_id = t.genre_id
GROUP BY g.genre_id, g.genre_name
ORDER BY song_count DESC;

-- 8. Get top artists (track count)
SELECT a.artist_name, COUNT(t.track_id) as track_count
FROM artists a
JOIN tracks t ON a.artist_id = t.artist_id
GROUP BY a.artist_id, a.artist_name
ORDER BY track_count DESC;
