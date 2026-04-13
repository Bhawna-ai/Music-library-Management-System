# Music Library Management System - Quick Start Guide

## 🚀 Quick Start (2 Minutes)

### Step 1: Open the Application
Simply double-click `index.html` or open it in your browser:
```
File > Open > music-library-system/index.html
```

### Step 2: Load Sample Data
1. Click on the **Dashboard** tab
2. Click the **"Load Sample Data"** button
3. You'll see sample artists, albums, tracks, and playlists

### Step 3: Explore the System
- **Dashboard** - View statistics and manage database
- **Artists** - Add/delete artists (The Beatles, Taylor Swift, etc.)
- **Tracks** - View all songs in the library
- **Albums** - Browse albums by artist
- **Playlists** - Create playlists and add tracks
- **Search** - Find songs and view statistics

---

## 📋 Common Tasks

### Add a New Artist
1. Go to **Artists** tab
2. Enter artist name, country, and bio
3. Click **"Add Artist"**
4. New artist appears in the table

### Create an Album
1. Go to **Albums** tab
2. Enter album name
3. Select an artist from dropdown
4. Enter release year (optional)
5. Click **"Add Album"**

### Add a Track
1. Go to **Tracks** tab
2. Fill in all fields:
   - Track title (required)
   - Select artist
   - Select album
   - Select genre
   - Duration in seconds (optional)
   - Release date (optional)
3. Click **"Add Track"**

**Note**: You need to create artists, genres, and albums first!

### Create and Manage Playlists
1. Go to **Playlists** tab
2. Enter playlist name and description
3. Click **"Create Playlist"**
4. To add tracks:
   - Select playlist name
   - Select track from dropdown
   - Click **"Add to Playlist"**
5. Click **"View"** to see playlist contents
6. Click **"Remove"** to remove tracks from playlist

### Search for Music
1. Go to **Search** tab
2. Choose search method:
   - **By Title**: Enter song name (e.g., "Come Together")
   - **By Artist**: Enter artist name (e.g., "Taylor Swift")
   - **By Genre**: Select genre from dropdown
3. Results appear in a table below

### View Statistics
1. Go to **Search** tab
2. Click **"Show Statistics"** button
3. See genre and artist statistics

---

## 🗂️ Project Files Explained

```
music-library-system/
│
├── 📄 index.html
│   └── Main HTML file - the interface you see
│       Contains all forms, tables, and structure
│
├── 📂 css/
│   └── 🎨 style.css
│       Colors, fonts, layouts, responsive design
│       Gradients, animations, button styles
│
├── 📂 js/
│   ├── 🗄️ database.js
│   │   └── Database class manages all data
│   │       - Add/delete/search records
│   │       - Save to localStorage
│   │       - Handle relationships
│   │
│   └── ⚙️ main.js
│       └── Application logic
│           - Handle button clicks
│           - Update tables
│           - Populate dropdowns
│
├── 📂 database/
│   └── 📋 schema.sql
│       └── Reference SQL schema (educational)
│           - Table definitions with foreign keys
│           - Example queries
│
└── 📖 README.md
    └── Full project documentation
        Features, architecture, learning outcomes
```

---

## 💾 How Data is Saved

Data is stored in your **browser's localStorage** automatically:
- No server needed
- Data persists even if you close the browser
- Shared for all tabs of the same website
- Limited to ~5-10MB per website

**To check stored data:**
1. Open Developer Tools (F12)
2. Go to **Storage** tab
3. Click **Local Storage**
4. Look for `musicLibraryDB` key
5. You can see all data as JSON

---

## 🔄 CRUD Operations Overview

All features follow CRUD pattern:

| Operation | Action | Where |
|-----------|--------|-------|
| **Create** | Add new record | Form at top of each section |
| **Read** | View records | Table below form |
| **Update** | Modify record | Not directly; delete and recreate |
| **Delete** | Remove record | Delete button in table |

---

## ⚠️ Important Notes

### Before Adding Tracks:
You MUST create:
1. ✅ An **Artist**
2. ✅ An **Album** (for that artist)
3. ✅ A **Genre**

Then you can add tracks and playlists.

### Cascade Delete:
- Delete Artist → Auto-deletes their albums & tracks
- Delete Album → Auto-deletes its tracks
- Delete Track → Auto-removes from playlists

### Data Validation:
- Required fields show error if empty
- Dropdown shows "Select..." until you choose
- Duration must be a number

---

## 🔧 Troubleshooting

### "No data appears in table"
→ Check if you've added records
→ Click "Load Sample Data" button

### "Dropdowns are empty"
→ You need to add Artists/Genres/Albums first
→ Or load sample data

### "My changes disappeared"
→ Check browser settings (JavaScript/Storage disabled?)
→ Try clearing browser cache and reloading

### "Button not working"
→ Open Console (F12) and check for errors
→ Make sure all required fields are filled

---

## 📚 Learning Concepts

This project teaches:

1. **Database Design** - Tables, relationships, keys
2. **CRUD Operations** - Create, Read, Update, Delete
3. **Search Queries** - Find data by different criteria
4. **Data Structure** - Objects, arrays, JSON
5. **Web Development** - HTML forms, JavaScript events
6. **UI/UX** - Forms, tables, navigation
7. **Data Persistence** - Browser storage
8. **Responsive Design** - Mobile-friendly interface

---

## 🎯 Exercises

Try these tasks to practice:

1. **Basic CRUD**: Add 5 new artists and 10 tracks
2. **Relationships**: Create albums for multiple artists with tracks
3. **Playlists**: Create 3 themed playlists and add 5+ tracks each
4. **Search**: Search for songs in different ways
5. **Statistics**: Check which genre has most songs
6. **Cleanup**: Delete some artists and observe cascade effect
7. **Reset**: Use "Reset Database" and reload sample data

---

## ⌨️ Keyboard Shortcuts

- **Tab** - Move between form fields
- **Enter** - Submit form (when in form field)
- **F12** - Open Developer Tools

---

## 📝 Sample Queries (in database.js)

```javascript
// Get all songs by an artist
db.searchTracksByArtist('Taylor Swift')

// Get all songs in a genre
db.searchTracksByGenre(2) // where 2 is genre_id

// Get tracks in a playlist
db.getPlaylistTracks(1) // where 1 is playlist_id

// Get statistics
db.getGenreStatistics()
db.getArtistStatistics()
```

---

## 🎓 Next Steps

1. **Understand the Code**
   - Open `main.js` and `database.js`
   - Read through comments
   - Understand functions

2. **Modify It**
   - Add new fields (e.g., artist image URL)
   - Customize colors in `style.css`
   - Add new search types

3. **Extend It**
   - Add ratings/reviews
   - Add user preferences
   - Create advanced reports

4. **Deploy It**
   - Upload to GitHub Pages
   - Deploy to free hosting
   - Share with others

---

## 📞 Help

If something doesn't work:
1. Check browser console (F12 > Console)
2. Look for red error messages
3. Check if JavaScript is enabled
4. Try reloading the page
5. Clear localStorage and reset database

---

## 🎉 You're Ready!

Open `index.html` in your browser and start using the Music Library Management System!

Questions? Read the full **README.md** for detailed documentation.

---

**Enjoy exploring the music library system!** 🎵
