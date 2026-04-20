// Music Library Database Management (using localStorage)
// DBMS Capstone Project - In-Memory Database using Browser Storage
// Demonstrates: CRUD operations, relationships, cascade deletes, search, statistics

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
                users: [],
                favorites: [],
                playHistory: [],
                reviews: [],
                deletionLog: [],
                idCounters: {
                    artistId: 1,
                    genreId: 1,
                    albumId: 1,
                    trackId: 1,
                    playlistId: 1,
                    userId: 1,
                    reviewId: 1,
                    historyId: 1
                }
            };
            this.save();
        } else {
            this.data = JSON.parse(localStorage.getItem(this.storageKey));
            // Migration: add new tables if missing (for existing users)
            if (!this.data.users) this.data.users = [];
            if (!this.data.favorites) this.data.favorites = [];
            if (!this.data.playHistory) this.data.playHistory = [];
            if (!this.data.reviews) this.data.reviews = [];
            if (!this.data.deletionLog) this.data.deletionLog = [];
            if (!this.data.idCounters.userId) this.data.idCounters.userId = 1;
            if (!this.data.idCounters.reviewId) this.data.idCounters.reviewId = 1;
            if (!this.data.idCounters.historyId) this.data.idCounters.historyId = 1;
            this.save();
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
        // Check for duplicate name
        const exists = this.data.artists.find(
            a => a.artist_name.toLowerCase() === artistName.toLowerCase()
        );
        if (exists) {
            return { error: 'Artist with this name already exists' };
        }

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

    updateArtist(id, updates) {
        const artist = this.data.artists.find(a => a.artist_id === id);
        if (!artist) return null;
        if (updates.artist_name !== undefined) artist.artist_name = updates.artist_name;
        if (updates.country !== undefined) artist.country = updates.country;
        if (updates.bio !== undefined) artist.bio = updates.bio;
        this.save();
        return artist;
    }

    deleteArtist(id) {
        // Trigger: log deletion
        const artist = this.getArtistById(id);
        if (artist) {
            this.data.deletionLog.push({
                type: 'artist',
                data: { ...artist },
                deleted_at: new Date().toISOString()
            });
        }

        this.data.artists = this.data.artists.filter(a => a.artist_id !== id);
        // Cascade delete - remove albums and tracks of this artist
        const albumIds = this.data.albums.filter(a => a.artist_id === id).map(a => a.album_id);
        this.data.albums = this.data.albums.filter(a => a.artist_id !== id);
        const trackIds = this.data.tracks.filter(t => t.artist_id === id).map(t => t.track_id);
        this.data.tracks = this.data.tracks.filter(t => t.artist_id !== id);
        // Cascade to playlist_tracks
        this.data.playlistTracks = this.data.playlistTracks.filter(
            pt => !trackIds.includes(pt.track_id)
        );
        this.save();
    }

    // ==================== GENRE OPERATIONS ====================

    addGenre(genreName, description = '') {
        // Check if genre already exists
        const existing = this.data.genres.find(
            g => g.genre_name.toLowerCase() === genreName.toLowerCase()
        );
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

    updateAlbum(id, updates) {
        const album = this.data.albums.find(a => a.album_id === id);
        if (!album) return null;
        if (updates.album_name !== undefined) album.album_name = updates.album_name;
        if (updates.artist_id !== undefined) album.artist_id = updates.artist_id;
        if (updates.release_year !== undefined) album.release_year = updates.release_year;
        this.save();
        return album;
    }

    deleteAlbum(id) {
        const album = this.getAlbumById(id);
        if (album) {
            this.data.deletionLog.push({
                type: 'album',
                data: { ...album },
                deleted_at: new Date().toISOString()
            });
        }

        this.data.albums = this.data.albums.filter(a => a.album_id !== id);
        // Cascade delete tracks
        const trackIds = this.data.tracks.filter(t => t.album_id === id).map(t => t.track_id);
        this.data.tracks = this.data.tracks.filter(t => t.album_id !== id);
        this.data.playlistTracks = this.data.playlistTracks.filter(
            pt => !trackIds.includes(pt.track_id)
        );
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

    updateTrack(id, updates) {
        const track = this.data.tracks.find(t => t.track_id === id);
        if (!track) return null;
        if (updates.track_title !== undefined) track.track_title = updates.track_title;
        if (updates.album_id !== undefined) track.album_id = updates.album_id;
        if (updates.artist_id !== undefined) track.artist_id = updates.artist_id;
        if (updates.genre_id !== undefined) track.genre_id = updates.genre_id;
        if (updates.duration !== undefined) track.duration = updates.duration;
        if (updates.release_date !== undefined) track.release_date = updates.release_date;
        this.save();
        return track;
    }

    deleteTrack(id) {
        const track = this.getTrackById(id);
        if (track) {
            this.data.deletionLog.push({
                type: 'track',
                data: { ...track },
                deleted_at: new Date().toISOString()
            });
        }

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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
        this.data.playlistTracks = this.data.playlistTracks.filter(pt => pt.playlist_id !== id);
        this.save();
    }

    addTrackToPlaylist(playlistId, trackId) {
        // Check if already exists (UNIQUE constraint simulation)
        const existing = this.data.playlistTracks.find(
            pt => pt.playlist_id === playlistId && pt.track_id === trackId
        );
        if (existing) {
            return { error: 'Track already in playlist' };
        }

        const newPlaylistTrack = {
            id: this.data.playlistTracks.length + 1,
            playlist_id: playlistId,
            track_id: trackId,
            added_at: new Date().toISOString()
        };
        this.data.playlistTracks.push(newPlaylistTrack);

        // Trigger: update playlist modified timestamp
        const playlist = this.getPlaylistById(playlistId);
        if (playlist) {
            playlist.updated_at = new Date().toISOString();
        }

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
        // Trigger: update playlist modified timestamp
        const playlist = this.getPlaylistById(playlistId);
        if (playlist) {
            playlist.updated_at = new Date().toISOString();
        }
        this.save();
    }

    getPlaylistTrackCount(playlistId) {
        return this.data.playlistTracks.filter(pt => pt.playlist_id === playlistId).length;
    }

    // Get total duration of a playlist
    getPlaylistDuration(playlistId) {
        const tracks = this.getPlaylistTracks(playlistId);
        return tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    }

    // ==================== USER OPERATIONS ====================

    addUser(username, email) {
        const newUser = {
            user_id: this.data.idCounters.userId++,
            username: username,
            email: email,
            created_at: new Date().toISOString()
        };
        this.data.users.push(newUser);
        this.save();
        return newUser;
    }

    // ==================== FAVORITES OPERATIONS ====================

    addFavorite(userId, trackId) {
        const existing = this.data.favorites.find(
            f => f.user_id === userId && f.track_id === trackId
        );
        if (existing) return existing;

        const fav = {
            user_id: userId,
            track_id: trackId,
            favorited_at: new Date().toISOString()
        };
        this.data.favorites.push(fav);
        this.save();
        return fav;
    }

    // ==================== PLAY HISTORY ====================

    addPlayHistory(userId, trackId) {
        const entry = {
            history_id: this.data.idCounters.historyId++,
            user_id: userId,
            track_id: trackId,
            played_at: new Date().toISOString()
        };
        this.data.playHistory.push(entry);
        this.save();
        return entry;
    }

    // ==================== REVIEWS ====================

    addReview(trackId, rating, comment = '') {
        const review = {
            review_id: this.data.idCounters.reviewId++,
            track_id: trackId,
            rating: Math.min(5, Math.max(1, rating)),
            comment: comment,
            created_at: new Date().toISOString()
        };
        this.data.reviews.push(review);
        this.save();
        return review;
    }

    getReviewsByTrack(trackId) {
        return this.data.reviews.filter(r => r.track_id === trackId);
    }

    getAverageRating(trackId) {
        const reviews = this.getReviewsByTrack(trackId);
        if (reviews.length === 0) return 0;
        return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }

    // ==================== SEARCH OPERATIONS ====================

    searchTracksByTitle(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.data.tracks.filter(t =>
            t.track_title.toLowerCase().includes(term)
        ).map(t => this.enrichTrackData(t));
    }

    searchTracksByArtist(artistName) {
        const term = artistName.toLowerCase();
        const artists = this.data.artists.filter(a =>
            a.artist_name.toLowerCase().includes(term)
        );

        let results = [];
        artists.forEach(artist => {
            const tracks = this.getTracksByArtist(artist.artist_id);
            results = results.concat(tracks.map(t => this.enrichTrackData(t)));
        });
        return results;
    }

    searchTracksByGenre(genreId) {
        return this.getTracksByGenre(genreId).map(t => this.enrichTrackData(t));
    }

    // Global search across titles, artists, albums
    globalSearch(term) {
        const t = term.toLowerCase();
        const results = [];
        const seen = new Set();

        this.data.tracks.forEach(track => {
            if (seen.has(track.track_id)) return;
            const artist = this.getArtistById(track.artist_id);
            const album = this.getAlbumById(track.album_id);

            if (
                track.track_title.toLowerCase().includes(t) ||
                (artist && artist.artist_name.toLowerCase().includes(t)) ||
                (album && album.album_name.toLowerCase().includes(t))
            ) {
                seen.add(track.track_id);
                results.push(this.enrichTrackData(track));
            }
        });

        return results;
    }

    // Fixed typo: enrichTraackData → enrichTrackData
    enrichTrackData(track) {
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
                        song_count: 0,
                        total_duration: 0
                    };
                }
                genreMap[genre.genre_id].song_count++;
                genreMap[genre.genre_id].total_duration += (track.duration || 0);
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
                        track_count: 0,
                        album_count: 0,
                        total_duration: 0
                    };
                }
                artistMap[artist.artist_id].track_count++;
                artistMap[artist.artist_id].total_duration += (track.duration || 0);
            }
        });

        // Count albums per artist
        this.data.albums.forEach(album => {
            if (artistMap[album.artist_id]) {
                artistMap[album.artist_id].album_count++;
            }
        });

        Object.values(artistMap).forEach(stat => stats.push(stat));
        return stats.sort((a, b) => b.track_count - a.track_count);
    }

    // ==================== DASHBOARD STATS ====================

    getDashboardStats() {
        return {
            totalArtists: this.data.artists.length,
            totalTracks: this.data.tracks.length,
            totalAlbums: this.data.albums.length,
            totalPlaylists: this.data.playlists.length
        };
    }

    // ==================== VIEW SIMULATIONS ====================

    // Simulates: CREATE VIEW track_details_view
    getTrackDetailsView() {
        return this.data.tracks.map(t => this.enrichTrackData(t));
    }

    // Simulates: CREATE VIEW playlist_summary_view
    getPlaylistSummaryView() {
        return this.data.playlists.map(p => ({
            ...p,
            track_count: this.getPlaylistTrackCount(p.playlist_id),
            total_duration: this.getPlaylistDuration(p.playlist_id)
        }));
    }

    // Simulates: CREATE VIEW artist_stats_view
    getArtistStatsView() {
        return this.data.artists.map(a => {
            const tracks = this.getTracksByArtist(a.artist_id);
            const albums = this.getAlbumsByArtist(a.artist_id);
            const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
            return {
                ...a,
                album_count: albums.length,
                track_count: tracks.length,
                total_duration: totalDuration,
                avg_duration: tracks.length > 0 ? Math.round(totalDuration / tracks.length) : 0
            };
        });
    }
}

// Global database instance
const db = new MusicDatabase();
