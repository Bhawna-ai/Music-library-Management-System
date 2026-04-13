// Main application logic
// 4th Semester CS Project - Music Library Management System

// ==================== SECTION NAVIGATION ====================

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Remove active class from all nav buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');

    // Refresh data for the section
    if (sectionId === 'artists') {
        displayArtists();
    } else if (sectionId === 'albums') {
        displayAlbums();
        populateArtistDropdowns();
    } else if (sectionId === 'tracks') {
        displayTracks();
        populateAllDropdowns();
    } else if (sectionId === 'playlists') {
        displayPlaylists();
        populatePlaylistDropdowns();
    } else if (sectionId === 'dashboard') {
        updateDashboard();
    }
}

// ==================== DASHBOARD ====================

function updateDashboard() {
    const stats = db.getDashboardStats();
    document.getElementById('totalArtists').textContent = stats.totalArtists;
    document.getElementById('totalTracks').textContent = stats.totalTracks;
    document.getElementById('totalAlbums').textContent = stats.totalAlbums;
    document.getElementById('totalPlaylists').textContent = stats.totalPlaylists;
}

function resetDatabase() {
    if (confirm('Are you sure you want to reset the entire database? This cannot be undone!')) {
        db.reset();
        updateDashboard();
        alert('Database has been reset!');
    }
}

function loadSampleData() {
    // Check if data already exists
    if (db.data.artists.length > 0) {
        alert('Database already has data. Please reset first if you want to load sample data.');
        return;
    }

    // Add genres
    const genreRock = db.addGenre('Rock');
    const genrePop = db.addGenre('Pop');
    const genreJazz = db.addGenre('Jazz');
    const genreClassical = db.addGenre('Classical');
    const genreHipHop = db.addGenre('Hip-Hop');

    // Add artists
    const artistBeatles = db.addArtist('The Beatles', 'United Kingdom', 'Legendary British rock band');
    const artistTaylor = db.addArtist('Taylor Swift', 'United States', 'Pop music icon');
    const artistMiles = db.addArtist('Miles Davis', 'United States', 'Jazz legend');
    const artistMozart = db.addArtist('Wolfgang Mozart', 'Austria', 'Classical music composer');
    const artistDrake = db.addArtist('Drake', 'Canada', 'Hip-hop artist');

    // Add albums
    const albumAbbey = db.addAlbum('Abbey Road', artistBeatles.artist_id, 1969);
    const albumReputation = db.addAlbum('Reputation', artistTaylor.artist_id, 2017);
    const albumKind = db.addAlbum('Kind of Blue', artistMiles.artist_id, 1959);
    const albumRequiem = db.addAlbum('Requiem', artistMozart.artist_id, 1791);
    const albumScorpion = db.addAlbum('Scorpion', artistDrake.artist_id, 2018);

    // Add tracks
    db.addTrack('Come Together', albumAbbey.album_id, artistBeatles.artist_id, genreRock.genre_id, 259, '1969-09-26');
    db.addTrack('Something', albumAbbey.album_id, artistBeatles.artist_id, genreRock.genre_id, 183, '1969-09-26');
    db.addTrack('Here Comes the Sun', albumAbbey.album_id, artistBeatles.artist_id, genreRock.genre_id, 185, '1969-09-26');
    
    db.addTrack('Look What You Made Me Do', albumReputation.album_id, artistTaylor.artist_id, genrePop.genre_id, 211, '2017-08-11');
    db.addTrack('Delicate', albumReputation.album_id, artistTaylor.artist_id, genrePop.genre_id, 232, '2017-12-08');
    db.addTrack('Getaway Car', albumReputation.album_id, artistTaylor.artist_id, genrePop.genre_id, 241, '2017-08-11');
    
    db.addTrack('So What', albumKind.album_id, artistMiles.artist_id, genreJazz.genre_id, 567, '1959-03-02');
    db.addTrack('Freddie Freeloader', albumKind.album_id, artistMiles.artist_id, genreJazz.genre_id, 558, '1959-03-02');
    db.addTrack('Blue in Green', albumKind.album_id, artistMiles.artist_id, genreJazz.genre_id, 481, '1959-03-02');
    
    db.addTrack('Lacrimosa', albumRequiem.album_id, artistMozart.artist_id, genreClassical.genre_id, 602, '1791-01-01');
    db.addTrack('Dies Irae', albumRequiem.album_id, artistMozart.artist_id, genreClassical.genre_id, 720, '1791-01-01');
    
    db.addTrack('In My Feelings', albumScorpion.album_id, artistDrake.artist_id, genreHipHop.genre_id, 226, '2018-06-29');
    db.addTrack('Hotline Bling', albumScorpion.album_id, artistDrake.artist_id, genreHipHop.genre_id, 207, '2018-06-29');

    // Create playlists
    const playlistRock = db.addPlaylist('My Rock Hits', 'Best rock songs ever');
    const playlistPop = db.addPlaylist('Pop Favorites', 'Popular pop tracks');
    const playlistJazz = db.addPlaylist('Jazz Night', 'Smooth jazz for relaxation');

    // Add tracks to playlists
    const allTracks = db.getTracks();
    allTracks.forEach(track => {
        if (track.genre_id === genreRock.genre_id) {
            db.addTrackToPlaylist(playlistRock.playlist_id, track.track_id);
        }
        if (track.genre_id === genrePop.genre_id) {
            db.addTrackToPlaylist(playlistPop.playlist_id, track.track_id);
        }
        if (track.genre_id === genreJazz.genre_id) {
            db.addTrackToPlaylist(playlistJazz.playlist_id, track.track_id);
        }
    });

    updateDashboard();
    alert('Sample data loaded successfully!');
}

// ==================== ARTIST MANAGEMENT ====================

function addArtist(event) {
    event.preventDefault();
    const name = document.getElementById('artistName').value;
    const country = document.getElementById('artistCountry').value;
    const bio = document.getElementById('artistBio').value;

    if (name) {
        db.addArtist(name, country, bio);
        document.getElementById('artistForm').reset();
        displayArtists();
        populateArtistDropdowns();
        alert('Artist added successfully!');
    }
}

function displayArtists() {
    const artists = db.getArtists();
    const tbody = document.querySelector('#artistsTable tbody');
    tbody.innerHTML = '';

    if (artists.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#a0aec0;">No artists found</td></tr>';
        return;
    }

    artists.forEach(artist => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${artist.artist_id}</td>
            <td>${artist.artist_name}</td>
            <td>${artist.country || '-'}</td>
            <td>${artist.bio ? artist.bio.substring(0, 50) + '...' : '-'}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteArtist(${artist.artist_id})">Delete</button>
            </td>
        `;
    });
}

function deleteArtist(id) {
    if (confirm('Delete this artist and all associated albums/tracks?')) {
        db.deleteArtist(id);
        displayArtists();
        populateArtistDropdowns();
        alert('Artist deleted!');
    }
}

// ==================== ALBUM MANAGEMENT ====================

function addAlbum(event) {
    event.preventDefault();
    const name = document.getElementById('albumName').value;
    const artistId = parseInt(document.getElementById('albumArtist').value);
    const year = document.getElementById('albumYear').value;

    if (name && artistId) {
        db.addAlbum(name, artistId, year || null);
        document.getElementById('albumForm').reset();
        displayAlbums();
        populateAllDropdowns();
        alert('Album added successfully!');
    }
}

function displayAlbums() {
    const albums = db.getAlbums();
    const tbody = document.querySelector('#albumsTable tbody');
    tbody.innerHTML = '';

    if (albums.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#a0aec0;">No albums found</td></tr>';
        return;
    }

    albums.forEach(album => {
        const artist = db.getArtistById(album.artist_id);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${album.album_id}</td>
            <td>${album.album_name}</td>
            <td>${artist ? artist.artist_name : 'Unknown'}</td>
            <td>${album.release_year || '-'}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteAlbum(${album.album_id})">Delete</button>
            </td>
        `;
    });
}

function deleteAlbum(id) {
    if (confirm('Delete this album and all its tracks?')) {
        db.deleteAlbum(id);
        displayAlbums();
        populateAllDropdowns();
        alert('Album deleted!');
    }
}

// ==================== TRACK MANAGEMENT ====================

function addTrack(event) {
    event.preventDefault();
    const title = document.getElementById('trackTitle').value;
    const artistId = parseInt(document.getElementById('trackArtist').value);
    const albumId = parseInt(document.getElementById('trackAlbum').value);
    const genreId = parseInt(document.getElementById('trackGenre').value);
    const duration = parseInt(document.getElementById('trackDuration').value) || 0;
    const releaseDate = document.getElementById('trackReleaseDate').value || null;

    if (title && artistId && albumId && genreId) {
        db.addTrack(title, albumId, artistId, genreId, duration, releaseDate);
        document.getElementById('trackForm').reset();
        displayTracks();
        populatePlaylistDropdowns();
        alert('Track added successfully!');
    }
}

function displayTracks() {
    const tracks = db.getTracks();
    const tbody = document.querySelector('#tracksTable tbody');
    tbody.innerHTML = '';

    if (tracks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#a0aec0;">No tracks found</td></tr>';
        return;
    }

    tracks.forEach(track => {
        const artist = db.getArtistById(track.artist_id);
        const album = db.getAlbumById(track.album_id);
        const genre = db.getGenreById(track.genre_id);
        const duration = formatDuration(track.duration);

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${track.track_id}</td>
            <td>${track.track_title}</td>
            <td>${artist ? artist.artist_name : 'Unknown'}</td>
            <td>${album ? album.album_name : 'Unknown'}</td>
            <td>${genre ? genre.genre_name : 'Unknown'}</td>
            <td>${duration}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteTrack(${track.track_id})">Delete</button>
            </td>
        `;
    });
}

function deleteTrack(id) {
    if (confirm('Delete this track from all playlists?')) {
        db.deleteTrack(id);
        displayTracks();
        populatePlaylistDropdowns();
        alert('Track deleted!');
    }
}

// ==================== PLAYLIST MANAGEMENT ====================

function addPlaylist(event) {
    event.preventDefault();
    const name = document.getElementById('playlistName').value;
    const desc = document.getElementById('playlistDesc').value;

    if (name) {
        db.addPlaylist(name, desc);
        document.getElementById('playlistForm').reset();
        displayPlaylists();
        populatePlaylistDropdowns();
        alert('Playlist created successfully!');
    }
}

function displayPlaylists() {
    const playlists = db.getPlaylists();
    const tbody = document.querySelector('#playlistsTable tbody');
    tbody.innerHTML = '';

    if (playlists.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#a0aec0;">No playlists found</td></tr>';
        return;
    }

    playlists.forEach(playlist => {
        const trackCount = db.getPlaylistTrackCount(playlist.playlist_id);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${playlist.playlist_id}</td>
            <td>${playlist.playlist_name}</td>
            <td>${playlist.description || '-'}</td>
            <td>${trackCount}</td>
            <td>
                <button class="btn btn-success" onclick="showPlaylistDetails(${playlist.playlist_id})">View</button>
                <button class="btn btn-danger" onclick="deletePlaylist(${playlist.playlist_id})">Delete</button>
            </td>
        `;
    });
}

function deletePlaylist(id) {
    if (confirm('Delete this playlist?')) {
        db.deletePlaylist(id);
        displayPlaylists();
        populatePlaylistDropdowns();
        alert('Playlist deleted!');
    }
}

function addTrackToPlaylist(event) {
    event.preventDefault();
    const playlistId = parseInt(document.getElementById('selectPlaylist').value);
    const trackId = parseInt(document.getElementById('selectTrack').value);

    if (playlistId && trackId) {
        db.addTrackToPlaylist(playlistId, trackId);
        document.getElementById('addToPlaylistForm').reset();
        populatePlaylistDropdowns();
        alert('Track added to playlist!');
    }
}

function showPlaylistDetails(playlistId) {
    const playlist = db.getPlaylistById(playlistId);
    const tracks = db.getPlaylistTracks(playlistId);
    const container = document.getElementById('playlistDetailsContainer');
    const tbody = document.querySelector('#playlistDetailsTable tbody');

    document.getElementById('playlistDetailsTitle').textContent = `Playlist: ${playlist.playlist_name}`;

    tbody.innerHTML = '';

    if (tracks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#a0aec0;">No tracks in this playlist</td></tr>';
    } else {
        tracks.forEach(track => {
            const artist = db.getArtistById(track.artist_id);
            const duration = formatDuration(track.duration);
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${track.track_title}</td>
                <td>${artist ? artist.artist_name : 'Unknown'}</td>
                <td>${duration}</td>
                <td>
                    <button class="btn btn-danger" onclick="removeFromPlaylist(${playlistId}, ${track.track_id})">Remove</button>
                </td>
            `;
        });
    }

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
}

function removeFromPlaylist(playlistId, trackId) {
    db.removeTrackFromPlaylist(playlistId, trackId);
    showPlaylistDetails(playlistId);
}

// ==================== SEARCH OPERATIONS ====================

function searchByTitle() {
    const searchTerm = document.getElementById('searchTitle').value;
    const resultsDiv = document.getElementById('searchTitleResults');

    if (!searchTerm) {
        resultsDiv.innerHTML = '<p class="empty">Please enter a search term</p>';
        return;
    }

    const results = db.searchTracksByTitle(searchTerm);

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="empty">No tracks found matching your search</p>';
        return;
    }

    let html = '<table><thead><tr><th>Title</th><th>Artist</th><th>Album</th><th>Genre</th><th>Duration</th></tr></thead><tbody>';
    results.forEach(track => {
        html += `<tr>
            <td>${track.track_title}</td>
            <td>${track.artist_name}</td>
            <td>${track.album_name}</td>
            <td>${track.genre_name}</td>
            <td>${formatDuration(track.duration)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

function searchByArtist() {
    const searchTerm = document.getElementById('searchArtist').value;
    const resultsDiv = document.getElementById('searchArtistResults');

    if (!searchTerm) {
        resultsDiv.innerHTML = '<p class="empty">Please enter an artist name</p>';
        return;
    }

    const results = db.searchTracksByArtist(searchTerm);

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="empty">No tracks found for this artist</p>';
        return;
    }

    let html = '<table><thead><tr><th>Title</th><th>Artist</th><th>Album</th><th>Genre</th><th>Duration</th></tr></thead><tbody>';
    results.forEach(track => {
        html += `<tr>
            <td>${track.track_title}</td>
            <td>${track.artist_name}</td>
            <td>${track.album_name}</td>
            <td>${track.genre_name}</td>
            <td>${formatDuration(track.duration)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

function searchByGenre() {
    const genreId = parseInt(document.getElementById('searchGenre').value);
    const resultsDiv = document.getElementById('searchGenreResults');

    if (!genreId) {
        resultsDiv.innerHTML = '<p class="empty">Please select a genre</p>';
        return;
    }

    const results = db.searchTracksByGenre(genreId);

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="empty">No tracks found in this genre</p>';
        return;
    }

    let html = '<table><thead><tr><th>Title</th><th>Artist</th><th>Album</th><th>Duration</th></tr></thead><tbody>';
    results.forEach(track => {
        html += `<tr>
            <td>${track.track_title}</td>
            <td>${track.artist_name}</td>
            <td>${track.album_name}</td>
            <td>${formatDuration(track.duration)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

function showGenreStats() {
    const stats = db.getGenreStatistics();
    const resultsDiv = document.getElementById('genreStatsResults');

    if (stats.length === 0) {
        resultsDiv.innerHTML = '<p class="empty">No statistics available</p>';
        return;
    }

    let html = '<table><thead><tr><th>Genre</th><th>Number of Songs</th></tr></thead><tbody>';
    stats.forEach(stat => {
        html += `<tr><td>${stat.genre_name}</td><td>${stat.song_count}</td></tr>`;
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

function showArtistStats() {
    const stats = db.getArtistStatistics();
    const resultsDiv = document.getElementById('artistStatsResults');

    if (stats.length === 0) {
        resultsDiv.innerHTML = '<p class="empty">No statistics available</p>';
        return;
    }

    let html = '<table><thead><tr><th>Artist</th><th>Number of Tracks</th></tr></thead><tbody>';
    stats.forEach(stat => {
        html += `<tr><td>${stat.artist_name}</td><td>${stat.track_count}</td></tr>`;
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

// ==================== HELPER FUNCTIONS ====================

function populateArtistDropdowns() {
    const artists = db.getArtists();
    const selects = ['albumArtist', 'trackArtist'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select an artist</option>';
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist.artist_id;
            option.textContent = artist.artist_name;
            select.appendChild(option);
        });
        select.value = currentValue;
    });
}

function populateGenreDropdowns() {
    const genres = db.getGenres();
    const trackGenre = document.getElementById('trackGenre');
    const searchGenre = document.getElementById('searchGenre');

    [trackGenre, searchGenre].forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a genre</option>';
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.genre_id;
            option.textContent = genre.genre_name;
            select.appendChild(option);
        });
        select.value = currentValue;
    });
}

function populateAlbumDropdowns() {
    const albums = db.getAlbums();
    const trackAlbum = document.getElementById('trackAlbum');

    if (!trackAlbum) return;
    const currentValue = trackAlbum.value;
    trackAlbum.innerHTML = '<option value="">Select an album</option>';
    albums.forEach(album => {
        const artist = db.getArtistById(album.artist_id);
        const option = document.createElement('option');
        option.value = album.album_id;
        option.textContent = `${album.album_name} (${artist ? artist.artist_name : 'Unknown'})`;
        trackAlbum.appendChild(option);
    });
    trackAlbum.value = currentValue;
}

function populatePlaylistDropdowns() {
    const playlists = db.getPlaylists();
    const tracks = db.getTracks();
    
    const selectPlaylist = document.getElementById('selectPlaylist');
    const selectTrack = document.getElementById('selectTrack');

    if (selectPlaylist) {
        const currentPlaylist = selectPlaylist.value;
        selectPlaylist.innerHTML = '<option value="">Select a playlist</option>';
        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.playlist_id;
            option.textContent = playlist.playlist_name;
            selectPlaylist.appendChild(option);
        });
        selectPlaylist.value = currentPlaylist;
    }

    if (selectTrack) {
        const currentTrack = selectTrack.value;
        selectTrack.innerHTML = '<option value="">Select a track</option>';
        tracks.forEach(track => {
            const artist = db.getArtistById(track.artist_id);
            const option = document.createElement('option');
            option.value = track.track_id;
            option.textContent = `${track.track_title} (${artist ? artist.artist_name : 'Unknown'})`;
            selectTrack.appendChild(option);
        });
        selectTrack.value = currentTrack;
    }
}

function populateAllDropdowns() {
    populateArtistDropdowns();
    populateGenreDropdowns();
    populateAlbumDropdowns();
    populatePlaylistDropdowns();
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    populateAllDropdowns();
    updateDashboard();
});
