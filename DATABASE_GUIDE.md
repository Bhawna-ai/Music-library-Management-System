# Database Design & SQL Concepts Guide

## 📊 Understanding the Database Schema

This guide explains the database design used in the Music Library Management System, suitable for 4th semester CS students.

---

## 🎯 Database Design Principles

### 1. **Normalization**

The database follows **3rd Normal Form (3NF)**:

#### First Normal Form (1NF)
- ✅ All attributes contain atomic (indivisible) values
- ✅ No repeating groups or arrays within columns
- Example: `artist_name` is a single value, not an array

#### Second Normal Form (2NF)
- ✅ Must be in 1NF
- ✅ All non-key attributes fully depend on the primary key
- Example: `album_name` depends on `album_id`, not partially

#### Third Normal Form (3NF)
- ✅ Must be in 2NF
- ✅ No transitive dependencies (non-key attributes don't depend on other non-key attributes)
- Example: `genre_name` is in its own table, not duplicated in tracks

### 2. **Benefits of This Schema**
- ✅ **No Redundancy** - Data stored once
- ✅ **Data Integrity** - Foreign keys maintain relationships
- ✅ **Easy Updates** - Change once, applies everywhere
- ✅ **Query Efficiency** - Joins retrieve related data
- ✅ **Scalability** - Easy to add new features

---

## 📋 Table Structure Explanation

### **Table 1: artists**
Stores information about music artists

```sql
CREATE TABLE artists (
    artist_id INT PRIMARY KEY AUTO_INCREMENT,
    artist_name VARCHAR(100) NOT NULL UNIQUE,
    bio TEXT,
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Purpose |
|--------|------|---------|
| `artist_id` | INT | Unique identifier (auto-incremented) |
| `artist_name` | VARCHAR(100) | Artist's name (must be unique) |
| `bio` | TEXT | Biography or description |
| `country` | VARCHAR(50) | Country of origin |
| `created_at` | TIMESTAMP | When record was created |

**Example Data:**
```
artist_id | artist_name    | country | bio
1         | The Beatles    | UK      | Legendary British band
2         | Taylor Swift   | USA     | Pop music icon
3         | Miles Davis    | USA     | Jazz legend
```

---

### **Table 2: genres**
Music genres/categories

```sql
CREATE TABLE genres (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    genre_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);
```

| Column | Type | Purpose |
|--------|------|---------|
| `genre_id` | INT | Unique identifier |
| `genre_name` | VARCHAR(50) | Name of genre (unique) |
| `description` | TEXT | Genre description |

**Example Data:**
```
genre_id | genre_name | description
1        | Rock       | Electric guitars and drums
2        | Pop        | Catchy melodies and vocals
3        | Jazz       | Improvised instrumental music
```

---

### **Table 3: albums**
Album information linked to artists

```sql
CREATE TABLE albums (
    album_id INT PRIMARY KEY AUTO_INCREMENT,
    album_name VARCHAR(100) NOT NULL,
    artist_id INT NOT NULL,
    release_year YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE
);
```

**Key Concept: Foreign Key**
- `artist_id` is a Foreign Key from `artists` table
- Links albums to their artists
- `ON DELETE CASCADE` = if artist deleted, delete their albums too

**Example Data:**
```
album_id | album_name   | artist_id | release_year
1        | Abbey Road   | 1         | 1969
2        | Reputation   | 2         | 2017
3        | Kind of Blue | 3         | 1959
```

---

### **Table 4: tracks**
Individual songs with multiple relationships

```sql
CREATE TABLE tracks (
    track_id INT PRIMARY KEY AUTO_INCREMENT,
    track_title VARCHAR(100) NOT NULL,
    album_id INT NOT NULL,
    artist_id INT NOT NULL,
    genre_id INT NOT NULL,
    duration INT,  -- in seconds
    release_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE CASCADE
);
```

**Multiple Foreign Keys:**
- Connects to `albums` (which album it's in)
- Connects to `artists` (who performed it)
- Connects to `genres` (music category)

**Relationships:**
```
artists ──┐
          ├─→ tracks
albums ───┤
genres ───┘
```

**Example Data:**
```
track_id | track_title     | album_id | artist_id | genre_id | duration
1        | Come Together   | 1        | 1         | 1        | 259
2        | Delicate        | 2        | 2         | 2        | 232
3        | So What         | 3        | 3         | 3        | 567
```

---

### **Table 5: playlists**
User-created playlists

```sql
CREATE TABLE playlists (
    playlist_id INT PRIMARY KEY AUTO_INCREMENT,
    playlist_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Simple Table:**
- No foreign keys (independent)
- Contains playlist metadata

**Example Data:**
```
playlist_id | playlist_name  | description
1           | Rock Hits      | Best rock songs
2           | Pop Favorites  | Popular tracks
3           | Jazz Night     | Smooth jazz
```

---

### **Table 6: playlist_tracks (Junction Table)**
Connects playlists to tracks (Many-to-Many relationship)

```sql
CREATE TABLE playlist_tracks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    playlist_id INT NOT NULL,
    track_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE,
    UNIQUE KEY unique_playlist_track (playlist_id, track_id)
);
```

**Why Junction Table?**
- One playlist can have multiple tracks
- One track can be in multiple playlists
- Need a junction table to handle Many-to-Many

**Visual Example:**
```
Playlist "Rock Hits"
├── Track 1: Come Together
├── Track 3: Something
└── Track 5: Here Comes the Sun

Playlist "Oldies"
├── Track 1: Come Together
├── Track 2: Hey Jude
└── Track 4: Eleanor Rigby
```

**Data Structure:**
```
playlist_id | track_id | added_at
1           | 1        | 2024-01-15
1           | 3        | 2024-01-15
1           | 5        | 2024-01-15
2           | 1        | 2024-01-16
2           | 2        | 2024-01-16
```

---

## 🔄 Key Relationships

### 1-to-Many Relationships

**Artist → Albums:**
- 1 artist can have many albums
- 1 album belongs to 1 artist
- Implemented with FK in `albums` table

**Album → Tracks:**
- 1 album can have many tracks
- 1 track belongs to 1 album
- Implemented with FK in `tracks` table

**Genre → Tracks:**
- 1 genre can have many tracks
- 1 track belongs to 1 genre
- Implemented with FK in `tracks` table

### Many-to-Many Relationship

**Playlists ↔ Tracks:**
- 1 playlist can have many tracks
- 1 track can be in many playlists
- Implemented via `playlist_tracks` junction table

---

## 📊 Entity-Relationship Diagram (ERD)

```
┌─────────────┐
│   artists   │
├─────────────┤
│ artist_id PK│
│ artist_name │
│ bio         │
│ country     │
└─────────────┘
       │
       │ 1──→ ∞
       │
    ┌──────────────┐
    │   albums     │
    ├──────────────┤
    │ album_id  PK │
    │ album_name   │
    │ artist_id FK │
    │ release_year │
    └──────────────┘
       │
       │ 1──→ ∞
       │
┌─────────────────────┐         ┌──────────────┐
│     tracks          │         │   genres     │
├─────────────────────┤         ├──────────────┤
│ track_id       PK   │         │ genre_id  PK │
│ track_title         │         │ genre_name   │
│ album_id       FK   │────────→│ description  │
│ artist_id      FK   │    ∞/1  └──────────────┘
│ genre_id       FK   │
│ duration            │
└─────────────────────┘
       │
       │
       │  ∞──→ ∞ (Many-to-Many)
       │
┌────────────────────────┐
│ playlist_tracks (JT)   │
├────────────────────────┤
│ id                 PK  │
│ playlist_id        FK  │
│ track_id           FK  │
│ added_at               │
└────────────────────────┘
       ▲
       │ 1──→ ∞
       │
┌──────────────┐
│  playlists   │
├──────────────┤
│ playlist_id  │
│ name         │
│ description  │
└──────────────┘
```

---

## 🔍 Key Concepts

### Primary Key (PK)
- Uniquely identifies each record
- Cannot be NULL
- Example: `artist_id` uniquely identifies an artist

### Foreign Key (FK)
- References primary key in another table
- Maintains referential integrity
- Example: `album.artist_id` references `artists.artist_id`

### Candidate Key
- Could be a primary key but isn't selected
- Example: `artist_name` is unique (candidate key)

### UNIQUE Constraint
- Value can appear only once
- Ensures no duplicates
- Example: `artist_name UNIQUE` - no two artists with same name

### CONSTRAINTS

**NOT NULL:**
```sql
artist_name VARCHAR(100) NOT NULL
-- Cannot add artist without a name
```

**UNIQUE:**
```sql
artist_name VARCHAR(100) UNIQUE
-- No two artists can have same name
```

**FOREIGN KEY:**
```sql
FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
-- album.artist_id must exist in artists.artist_id
```

**DEFAULT:**
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- Automatically set to current time if not specified
```

---

## 💡 Important SQL Queries

### 1. **Retrieve Track with Artist and Album**
```sql
SELECT 
    t.track_title, 
    a.artist_name, 
    ab.album_name, 
    g.genre_name
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
JOIN albums ab ON t.album_id = ab.album_id
JOIN genres g ON t.genre_id = g.genre_id
WHERE t.track_id = 1;
```

**Explanation:**
- Uses JOINS to combine data from multiple tables
- Each JOIN connects related tables

### 2. **Get All Tracks in a Playlist**
```sql
SELECT 
    p.playlist_name, 
    t.track_title, 
    a.artist_name,
    t.duration
FROM playlists p
JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
JOIN tracks t ON pt.track_id = t.track_id
JOIN artists a ON t.artist_id = a.artist_id
WHERE p.playlist_id = 1;
```

**Key Point:**
- Uses junction table to connect playlists with tracks

### 3. **Count Songs per Genre**
```sql
SELECT 
    g.genre_name, 
    COUNT(t.track_id) AS song_count
FROM genres g
LEFT JOIN tracks t ON g.genre_id = t.genre_id
GROUP BY g.genre_id, g.genre_name
ORDER BY song_count DESC;
```

**Concepts:**
- **GROUP BY**: Aggregate data by genre
- **COUNT()**: Count songs
- **ORDER BY DESC**: Sort highest first

### 4. **Find Artists with Most Tracks**
```sql
SELECT 
    a.artist_name, 
    COUNT(t.track_id) AS track_count
FROM artists a
JOIN tracks t ON a.artist_id = t.artist_id
GROUP BY a.artist_id, a.artist_name
ORDER BY track_count DESC
LIMIT 10;
```

---

## 🛡️ Referential Integrity

### Foreign Key Constraints

**ON DELETE CASCADE:**
```sql
FOREIGN KEY (artist_id) REFERENCES artists(artist_id) 
ON DELETE CASCADE
```
- If artist deleted → all their albums and tracks deleted
- Automatic cleanup

**ON DELETE RESTRICT:**
```sql
FOREIGN KEY (artist_id) REFERENCES artists(artist_id) 
ON DELETE RESTRICT
```
- Cannot delete if child records exist
- Must delete children first

---

## 📈 Scaling the Database

### Adding New Features

#### 1. **Add Album Cover Images**
```sql
ALTER TABLE albums ADD cover_image_url VARCHAR(255);
```

#### 2. **Add User Reviews**
```sql
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    track_id INT NOT NULL,
    rating INT (1-5),
    comment TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id)
);
```

#### 3. **Add Play Statistics**
```sql
CREATE TABLE play_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    track_id INT NOT NULL,
    user_id INT,
    played_at TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id)
);
```

---

## ✅ Best Practices Demonstrated

1. **Normalization** - Eliminates redundancy
2. **Foreign Keys** - Maintains relationships
3. **Constraints** - Ensures data validity
4. **Indexes** - Improves query performance
5. **Naming Convention** - Clear table/column names
6. **Cascade Operations** - Maintains integrity
7. **Timestamps** - Tracks data changes
8. **Primary Keys** - Unique identifiers

---

## 🎓 Learning Exercises

1. **Write a query** to find all albums by Taylor Swift
2. **Create a query** to list songs not in any playlist
3. **Count** total duration of all songs
4. **Find** the genre with most songs
5. **Identify** artists with albums in multiple genres
6. **List** all unique genres
7. **Count** how many tracks are in each playlist
8. **Find** tracks added to playlists in last week

---

## 📚 Summary

The database design demonstrates:
- ✅ Proper normalization
- ✅ Appropriate use of relationships
- ✅ Referential integrity constraints
- ✅ Efficient data organization
- ✅ Scalable architecture
- ✅ Real-world database patterns

This is the foundation for understanding relational databases, a crucial skill for a 4th semester CS student!

