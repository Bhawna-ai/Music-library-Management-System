// Music Library Database Management (using localStorage)
// 4th Semester Project - Simple In-Memory Database using Browser Storage

class MusicDatabase {
    constructor() {
        this.storageKey = 'musicLibraryDB';
        this.initDatabase();
    }

    // Initialize database with empty or existing data
    initDatabase() {
        if (!localStorage.getItem(this.storageKey)) {
            this.data = {
                artists: [],
                genres: [],
                albums: [],
                tracks: [],
                playlists: [],
                playlistTracks: [],
                idCounters: {
                    artistId: 1,
                    genreId: 1,
                    albumId: 1,
                    trackId: 1,
                    playlistId: 1
                }
            };
            this.save();
        } else {
            this.data = JSON.parse(localStorage.getItem(this.storageKey));
        }
    }

    // Save data to localStorage
    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // Reset entire database
    reset() {
        localStorage.removeItem(this.storageKey);
        this.initDatabase();
    }

    // ==================== ARTIST OPERATIONS ====================
    
    addArtist(artistName, country = '', bio = '') {
        const newArtist = {
            artist_id: this.data.idCounters.artistId++,
            artist_name: artistName,
            country: country,
            bio: bio,
            created_at: new Date().toISOString()
        };
        this.data.artists.push(newArtist);
        this.save();
        return newArtist;
    }

    getArtists() {
        return this.data.artists;
    }

    getArtistById(id) {
        return this.data.artists.find(a => a.artist_id === id);
    }

    deleteArtist(id) {
        this.data.artists = this.data.artists.filter(a => a.artist_id !== id);
        // Cascade delete - remove albums and tracks of this artist
        this.data.albums = this.data.albums.filter(a => a.artist_id !== id);
        this.data.tracks = this.data.tracks.filter(t => t.artist_id !== id);
        this.save();
    }

    // ==================== GENRE OPERATIONS ====================

    addGenre(genreName, description = '') {
        // Check if genre already exists
        const existing = this.data.genres.find(g => g.genre_name === genreName);
        if (existing) {
            return existing;
        }

        const newGenre = {
            genre_id: this.data.idCounters.genreId++,
            genre_name: genreName,
            description: description
        };
        this.data.genres.push(newGenre);
        this.save();
        return newGenre;
    }

    getGenres() {
        return this.data.genres;
    }

    getGenreById(id) {
        return this.data.genres.find(g => g.genre_id === id);
    }

    // ==================== ALBUM OPERATIONS ====================

    addAlbum(albumName, artistId, releaseYear = null) {
        const newAlbum = {
            album_id: this.data.idCounters.albumId++,
            album_name: albumName,
            artist_id: artistId,
            release_year: releaseYear,
            created_at: new Date().toISOString()
        };
        this.data.albums.push(newAlbum);
        this.save();
        return newAlbum;
    }

    getAlbums() {
        return this.data.albums;
    }

    getAlbumById(id) {
        return this.data.albums.find(a => a.album_id === id);
    }

    getAlbumsByArtist(artistId) {
        return this.data.albums.filter(a => a.artist_id === artistId);
    }

    deleteAlbum(id) {
        this.data.albums = this.data.albums.filter(a => a.album_id !== id);
        // Cascade delete - remove tracks in this album
        this.data.tracks = this.data.tracks.filter(t => t.album_id !== id);
        this.save();
    }

    // ==================== TRACK OPERATIONS ====================

    addTrack(trackTitle, albumId, artistId, genreId, duration = 0, releaseDate = null) {
        const newTrack = {
            track_id: this.data.idCounters.trackId++,
            track_title: trackTitle,
            album_id: albumId,
            artist_id: artistId,
            genre_id: genreId,
            duration: duration,
            release_date: releaseDate,
            created_at: new Date().toISOString()
        };
        this.data.tracks.push(newTrack);
        this.save();
        return newTrack;
    }

    getTracks() {
        return this.data.tracks;
    }

    getTrackById(id) {
        return this.data.tracks.find(t => t.track_id === id);
    }

    getTracksByAlbum(albumId) {
        return this.data.tracks.filter(t => t.album_id === albumId);
    }

    getTracksByArtist(artistId) {
        return this.data.tracks.filter(t => t.artist_id === artistId);
    }

    getTracksByGenre(genreId) {
        return this.data.tracks.filter(t => t.genre_id === genreId);
    }

    deleteTrack(id) {
        this.data.tracks = this.data.tracks.filter(t => t.track_id !== id);
        // Cascade delete - remove from all playlists
        this.data.playlistTracks = this.data.playlistTracks.filter(pt => pt.track_id !== id);
        this.save();
    }

    // ==================== PLAYLIST OPERATIONS ====================

    addPlaylist(playlistName, description = '') {
        const newPlaylist = {
            playlist_id: this.data.idCounters.playlistId++,
            playlist_name: playlistName,
            description: description,
            created_at: new Date().toISOString()
        };
        this.data.playlists.push(newPlaylist);
        this.save();
        return newPlaylist;
    }

    getPlaylists() {
        return this.data.playlists;
    }

    getPlaylistById(id) {
        return this.data.playlists.find(p => p.playlist_id === id);
    }

    deletePlaylist(id) {
        this.data.playlists = this.data.playlists.filter(p => p.playlist_id !== id);
        // Cascade delete - remove all tracks from this playlist
        this.data.playlistTracks = this.data.playlistTracks.filter(pt => pt.playlist_id !== id);
        this.save();
    }

    addTrackToPlaylist(playlistId, trackId) {
        // Check if already exists
        const existing = this.data.playlistTracks.find(
            pt => pt.playlist_id === playlistId && pt.track_id === trackId
        );
        if (existing) {
            return existing;
        }

        const newPlaylistTrack = {
            id: this.data.playlistTracks.length + 1,
            playlist_id: playlistId,
            track_id: trackId,
            added_at: new Date().toISOString()
        };
        this.data.playlistTracks.push(newPlaylistTrack);
        this.save();
        return newPlaylistTrack;
    }

    getPlaylistTracks(playlistId) {
        const playlistTracks = this.data.playlistTracks.filter(pt => pt.playlist_id === playlistId);
        return playlistTracks.map(pt => this.getTrackById(pt.track_id)).filter(t => t);
    }

    removeTrackFromPlaylist(playlistId, trackId) {
        this.data.playlistTracks = this.data.playlistTracks.filter(
            pt => !(pt.playlist_id === playlistId && pt.track_id === trackId)
        );
        this.save();
    }

    getPlaylistTrackCount(playlistId) {
        return this.data.playlistTracks.filter(pt => pt.playlist_id === playlistId).length;
    }

    // ==================== SEARCH OPERATIONS ====================

    searchTracksByTitle(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.data.tracks.filter(t => 
            t.track_title.toLowerCase().includes(term)
        ).map(t => this.enrichTraackData(t));
    }

    searchTracksByArtist(artistName) {
        const term = artistName.toLowerCase();
        const artists = this.data.artists.filter(a => 
            a.artist_name.toLowerCase().includes(term)
        );
        
        let results = [];
        artists.forEach(artist => {
            const tracks = this.getTracksByArtist(artist.artist_id);
            results = results.concat(tracks.map(t => this.enrichTraackData(t)));
        });
        return results;
    }

    searchTracksByGenre(genreId) {
        return this.getTracksByGenre(genreId).map(t => this.enrichTraackData(t));
    }

    enrichTraackData(track) {
        return {
            ...track,
            artist_name: this.getArtistById(track.artist_id)?.artist_name || 'Unknown',
            album_name: this.getAlbumById(track.album_id)?.album_name || 'Unknown',
            genre_name: this.getGenreById(track.genre_id)?.genre_name || 'Unknown'
        };
    }

    // ==================== STATISTICS ====================

    getGenreStatistics() {
        const stats = [];
        const genreMap = {};

        this.data.tracks.forEach(track => {
            const genre = this.getGenreById(track.genre_id);
            if (genre) {
                if (!genreMap[genre.genre_id]) {
                    genreMap[genre.genre_id] = {
                        genre_name: genre.genre_name,
                        song_count: 0
                    };
                }
                genreMap[genre.genre_id].song_count++;
            }
        });

        Object.values(genreMap).forEach(stat => stats.push(stat));
        return stats.sort((a, b) => b.song_count - a.song_count);
    }

    getArtistStatistics() {
        const stats = [];
        const artistMap = {};

        this.data.tracks.forEach(track => {
            const artist = this.getArtistById(track.artist_id);
            if (artist) {
                if (!artistMap[artist.artist_id]) {
                    artistMap[artist.artist_id] = {
                        artist_name: artist.artist_name,
                        track_count: 0
                    };
                }
                artistMap[artist.artist_id].track_count++;
            }
        });

        Object.values(artistMap).forEach(stat => stats.push(stat));
        return stats.sort((a, b) => b.track_count - a.track_count);
    }

    // ==================== STATISTICS ====================

    getDashboardStats() {
        return {
            totalArtists: this.data.artists.length,
            totalTracks: this.data.tracks.length,
            totalAlbums: this.data.albums.length,
            totalPlaylists: this.data.playlists.length
        };
    }
}

// Global database instance
const db = new MusicDatabase();
