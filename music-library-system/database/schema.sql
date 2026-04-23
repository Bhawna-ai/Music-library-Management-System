-- ============================================
-- Music Library Management System
-- Database Schema — DBMS Capstone Project
-- ============================================

-- ============================================
-- PART 1: TABLE DEFINITIONS (DDL)
-- ============================================

-- 1. Artists Table
CREATE TABLE artists (
    artist_id    INT PRIMARY KEY AUTO_INCREMENT,
    artist_name  VARCHAR(100) NOT NULL UNIQUE,
    bio          TEXT,
    country      VARCHAR(50),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Genres Table
CREATE TABLE genres (
    genre_id     INT PRIMARY KEY AUTO_INCREMENT,
    genre_name   VARCHAR(50) NOT NULL UNIQUE,
    description  TEXT
);

-- 3. Albums Table
CREATE TABLE albums (
    album_id     INT PRIMARY KEY AUTO_INCREMENT,
    album_name   VARCHAR(100) NOT NULL,
    artist_id    INT NOT NULL,
    release_year YEAR,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE
);

-- 4. Tracks Table
CREATE TABLE tracks (
    track_id     INT PRIMARY KEY AUTO_INCREMENT,
    track_title  VARCHAR(100) NOT NULL,
    album_id     INT NOT NULL,
    artist_id    INT NOT NULL,
    genre_id     INT NOT NULL,
    duration     INT,  -- Duration in seconds
    release_date DATE,
    stream_url   VARCHAR(500),
    cover_art    VARCHAR(500),
    play_count   INT DEFAULT 0,
    last_played  TIMESTAMP NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id)  REFERENCES albums(album_id)   ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id)  ON DELETE CASCADE,
    FOREIGN KEY (genre_id)  REFERENCES genres(genre_id)    ON DELETE CASCADE
);

-- 5. Playlists Table
CREATE TABLE playlists (
    playlist_id   INT PRIMARY KEY AUTO_INCREMENT,
    playlist_name VARCHAR(100) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Playlist Tracks (Junction Table — Many-to-Many Relationship)
CREATE TABLE playlist_tracks (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    playlist_id  INT NOT NULL,
    track_id     INT NOT NULL,
    added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id)    REFERENCES tracks(track_id)       ON DELETE CASCADE,
    UNIQUE KEY unique_playlist_track (playlist_id, track_id)
);

-- 7. Users Table
CREATE TABLE users (
    user_id      INT PRIMARY KEY AUTO_INCREMENT,
    username     VARCHAR(50) NOT NULL UNIQUE,
    email        VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Favorites (Junction Table — Users ↔ Tracks)
CREATE TABLE favorites (
    user_id      INT NOT NULL,
    track_id     INT NOT NULL,
    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id)  ON DELETE CASCADE
);

-- 9. Play History
CREATE TABLE play_history (
    history_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id      INT,
    track_id     INT NOT NULL,
    played_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE SET NULL,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id)  ON DELETE CASCADE
);

-- 10. Reviews Table
CREATE TABLE reviews (
    review_id    INT PRIMARY KEY AUTO_INCREMENT,
    track_id     INT NOT NULL,
    rating       TINYINT CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
);

-- 11. Deletion Audit Log (populated by triggers)
CREATE TABLE deletion_log (
    log_id       INT PRIMARY KEY AUTO_INCREMENT,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    INT NOT NULL,
    entity_name  VARCHAR(100),
    deleted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 2: INDEXES
-- ============================================

CREATE INDEX idx_artist_name   ON artists(artist_name);
CREATE INDEX idx_album_artist  ON albums(artist_id);
CREATE INDEX idx_track_title   ON tracks(track_title);
CREATE INDEX idx_track_artist  ON tracks(artist_id);
CREATE INDEX idx_track_genre   ON tracks(genre_id);
CREATE INDEX idx_track_album   ON tracks(album_id);
CREATE INDEX idx_playlist_name ON playlists(playlist_name);
CREATE INDEX idx_play_history  ON play_history(track_id, played_at);
CREATE INDEX idx_reviews_track ON reviews(track_id);

-- ============================================
-- PART 3: VIEWS
-- ============================================

-- View 1: Track Details (pre-joined for convenient queries)
CREATE VIEW track_details_view AS
SELECT
    t.track_id,
    t.track_title,
    a.artist_name,
    ab.album_name,
    g.genre_name,
    t.duration,
    t.release_date
FROM tracks t
JOIN artists a  ON t.artist_id = a.artist_id
JOIN albums ab  ON t.album_id  = ab.album_id
JOIN genres g   ON t.genre_id  = g.genre_id;

-- View 2: Playlist Summary (with track count and total duration)
CREATE VIEW playlist_summary_view AS
SELECT
    p.playlist_id,
    p.playlist_name,
    p.description,
    COUNT(pt.track_id) AS track_count,
    COALESCE(SEC_TO_TIME(SUM(t.duration)), '00:00:00') AS total_duration
FROM playlists p
LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
LEFT JOIN tracks t           ON pt.track_id   = t.track_id
GROUP BY p.playlist_id, p.playlist_name, p.description;

-- View 3: Artist Statistics (albums, tracks, avg duration)
CREATE VIEW artist_stats_view AS
SELECT
    a.artist_id,
    a.artist_name,
    a.country,
    COUNT(DISTINCT ab.album_id) AS album_count,
    COUNT(DISTINCT t.track_id)  AS track_count,
    COALESCE(AVG(t.duration), 0) AS avg_duration,
    COALESCE(SUM(t.duration), 0) AS total_duration
FROM artists a
LEFT JOIN albums ab ON a.artist_id = ab.artist_id
LEFT JOIN tracks t  ON a.artist_id = t.artist_id
GROUP BY a.artist_id, a.artist_name, a.country;

-- ============================================
-- PART 4: STORED PROCEDURES
-- ============================================

-- Procedure 1: Safely add track to playlist (with duplicate check)
DELIMITER //
CREATE PROCEDURE sp_add_track_to_playlist(
    IN p_playlist_id INT,
    IN p_track_id INT
)
BEGIN
    DECLARE track_exists INT;

    SELECT COUNT(*) INTO track_exists
    FROM playlist_tracks
    WHERE playlist_id = p_playlist_id AND track_id = p_track_id;

    IF track_exists = 0 THEN
        INSERT INTO playlist_tracks (playlist_id, track_id)
        VALUES (p_playlist_id, p_track_id);
        SELECT 'Track added successfully' AS result;
    ELSE
        SELECT 'Track already exists in playlist' AS result;
    END IF;
END //
DELIMITER ;

-- Procedure 2: Get full artist discography
DELIMITER //
CREATE PROCEDURE sp_get_artist_discography(
    IN p_artist_id INT
)
BEGIN
    SELECT
        a.artist_name,
        ab.album_name,
        ab.release_year,
        t.track_title,
        g.genre_name,
        t.duration
    FROM artists a
    JOIN albums ab ON a.artist_id  = ab.artist_id
    JOIN tracks t  ON ab.album_id  = t.album_id AND t.artist_id = a.artist_id
    JOIN genres g  ON t.genre_id   = g.genre_id
    WHERE a.artist_id = p_artist_id
    ORDER BY ab.release_year, t.track_title;
END //
DELIMITER ;

-- Procedure 3: Universal search across the library
DELIMITER //
CREATE PROCEDURE sp_search_library(
    IN p_search_term VARCHAR(100)
)
BEGIN
    SET @term = CONCAT('%', p_search_term, '%');

    SELECT t.track_title, a.artist_name, ab.album_name, g.genre_name
    FROM tracks t
    JOIN artists a  ON t.artist_id = a.artist_id
    JOIN albums ab  ON t.album_id  = ab.album_id
    JOIN genres g   ON t.genre_id  = g.genre_id
    WHERE t.track_title LIKE @term
       OR a.artist_name LIKE @term
       OR ab.album_name LIKE @term
    ORDER BY t.track_title;
END //
DELIMITER ;

-- ============================================
-- PART 5: TRIGGERS
-- ============================================

-- Trigger 1: Auto-update playlist timestamp when track is added
DELIMITER //
CREATE TRIGGER trg_update_playlist_on_add
AFTER INSERT ON playlist_tracks
FOR EACH ROW
BEGIN
    UPDATE playlists
    SET updated_at = CURRENT_TIMESTAMP
    WHERE playlist_id = NEW.playlist_id;
END //
DELIMITER ;

-- Trigger 2: Auto-update playlist timestamp when track is removed
DELIMITER //
CREATE TRIGGER trg_update_playlist_on_remove
AFTER DELETE ON playlist_tracks
FOR EACH ROW
BEGIN
    UPDATE playlists
    SET updated_at = CURRENT_TIMESTAMP
    WHERE playlist_id = OLD.playlist_id;
END //
DELIMITER ;

-- Trigger 3: Log track deletion for audit trail
DELIMITER //
CREATE TRIGGER trg_log_track_deletion
BEFORE DELETE ON tracks
FOR EACH ROW
BEGIN
    INSERT INTO deletion_log (entity_type, entity_id, entity_name)
    VALUES ('track', OLD.track_id, OLD.track_title);
END //
DELIMITER ;

-- Trigger 4: Log artist deletion for audit trail
DELIMITER //
CREATE TRIGGER trg_log_artist_deletion
BEFORE DELETE ON artists
FOR EACH ROW
BEGIN
    INSERT INTO deletion_log (entity_type, entity_id, entity_name)
    VALUES ('artist', OLD.artist_id, OLD.artist_name);
END //
DELIMITER ;

-- Trigger 5: Prevent duplicate genre names (case-insensitive)
DELIMITER //
CREATE TRIGGER trg_check_genre_unique
BEFORE INSERT ON genres
FOR EACH ROW
BEGIN
    DECLARE cnt INT;
    SELECT COUNT(*) INTO cnt FROM genres
    WHERE LOWER(genre_name) = LOWER(NEW.genre_name);
    IF cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Genre name already exists (case-insensitive)';
    END IF;
END //
DELIMITER ;

-- ============================================
-- PART 6: SAMPLE DML QUERIES
-- ============================================

-- 1. Search songs by title (LIKE with wildcard)
SELECT t.track_title, a.artist_name, g.genre_name, ab.album_name
FROM tracks t
JOIN artists a  ON t.artist_id = a.artist_id
JOIN genres g   ON t.genre_id  = g.genre_id
JOIN albums ab  ON t.album_id  = ab.album_id
WHERE t.track_title LIKE '%search_term%'
ORDER BY t.track_title;

-- 2. Search songs by artist
SELECT t.track_title, a.artist_name, g.genre_name, ab.album_name
FROM tracks t
JOIN artists a  ON t.artist_id = a.artist_id
JOIN genres g   ON t.genre_id  = g.genre_id
JOIN albums ab  ON t.album_id  = ab.album_id
WHERE a.artist_name LIKE '%artist_name%'
ORDER BY t.track_title;

-- 3. Search songs by genre
SELECT t.track_title, a.artist_name, g.genre_name, ab.album_name
FROM tracks t
JOIN artists a  ON t.artist_id = a.artist_id
JOIN genres g   ON t.genre_id  = g.genre_id
JOIN albums ab  ON t.album_id  = ab.album_id
WHERE g.genre_name = 'Rock'
ORDER BY t.track_title;

-- 4. Get all songs in an album
SELECT t.track_title, a.artist_name, g.genre_name, t.duration
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
JOIN genres g  ON t.genre_id  = g.genre_id
WHERE t.album_id = 1
ORDER BY t.track_title;

-- 5. Get playlist with all tracks
SELECT p.playlist_name, t.track_title, a.artist_name, t.duration
FROM playlists p
JOIN playlist_tracks pt ON p.playlist_id  = pt.playlist_id
JOIN tracks t           ON pt.track_id    = t.track_id
JOIN artists a          ON t.artist_id    = a.artist_id
WHERE p.playlist_id = 1
ORDER BY pt.added_at;

-- 6. Get total duration of a playlist
SELECT p.playlist_name,
       SEC_TO_TIME(SUM(t.duration)) AS total_duration,
       COUNT(t.track_id) AS track_count
FROM playlists p
JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
JOIN tracks t           ON pt.track_id   = t.track_id
WHERE p.playlist_id = 1
GROUP BY p.playlist_id;

-- 7. Top genres by song count
SELECT g.genre_name, COUNT(t.track_id) AS song_count
FROM genres g
JOIN tracks t ON g.genre_id = t.genre_id
GROUP BY g.genre_id, g.genre_name
ORDER BY song_count DESC;

-- 8. Top artists by track count
SELECT a.artist_name, COUNT(t.track_id) AS track_count
FROM artists a
JOIN tracks t ON a.artist_id = t.artist_id
GROUP BY a.artist_id, a.artist_name
ORDER BY track_count DESC;

-- ============================================
-- PART 7: ADVANCED QUERIES
-- ============================================

-- 1. Subquery: Artists with more tracks than average
SELECT a.artist_name, COUNT(t.track_id) AS track_count
FROM artists a
JOIN tracks t ON a.artist_id = t.artist_id
GROUP BY a.artist_id, a.artist_name
HAVING COUNT(t.track_id) > (
    SELECT AVG(cnt) FROM (
        SELECT COUNT(track_id) AS cnt
        FROM tracks
        GROUP BY artist_id
    ) AS sub
)
ORDER BY track_count DESC;

-- 2. Window Function: Rank tracks by duration per genre
SELECT
    g.genre_name,
    t.track_title,
    t.duration,
    ROW_NUMBER() OVER (PARTITION BY g.genre_id ORDER BY t.duration DESC) AS rank_in_genre,
    RANK() OVER (ORDER BY t.duration DESC) AS overall_rank
FROM tracks t
JOIN genres g ON t.genre_id = g.genre_id;

-- 3. CTE: Artists with tracks in multiple genres
WITH artist_genres AS (
    SELECT
        a.artist_id,
        a.artist_name,
        COUNT(DISTINCT t.genre_id) AS genre_count
    FROM artists a
    JOIN tracks t ON a.artist_id = t.artist_id
    GROUP BY a.artist_id, a.artist_name
)
SELECT artist_name, genre_count
FROM artist_genres
WHERE genre_count > 1
ORDER BY genre_count DESC;

-- 4. CASE statement: Categorize tracks by duration
SELECT
    t.track_title,
    t.duration,
    CASE
        WHEN t.duration < 180  THEN 'Short (< 3 min)'
        WHEN t.duration < 300  THEN 'Medium (3-5 min)'
        WHEN t.duration < 600  THEN 'Long (5-10 min)'
        ELSE 'Epic (> 10 min)'
    END AS duration_category
FROM tracks t
ORDER BY t.duration;

-- 5. Correlated subquery: Tracks NOT in any playlist
SELECT t.track_title, a.artist_name
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
WHERE NOT EXISTS (
    SELECT 1 FROM playlist_tracks pt
    WHERE pt.track_id = t.track_id
);

-- 6. Self-join: Find albums by the same artist
SELECT
    a1.album_name AS album_1,
    a2.album_name AS album_2,
    ar.artist_name
FROM albums a1
JOIN albums a2  ON a1.artist_id = a2.artist_id AND a1.album_id < a2.album_id
JOIN artists ar ON a1.artist_id = ar.artist_id;

-- 7. HAVING: Genres with more than 3 songs
SELECT g.genre_name, COUNT(*) AS song_count
FROM genres g
JOIN tracks t ON g.genre_id = t.genre_id
GROUP BY g.genre_id, g.genre_name
HAVING COUNT(*) > 3
ORDER BY song_count DESC;

-- 8. Window Function: Running total of track durations per album
SELECT
    ab.album_name,
    t.track_title,
    t.duration,
    SUM(t.duration) OVER (
        PARTITION BY ab.album_id
        ORDER BY t.track_id
        ROWS UNBOUNDED PRECEDING
    ) AS running_total
FROM tracks t
JOIN albums ab ON t.album_id = ab.album_id;
