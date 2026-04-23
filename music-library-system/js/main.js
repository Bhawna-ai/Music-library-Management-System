// Main application logic
// DBMS Capstone Project - Music Library Management System

// ==================== SECTION NAVIGATION ====================

const pageTitles = {
    dashboard: { title: 'Dashboard', sub: 'Overview of your Aether system' },
    artists: { title: 'Artists', sub: 'Manage your music artists' },
    albums: { title: 'Albums', sub: 'Organize album collections' },
    tracks: { title: 'Tracks', sub: 'Manage individual songs' },
    playlists: { title: 'Playlists', sub: 'Create and manage playlists' },
    nowplaying: { title: 'Now Playing', sub: 'Your current track and queue' },
    search: { title: 'Search', sub: 'Find tracks, artists, and genres' },
    sql: { title: 'SQL & Schema', sub: 'The engine behind Aether' }
};

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    // Remove active nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');

    // Activate nav button
    const navBtn = document.querySelector(`[data-section="${sectionId}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Update page title
    const info = pageTitles[sectionId] || { title: sectionId, sub: '' };
    document.getElementById('pageTitle').textContent = info.title;
    document.getElementById('pageTitleSub').textContent = info.sub;

    // Refresh data for the section
    switch (sectionId) {
        case 'dashboard': updateDashboard(); break;
        case 'artists': displayArtists(); break;
        case 'albums': displayAlbums(); populateArtistDropdowns(); break;
        case 'tracks': displayTracks(); populateAllDropdowns(); break;
        case 'playlists': displayPlaylists(); populatePlaylistDropdowns(); break;
        case 'nowplaying': player.updateAllUI(); player.renderNowPlayingQueue(); break;
        case 'search': populateGenreDropdowns(); break;
        case 'sql': renderSQLQueries(); break;
    }

    // Close sidebar on mobile
    closeSidebar();
}

// ==================== SIDEBAR TOGGLE (MOBILE) ====================

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info', title = null) {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    const titles = {
        success: 'Success',
        error: 'Error',
        info: 'Info',
        warning: 'Warning'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-body">
            <div class="toast-title">${title || titles[type] || 'Info'}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Auto remove after 3.5s
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==================== CONFIRM MODAL ====================

let modalCallback = null;

function showConfirmModal(title, message, onConfirm) {
    modalCallback = onConfirm;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('confirmModal').classList.add('active');
}

function confirmModalAction() {
    if (modalCallback) modalCallback();
    closeModal();
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('active');
    modalCallback = null;
}

// ==================== EDIT MODAL ====================

let editSaveCallback = null;

function showEditModal(title, fieldsHtml, onSave) {
    editSaveCallback = onSave;
    document.getElementById('editModalTitle').textContent = title;
    document.getElementById('editModalBody').innerHTML = fieldsHtml;
    document.getElementById('editModal').classList.add('active');
    document.getElementById('editModalSaveBtn').onclick = () => {
        if (editSaveCallback) editSaveCallback();
        closeEditModal();
    };
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editSaveCallback = null;
}

// ==================== ANIMATED COUNTER ====================

function animateCounter(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 600;
    const start = performance.now();
    const startVal = current;

    function step(timestamp) {
        const progress = Math.min((timestamp - start) / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(startVal + (target - startVal) * ease);
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// ==================== AUDIO PLAYER LOGIC ====================

const player = {
    currentTrack: null,
    queue: [],
    currentIndex: -1,
    audio: null,
    isPlaying: false,
    isShuffle: false,
    repeatMode: 'none', // none, one, all
    isDragging: false,

    init() {
        this.audio = document.getElementById('mainAudio');
        if (!this.audio) return;
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Bottom bar buttons
        document.getElementById('btnPlayPause').addEventListener('click', () => this.togglePlay());
        document.getElementById('btnNext').addEventListener('click', () => this.nextTrack());
        document.getElementById('btnPrev').addEventListener('click', () => this.prevTrack());
        document.getElementById('btnRewind').addEventListener('click', () => this.rewind(10));
        document.getElementById('btnForward').addEventListener('click', () => this.forward(10));
        document.getElementById('btnStop').addEventListener('click', () => this.stop());

        document.getElementById('btnShuffle').addEventListener('click', () => this.toggleShuffle());
        document.getElementById('btnRepeat').addEventListener('click', () => this.cycleRepeat());

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('play', () => {
            // Increment play count on first play of a track
            if (this.currentTrack && this.audio.currentTime < 1) {
                db.incrementPlayCount(this.currentTrack.track_id);
            }
        });

        // Bottom progress bar - click to seek
        const progressContainer = document.getElementById('progressContainer');
        this._setupSeek(progressContainer, 'progressFill');

        // Now Playing progress bar - click to seek
        const npProgressContainer = document.getElementById('npProgressContainer');
        if (npProgressContainer) this._setupSeek(npProgressContainer, 'npProgressFill');

        // Volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.setVolume(e.target.value));
        document.getElementById('btnMute').addEventListener('click', () => this.toggleMute());
    },

    _setupSeek(container, fillId) {
        if (!container) return;
        const seekTo = (e) => {
            const rect = container.getBoundingClientRect();
            const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const duration = this.audio.duration;
            if (duration) this.audio.currentTime = (clickX / rect.width) * duration;
        };

        container.addEventListener('click', seekTo);

        // Drag to seek
        container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            seekTo(e);
        });
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) seekTo(e);
        });
        document.addEventListener('mouseup', () => { this.isDragging = false; });
    },

    playTrack(trackId, trackList = null) {
        const track = db.getTrackById(trackId);
        if (!track) return;

        if (trackList) {
            this.queue = trackList;
            this.currentIndex = this.queue.findIndex(t => t.track_id === trackId);
        }

        this.currentTrack = track;
        const streamUrl = track.stream_url || `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(track.track_id % 15) + 1}.mp3`;
        this.audio.src = streamUrl;
        this.updateAllUI();
        this.audio.play().catch(err => {
            console.error("Playback failed:", err);
            showToast("Playback failed. Browser may block auto-play.", "error");
        });
        this.isPlaying = true;
        this._syncPlayState();
        document.getElementById('playerBar').style.transform = 'translateY(0)';
        this.renderNowPlayingQueue();
    },

    togglePlay() {
        if (!this.currentTrack) return;
        if (this.audio.paused) {
            this.audio.play();
            this.isPlaying = true;
        } else {
            this.audio.pause();
            this.isPlaying = false;
        }
        this._syncPlayState();
    },

    stop() {
        if (!this.currentTrack) return;
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this._syncPlayState();
        showToast('Playback stopped', 'info');
    },

    rewind(seconds) {
        if (!this.currentTrack) return;
        this.audio.currentTime = Math.max(0, this.audio.currentTime - seconds);
    },

    forward(seconds) {
        if (!this.currentTrack) return;
        this.audio.currentTime = Math.min(this.audio.duration || 0, this.audio.currentTime + seconds);
    },

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        document.getElementById('btnShuffle').classList.toggle('active', this.isShuffle);
        const npShuffle = document.getElementById('npShuffle');
        if (npShuffle) npShuffle.classList.toggle('active', this.isShuffle);
        showToast(`Shuffle ${this.isShuffle ? 'ON' : 'OFF'}`, 'info');
    },

    cycleRepeat() {
        if (this.repeatMode === 'none') {
            this.repeatMode = 'all';
        } else if (this.repeatMode === 'all') {
            this.repeatMode = 'one';
        } else {
            this.repeatMode = 'none';
        }
        this._syncRepeatUI();
        showToast(`Repeat: ${this.repeatMode.toUpperCase()}`, 'info');
    },

    _syncRepeatUI() {
        const icon = this.repeatMode === 'one' ? '🔂' : '🔁';
        const active = this.repeatMode !== 'none';
        ['btnRepeat', 'npRepeat'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) { btn.innerHTML = icon; btn.classList.toggle('active', active); }
        });
    },

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        const icon = this.audio.muted ? '🔇' : '🔊';
        ['btnMute', 'npMute'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.innerHTML = icon;
        });
    },

    setVolume(val) {
        this.audio.volume = val;
        ['volumeSlider', 'npVolumeSlider'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        });
    },

    _syncPlayState() {
        const icon = this.isPlaying ? '⏸' : '▶';
        ['btnPlayPause', 'npPlayPause'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.innerHTML = icon;
                btn.classList.toggle('playing', this.isPlaying);
            }
        });
    },

    nextTrack() {
        if (this.queue.length === 0) return;
        if (this.isShuffle) {
            this.currentIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        }
        this.playTrack(this.queue[this.currentIndex].track_id);
    },

    prevTrack() {
        if (this.queue.length === 0) return;
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        this.playTrack(this.queue[this.currentIndex].track_id);
    },

    updateAllUI() {
        if (!this.currentTrack) return;
        const artist = db.getArtistById(this.currentTrack.artist_id);
        const album = db.getAlbumById(this.currentTrack.album_id);
        const genre = db.getGenreById(this.currentTrack.genre_id);
        const artistName = artist ? artist.artist_name : 'Unknown Artist';
        const albumName = album ? album.album_name : '';
        const genreName = genre ? genre.genre_name : '';

        // Bottom bar
        document.getElementById('playerTrackTitle').textContent = this.currentTrack.track_title;
        document.getElementById('playerTrackArtist').textContent = artistName;
        this._setArt('playerTrackArtImg', 'playerTrackArtIcon', this.currentTrack.cover_art);

        // Now Playing section
        const npTitle = document.getElementById('npTitle');
        if (npTitle) {
            npTitle.textContent = this.currentTrack.track_title;
            document.getElementById('npArtist').textContent = artistName;
            document.getElementById('npAlbum').textContent = albumName ? `💿 ${albumName}` : '';
            document.getElementById('npGenre').innerHTML = genreName ? `<span class="badge badge-genre">${escapeHtml(genreName)}</span>` : '';
            this._setArt('npArtImg', 'npArtIcon', this.currentTrack.cover_art);
        }
    },

    _setArt(imgId, iconId, coverArt) {
        const img = document.getElementById(imgId);
        const icon = document.getElementById(iconId);
        if (!img || !icon) return;
        if (coverArt) {
            img.src = coverArt;
            img.style.display = 'block';
            icon.style.display = 'none';
        } else {
            img.style.display = 'none';
            icon.style.display = 'block';
        }
    },

    updateProgress() {
        const { currentTime, duration } = this.audio;
        if (isNaN(duration) || duration === 0) return;
        const percent = (currentTime / duration) * 100;

        // Bottom bar
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('timeCurrent').textContent = formatDuration(Math.floor(currentTime));
        document.getElementById('timeTotal').textContent = formatDuration(Math.floor(duration));

        // Now Playing
        const npFill = document.getElementById('npProgressFill');
        if (npFill) {
            npFill.style.width = `${percent}%`;
            document.getElementById('npTimeCurrent').textContent = formatDuration(Math.floor(currentTime));
            document.getElementById('npTimeTotal').textContent = formatDuration(Math.floor(duration));
        }
    },

    onTrackEnded() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.repeatMode === 'all' || (this.currentIndex < this.queue.length - 1)) {
            this.nextTrack();
        } else {
            this.isPlaying = false;
            this._syncPlayState();
        }
    },

    renderNowPlayingQueue() {
        const list = document.getElementById('npQueueList');
        const countEl = document.getElementById('npQueueCount');
        if (!list) return;

        countEl.textContent = `${this.queue.length} tracks`;

        if (this.queue.length === 0) {
            list.innerHTML = '<div class="table-empty"><span class="empty-icon">🎵</span>No tracks in queue</div>';
            return;
        }

        list.innerHTML = this.queue.map((track, i) => {
            const artist = db.getArtistById(track.artist_id);
            const isActive = i === this.currentIndex;
            return `<div class="np-queue-item ${isActive ? 'np-queue-active' : ''}" onclick="player.playTrack(${track.track_id})">
                <span class="np-queue-num">${isActive ? '<span class="now-playing-bars"><span></span><span></span><span></span></span>' : (i + 1)}</span>
                <div class="np-queue-info">
                    <div class="np-queue-title">${escapeHtml(track.track_title)}</div>
                    <div class="np-queue-artist">${artist ? escapeHtml(artist.artist_name) : 'Unknown'}</div>
                </div>
                <span class="np-queue-duration">${formatDuration(track.duration)}</span>
            </div>`;
        }).join('');
    }
};

// ==================== DASHBOARD ====================

function updateDashboard() {
    const stats = db.getDashboardStats();
    animateCounter(document.getElementById('totalArtists'), stats.totalArtists);
    animateCounter(document.getElementById('totalTracks'), stats.totalTracks);
    animateCounter(document.getElementById('totalAlbums'), stats.totalAlbums);
    animateCounter(document.getElementById('totalPlaylists'), stats.totalPlaylists);
    document.getElementById('totalPlayTime').textContent = formatDuration(stats.totalPlayTime);

    // Recently Played
    const recentTracks = db.getRecentlyPlayed(8);
    const recentCard = document.getElementById('recentlyPlayedCard');
    const recentGrid = document.getElementById('recentlyPlayedGrid');
    if (recentTracks.length > 0) {
        recentCard.style.display = 'block';
        recentGrid.innerHTML = recentTracks.map(t => buildTrackCard(t)).join('');
    } else {
        recentCard.style.display = 'none';
    }

    // Most Played
    const mostTracks = db.getMostPlayed(8);
    const mostCard = document.getElementById('mostPlayedCard');
    const mostGrid = document.getElementById('mostPlayedGrid');
    if (mostTracks.length > 0) {
        mostCard.style.display = 'block';
        mostGrid.innerHTML = mostTracks.map(t => buildTrackCard(t, true)).join('');
    } else {
        mostCard.style.display = 'none';
    }
}

function buildTrackCard(track, showCount = false) {
    const coverStyle = track.cover_art
        ? `background-image:url('${track.cover_art}');background-size:cover;background-position:center;`
        : '';
    return `<div class="track-card" onclick="player.playTrack(${track.track_id}, db.getTracks())">
        <div class="track-card-art" style="${coverStyle}">
            ${!track.cover_art ? '<span>🎵</span>' : ''}
            <div class="track-card-play">▶</div>
        </div>
        <div class="track-card-title">${escapeHtml(track.track_title)}</div>
        <div class="track-card-artist">${escapeHtml(track.artist_name)}</div>
        ${showCount ? `<div class="track-card-plays">${track.play_count || 0} plays</div>` : ''}
    </div>`;
}

function resetDatabase() {
    showConfirmModal(
        'Reset Database',
        'This will permanently delete all data including artists, albums, tracks, and playlists. This action cannot be undone.',
        () => {
            db.reset();
            window.location.reload();
        }
    );
}

function loadSampleData() {
    if (db.data.artists.length > 0) {
        showToast('Database already has data. Reset first to load sample data.', 'warning');
        return;
    }

    // Add genres
    const genreRock = db.addGenre('Rock', 'Electric guitars and drums');
    const genrePop = db.addGenre('Pop', 'Catchy melodies and vocals');
    const genreJazz = db.addGenre('Jazz', 'Improvised instrumental music');
    const genreClassical = db.addGenre('Classical', 'Orchestral and composed music');
    const genreHipHop = db.addGenre('Hip-Hop', 'Rhythmic vocal delivery');
    const genreRnB = db.addGenre('R&B', 'Rhythm and blues');
    const genreElectronic = db.addGenre('Electronic', 'Synthesizer-based music');
    const genreIndie = db.addGenre('Indie', 'Independent alternative music');

    // Add artists
    const artistBeatles = db.addArtist('The Beatles', 'United Kingdom', 'Legendary British rock band formed in Liverpool in 1960');
    const artistTaylor = db.addArtist('Taylor Swift', 'United States', 'Multi-Grammy winning pop and country music icon');
    const artistMiles = db.addArtist('Miles Davis', 'United States', 'Pioneering jazz trumpeter and bandleader');
    const artistMozart = db.addArtist('Wolfgang Mozart', 'Austria', 'Prolific and influential classical music composer');
    const artistDrake = db.addArtist('Drake', 'Canada', 'Chart-topping hip-hop and R&B artist');
    const artistAdele = db.addArtist('Adele', 'United Kingdom', 'Powerful vocalist known for emotional ballads');
    const artistWeeknd = db.addArtist('The Weeknd', 'Canada', 'R&B and pop sensation with atmospheric sound');
    const artistRadiohead = db.addArtist('Radiohead', 'United Kingdom', 'Experimental rock and electronic band');

    // Add albums
    const albumAbbey = db.addAlbum('Abbey Road', artistBeatles.artist_id, 1969);
    const albumLetItBe = db.addAlbum('Let It Be', artistBeatles.artist_id, 1970);
    const albumReputation = db.addAlbum('Reputation', artistTaylor.artist_id, 2017);
    const album1989 = db.addAlbum('1989', artistTaylor.artist_id, 2014);
    const albumKind = db.addAlbum('Kind of Blue', artistMiles.artist_id, 1959);
    const albumRequiem = db.addAlbum('Requiem', artistMozart.artist_id, 1791);
    const albumScorpion = db.addAlbum('Scorpion', artistDrake.artist_id, 2018);
    const album21 = db.addAlbum('21', artistAdele.artist_id, 2011);
    const albumAfterHours = db.addAlbum('After Hours', artistWeeknd.artist_id, 2020);
    const albumOKComputer = db.addAlbum('OK Computer', artistRadiohead.artist_id, 1997);

    // Add tracks — Beatles
    db.addTrack('Come Together', albumAbbey.album_id, artistBeatles.artist_id, genreRock.genre_id, 259, '1969-09-26', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop');
    db.addTrack('Something', albumAbbey.album_id, artistBeatles.artist_id, genreRock.genre_id, 183, '1969-09-26', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1514525253344-91a6cf940ba0?w=400&h=400&fit=crop');
    db.addTrack('Here Comes the Sun', albumAbbey.album_id, artistBeatles.artist_id, genreRock.genre_id, 185, '1969-09-26', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?w=400&h=400&fit=crop');
    db.addTrack('Let It Be', albumLetItBe.album_id, artistBeatles.artist_id, genreRock.genre_id, 243, '1970-03-06', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop');

    // Taylor Swift
    db.addTrack('Look What You Made Me Do', albumReputation.album_id, artistTaylor.artist_id, genrePop.genre_id, 211, '2017-08-11', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop');
    db.addTrack('Delicate', albumReputation.album_id, artistTaylor.artist_id, genrePop.genre_id, 232, '2017-12-08', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop');
    db.addTrack('Getaway Car', albumReputation.album_id, artistTaylor.artist_id, genrePop.genre_id, 241, '2017-08-11', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 'https://images.unsplash.com/photo-1459749411177-042180cefa7f?w=400&h=400&fit=crop');
    db.addTrack('Shake It Off', album1989.album_id, artistTaylor.artist_id, genrePop.genre_id, 219, '2014-08-18', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop');
    db.addTrack('Blank Space', album1989.album_id, artistTaylor.artist_id, genrePop.genre_id, 231, '2014-11-10', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=400&h=400&fit=crop');

    // Jazz — Miles Davis
    db.addTrack('So What', albumKind.album_id, artistMiles.artist_id, genreJazz.genre_id, 567, '1959-03-02', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=400&fit=crop');
    db.addTrack('Freddie Freeloader', albumKind.album_id, artistMiles.artist_id, genreJazz.genre_id, 558, '1959-03-02', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', 'https://images.unsplash.com/photo-1514525253344-91a6cf940ba0?w=400&h=400&fit=crop');
    db.addTrack('Blue in Green', albumKind.album_id, artistMiles.artist_id, genreJazz.genre_id, 481, '1959-03-02', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400&h=400&fit=crop');

    // Classical — Mozart
    db.addTrack('Lacrimosa', albumRequiem.album_id, artistMozart.artist_id, genreClassical.genre_id, 602, '1791-01-01', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop');
    db.addTrack('Dies Irae', albumRequiem.album_id, artistMozart.artist_id, genreClassical.genre_id, 720, '1791-01-01', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', 'https://images.unsplash.com/photo-1465821185615-9344491ebb16?w=400&h=400&fit=crop');

    // Hip-Hop — Drake
    db.addTrack('In My Feelings', albumScorpion.album_id, artistDrake.artist_id, genreHipHop.genre_id, 226, '2018-06-29', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop');
    db.addTrack('Hotline Bling', albumScorpion.album_id, artistDrake.artist_id, genreHipHop.genre_id, 207, '2018-06-29', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', 'https://images.unsplash.com/photo-1514525253344-91a6cf940ba0?w=400&h=400&fit=crop');
    db.addTrack('God\'s Plan', albumScorpion.album_id, artistDrake.artist_id, genreHipHop.genre_id, 198, '2018-01-19', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop');

    // Adele
    db.addTrack('Rolling in the Deep', album21.album_id, artistAdele.artist_id, genrePop.genre_id, 228, '2010-11-29', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop');
    db.addTrack('Someone Like You', album21.album_id, artistAdele.artist_id, genrePop.genre_id, 285, '2011-01-24', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1459749411177-042180cefa7f?w=400&h=400&fit=crop');
    db.addTrack('Set Fire to the Rain', album21.album_id, artistAdele.artist_id, genrePop.genre_id, 242, '2011-07-04', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop');

    // The Weeknd
    db.addTrack('Blinding Lights', albumAfterHours.album_id, artistWeeknd.artist_id, genreRnB.genre_id, 200, '2019-11-29', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=400&h=400&fit=crop');
    db.addTrack('After Hours', albumAfterHours.album_id, artistWeeknd.artist_id, genreRnB.genre_id, 361, '2020-02-19', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&h=400&fit=crop');
    db.addTrack('Save Your Tears', albumAfterHours.album_id, artistWeeknd.artist_id, genreRnB.genre_id, 215, '2020-03-20', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 'https://images.unsplash.com/photo-1514525253344-91a6cf940ba0?w=400&h=400&fit=crop');

    // Radiohead
    db.addTrack('Paranoid Android', albumOKComputer.album_id, artistRadiohead.artist_id, genreIndie.genre_id, 384, '1997-05-26', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=400&h=400&fit=crop');
    db.addTrack('Karma Police', albumOKComputer.album_id, artistRadiohead.artist_id, genreIndie.genre_id, 264, '1997-08-25', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop');
    db.addTrack('No Surprises', albumOKComputer.album_id, artistRadiohead.artist_id, genreIndie.genre_id, 229, '1998-01-12', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', 'https://images.unsplash.com/photo-1465821185615-9344491ebb16?w=400&h=400&fit=crop');

    // Create playlists
    const playlistRock = db.addPlaylist('Rock Classics', 'Timeless rock anthems from the greatest bands');
    const playlistPop = db.addPlaylist('Pop Favorites', 'Chart-topping pop hits you love');
    const playlistChill = db.addPlaylist('Chill Vibes', 'Relaxing jazz and mellow tracks');
    const playlistWorkout = db.addPlaylist('Workout Mix', 'High-energy tracks to fuel your workout');

    // Add tracks to playlists
    const allTracks = db.getTracks();
    allTracks.forEach(track => {
        const genre = db.getGenreById(track.genre_id);
        if (genre) {
            if (genre.genre_name === 'Rock' || genre.genre_name === 'Indie') {
                db.addTrackToPlaylist(playlistRock.playlist_id, track.track_id);
            }
            if (genre.genre_name === 'Pop') {
                db.addTrackToPlaylist(playlistPop.playlist_id, track.track_id);
            }
            if (genre.genre_name === 'Jazz' || genre.genre_name === 'Classical') {
                db.addTrackToPlaylist(playlistChill.playlist_id, track.track_id);
            }
            if (genre.genre_name === 'Hip-Hop' || genre.genre_name === 'R&B') {
                db.addTrackToPlaylist(playlistWorkout.playlist_id, track.track_id);
            }
        }
    });

    updateDashboard();
    showToast('Sample data loaded with 8 artists, 10 albums, and 27 tracks!', 'success', 'Data Loaded');
}

// ==================== ARTIST MANAGEMENT ====================

function addArtist(event) {
    event.preventDefault();
    const name = document.getElementById('artistName').value.trim();
    const country = document.getElementById('artistCountry').value.trim();
    const bio = document.getElementById('artistBio').value.trim();

    if (name) {
        const result = db.addArtist(name, country, bio);
        if (result.error) {
            showToast(result.error, 'error');
            return;
        }
        document.getElementById('artistForm').reset();
        displayArtists();
        populateArtistDropdowns();
        showToast(`"${name}" added to artists`, 'success', 'Artist Added');
    }
}

function displayArtists() {
    const artists = db.getArtists();
    const tbody = document.querySelector('#artistsTable tbody');
    tbody.innerHTML = '';

    if (artists.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><span class="empty-icon">🎤</span>No artists yet — add one above or load sample data</td></tr>`;
        return;
    }

    artists.forEach(artist => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${artist.artist_id}</td>
            <td><strong>${escapeHtml(artist.artist_name)}</strong></td>
            <td>${artist.country ? `<span class="badge badge-country">${escapeHtml(artist.country)}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${artist.bio ? escapeHtml(artist.bio.substring(0, 60)) + (artist.bio.length > 60 ? '…' : '') : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>
                <button class="btn btn-edit" onclick="editArtist(${artist.artist_id})">✏ Edit</button>
                <button class="btn btn-danger" onclick="deleteArtist(${artist.artist_id})">✕ Delete</button>
            </td>
        `;
    });
}

function editArtist(id) {
    const artist = db.getArtistById(id);
    if (!artist) return;

    const html = `
        <div class="form-group" style="margin-bottom:12px;">
            <label>Artist Name</label>
            <input type="text" id="editArtistName" value="${escapeHtml(artist.artist_name)}">
        </div>
        <div class="form-group" style="margin-bottom:12px;">
            <label>Country</label>
            <input type="text" id="editArtistCountry" value="${escapeHtml(artist.country || '')}">
        </div>
        <div class="form-group" style="margin-bottom:12px;">
            <label>Biography</label>
            <textarea id="editArtistBio" rows="3">${escapeHtml(artist.bio || '')}</textarea>
        </div>
    `;

    showEditModal('Edit Artist', html, () => {
        const updates = {
            artist_name: document.getElementById('editArtistName').value.trim(),
            country: document.getElementById('editArtistCountry').value.trim(),
            bio: document.getElementById('editArtistBio').value.trim()
        };
        db.updateArtist(id, updates);
        displayArtists();
        populateArtistDropdowns();
        showToast('Artist updated successfully', 'success');
    });
}

function deleteArtist(id) {
    const artist = db.getArtistById(id);
    showConfirmModal(
        'Delete Artist',
        `Delete "${artist?.artist_name || 'this artist'}" and all associated albums, tracks, and playlist entries? This cannot be undone.`,
        () => {
            db.deleteArtist(id);
            displayArtists();
            populateArtistDropdowns();
            showToast('Artist and related data deleted', 'info', 'Deleted');
        }
    );
}

// ==================== ALBUM MANAGEMENT ====================

function addAlbum(event) {
    event.preventDefault();
    const name = document.getElementById('albumName').value.trim();
    const artistId = parseInt(document.getElementById('albumArtist').value);
    const year = document.getElementById('albumYear').value;

    if (name && artistId) {
        db.addAlbum(name, artistId, year || null);
        document.getElementById('albumForm').reset();
        displayAlbums();
        populateAllDropdowns();
        showToast(`Album "${name}" added to collection`, 'success', 'Album Added');
    }
}

function displayAlbums() {
    const albums = db.getAlbums();
    const tbody = document.querySelector('#albumsTable tbody');
    tbody.innerHTML = '';

    if (albums.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><span class="empty-icon">💿</span>No albums yet — add one above</td></tr>`;
        return;
    }

    albums.forEach(album => {
        const artist = db.getArtistById(album.artist_id);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${album.album_id}</td>
            <td><strong>${escapeHtml(album.album_name)}</strong></td>
            <td>${artist ? escapeHtml(artist.artist_name) : '<span style="color:var(--text-muted)">Unknown</span>'}</td>
            <td>${album.release_year || '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>
                <button class="btn btn-edit" onclick="editAlbum(${album.album_id})">✏ Edit</button>
                <button class="btn btn-danger" onclick="deleteAlbum(${album.album_id})">✕ Delete</button>
            </td>
        `;
    });
}

function editAlbum(id) {
    const album = db.getAlbumById(id);
    if (!album) return;

    const artists = db.getArtists();
    let artistOptions = artists.map(a =>
        `<option value="${a.artist_id}" ${a.artist_id === album.artist_id ? 'selected' : ''}>${escapeHtml(a.artist_name)}</option>`
    ).join('');

    const html = `
        <div class="form-group" style="margin-bottom:12px;">
            <label>Album Name</label>
            <input type="text" id="editAlbumName" value="${escapeHtml(album.album_name)}">
        </div>
        <div class="form-group" style="margin-bottom:12px;">
            <label>Artist</label>
            <select id="editAlbumArtist">${artistOptions}</select>
        </div>
        <div class="form-group" style="margin-bottom:12px;">
            <label>Release Year</label>
            <input type="number" id="editAlbumYear" value="${album.release_year || ''}" min="1900" max="2100">
        </div>
    `;

    showEditModal('Edit Album', html, () => {
        db.updateAlbum(id, {
            album_name: document.getElementById('editAlbumName').value.trim(),
            artist_id: parseInt(document.getElementById('editAlbumArtist').value),
            release_year: document.getElementById('editAlbumYear').value || null
        });
        displayAlbums();
        populateAllDropdowns();
        showToast('Album updated successfully', 'success');
    });
}

function deleteAlbum(id) {
    const album = db.getAlbumById(id);
    showConfirmModal(
        'Delete Album',
        `Delete "${album?.album_name || 'this album'}" and all its tracks? This cannot be undone.`,
        () => {
            db.deleteAlbum(id);
            displayAlbums();
            populateAllDropdowns();
            showToast('Album and associated tracks deleted', 'info', 'Deleted');
        }
    );
}

// ==================== TRACK MANAGEMENT ====================

function addTrack(event) {
    event.preventDefault();
    const title = document.getElementById('trackTitle').value.trim();
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
        showToast(`"${title}" added to tracks`, 'success', 'Track Added');
    }
}

function displayTracks() {
    const tracks = db.getTracks();
    const tbody = document.querySelector('#tracksTable tbody');
    tbody.innerHTML = '';

    if (tracks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><span class="empty-icon">🎶</span>No tracks yet — add one above</td></tr>`;
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
            <td>
                <button class="btn-play-inline" onclick="player.playTrack(${track.track_id}, db.getTracks())" title="Play Now">▶</button>
                <strong>${escapeHtml(track.track_title)}</strong>
            </td>
            <td>${artist ? escapeHtml(artist.artist_name) : 'Unknown'}</td>
            <td>${album ? escapeHtml(album.album_name) : 'Unknown'}</td>
            <td>${genre ? `<span class="badge badge-genre">${escapeHtml(genre.genre_name)}</span>` : 'Unknown'}</td>
            <td>${duration}</td>
            <td>
                <button class="btn btn-edit" onclick="editTrack(${track.track_id})">✏ Edit</button>
                <button class="btn btn-danger" onclick="deleteTrack(${track.track_id})">✕ Delete</button>
            </td>
        `;
    });
}

function editTrack(id) {
    const track = db.getTrackById(id);
    if (!track) return;

    const artists = db.getArtists();
    const albums = db.getAlbums();
    const genres = db.getGenres();

    let artistOpts = artists.map(a => `<option value="${a.artist_id}" ${a.artist_id === track.artist_id ? 'selected' : ''}>${escapeHtml(a.artist_name)}</option>`).join('');
    let albumOpts = albums.map(a => `<option value="${a.album_id}" ${a.album_id === track.album_id ? 'selected' : ''}>${escapeHtml(a.album_name)}</option>`).join('');
    let genreOpts = genres.map(g => `<option value="${g.genre_id}" ${g.genre_id === track.genre_id ? 'selected' : ''}>${escapeHtml(g.genre_name)}</option>`).join('');

    const html = `
        <div class="form-group" style="margin-bottom:12px;"><label>Track Title</label><input type="text" id="editTrackTitle" value="${escapeHtml(track.track_title)}"></div>
        <div class="form-group" style="margin-bottom:12px;"><label>Artist</label><select id="editTrackArtist">${artistOpts}</select></div>
        <div class="form-group" style="margin-bottom:12px;"><label>Album</label><select id="editTrackAlbum">${albumOpts}</select></div>
        <div class="form-group" style="margin-bottom:12px;"><label>Genre</label><select id="editTrackGenre">${genreOpts}</select></div>
        <div class="form-group" style="margin-bottom:12px;"><label>Duration (seconds)</label><input type="number" id="editTrackDuration" value="${track.duration || 0}" min="0"></div>
    `;

    showEditModal('Edit Track', html, () => {
        db.updateTrack(id, {
            track_title: document.getElementById('editTrackTitle').value.trim(),
            artist_id: parseInt(document.getElementById('editTrackArtist').value),
            album_id: parseInt(document.getElementById('editTrackAlbum').value),
            genre_id: parseInt(document.getElementById('editTrackGenre').value),
            duration: parseInt(document.getElementById('editTrackDuration').value) || 0
        });
        displayTracks();
        showToast('Track updated successfully', 'success');
    });
}

function deleteTrack(id) {
    const track = db.getTrackById(id);
    showConfirmModal(
        'Delete Track',
        `Delete "${track?.track_title || 'this track'}" from all playlists? This cannot be undone.`,
        () => {
            db.deleteTrack(id);
            displayTracks();
            populatePlaylistDropdowns();
            showToast('Track deleted from library', 'info', 'Deleted');
        }
    );
}

// ==================== PLAYLIST MANAGEMENT ====================

function addPlaylist(event) {
    event.preventDefault();
    const name = document.getElementById('playlistName').value.trim();
    const desc = document.getElementById('playlistDesc').value.trim();

    if (name) {
        db.addPlaylist(name, desc);
        document.getElementById('playlistForm').reset();
        displayPlaylists();
        populatePlaylistDropdowns();
        showToast(`Playlist "${name}" created`, 'success', 'Playlist Created');
    }
}

function displayPlaylists() {
    const playlists = db.getPlaylists();
    const tbody = document.querySelector('#playlistsTable tbody');
    tbody.innerHTML = '';

    if (playlists.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty"><span class="empty-icon">📋</span>No playlists yet — create one above</td></tr>`;
        return;
    }

    playlists.forEach(playlist => {
        const trackCount = db.getPlaylistTrackCount(playlist.playlist_id);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${playlist.playlist_id}</td>
            <td><strong>${escapeHtml(playlist.playlist_name)}</strong></td>
            <td>${playlist.description ? escapeHtml(playlist.description) : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td><span class="badge badge-genre">${trackCount} tracks</span></td>
            <td>
                <button class="btn btn-primary" onclick="playPlaylist(${playlist.playlist_id})" style="padding:6px 12px;font-size:var(--text-xs);">▶ Play</button>
                <button class="btn btn-success" onclick="showPlaylistDetails(${playlist.playlist_id})">👁 View</button>
                <button class="btn btn-danger" onclick="deletePlaylist(${playlist.playlist_id})">✕ Delete</button>
            </td>
        `;
    });
}

function deletePlaylist(id) {
    const playlist = db.getPlaylistById(id);
    showConfirmModal(
        'Delete Playlist',
        `Delete playlist "${playlist?.playlist_name || 'this playlist'}"? The tracks will remain in your library.`,
        () => {
            db.deletePlaylist(id);
            displayPlaylists();
            populatePlaylistDropdowns();
            showToast('Playlist deleted', 'info', 'Deleted');
        }
    );
}

function addTrackToPlaylist(event) {
    event.preventDefault();
    const playlistId = parseInt(document.getElementById('selectPlaylist').value);
    const trackId = parseInt(document.getElementById('selectTrack').value);

    if (playlistId && trackId) {
        const result = db.addTrackToPlaylist(playlistId, trackId);
        if (result.error) {
            showToast(result.error, 'warning');
            return;
        }
        document.getElementById('addToPlaylistForm').reset();
        populatePlaylistDropdowns();
        displayPlaylists();
        showToast('Track added to playlist', 'success');
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
        tbody.innerHTML = `<tr><td colspan="4" class="table-empty"><span class="empty-icon">🎵</span>No tracks in this playlist yet</td></tr>`;
    } else {
        tracks.forEach(track => {
            const artist = db.getArtistById(track.artist_id);
            const duration = formatDuration(track.duration);
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>
                    <button class="btn-play-inline" onclick="player.playTrack(${track.track_id}, db.getPlaylistTracks(${playlistId}))" title="Play Now">▶</button>
                    <strong>${escapeHtml(track.track_title)}</strong>
                </td>
                <td>${artist ? escapeHtml(artist.artist_name) : 'Unknown'}</td>
                <td>${duration}</td>
                <td>
                    <button class="btn btn-danger" onclick="removeFromPlaylist(${playlistId}, ${track.track_id})">✕ Remove</button>
                </td>
            `;
        });
    }

    container.classList.add('visible');
    container.scrollIntoView({ behavior: 'smooth' });
}

function closePlaylistDetails() {
    document.getElementById('playlistDetailsContainer').classList.remove('visible');
}

function removeFromPlaylist(playlistId, trackId) {
    db.removeTrackFromPlaylist(playlistId, trackId);
    showPlaylistDetails(playlistId);
    displayPlaylists();
    showToast('Track removed from playlist', 'info');
}

// ==================== SEARCH OPERATIONS ====================

function searchByTitle() {
    const searchTerm = document.getElementById('searchTitle').value.trim();
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

    resultsDiv.innerHTML = buildSearchResultsTable(results);
}

function searchByArtist() {
    const searchTerm = document.getElementById('searchArtist').value.trim();
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

    resultsDiv.innerHTML = buildSearchResultsTable(results);
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

    resultsDiv.innerHTML = buildSearchResultsTable(results);
}

function buildSearchResultsTable(results) {
    let html = '<table><thead><tr><th>Title</th><th>Artist</th><th>Album</th><th>Genre</th><th>Duration</th></tr></thead><tbody>';
    results.forEach(track => {
        html += `<tr>
            <td>
                <button class="btn-play-inline" onclick="player.playTrack(${track.track_id}, null)" title="Play Now">▶</button>
                <strong>${escapeHtml(track.track_title)}</strong>
            </td>
            <td>${escapeHtml(track.artist_name)}</td>
            <td>${escapeHtml(track.album_name)}</td>
            <td><span class="badge badge-genre">${escapeHtml(track.genre_name)}</span></td>
            <td>${formatDuration(track.duration)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

function showGenreStats() {
    const stats = db.getGenreStatistics();
    const resultsDiv = document.getElementById('genreStatsResults');

    if (stats.length === 0) {
        resultsDiv.innerHTML = '<p class="empty">No statistics available — add some tracks first</p>';
        return;
    }

    let html = '<table><thead><tr><th>Genre</th><th>Songs</th><th>Total Duration</th></tr></thead><tbody>';
    stats.forEach(stat => {
        html += `<tr>
            <td><span class="badge badge-genre">${escapeHtml(stat.genre_name)}</span></td>
            <td><strong>${stat.song_count}</strong></td>
            <td>${formatDuration(stat.total_duration)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

function showArtistStats() {
    const stats = db.getArtistStatistics();
    const resultsDiv = document.getElementById('artistStatsResults');

    if (stats.length === 0) {
        resultsDiv.innerHTML = '<p class="empty">No statistics available — add some tracks first</p>';
        return;
    }

    let html = '<table><thead><tr><th>Artist</th><th>Tracks</th><th>Albums</th><th>Total Duration</th></tr></thead><tbody>';
    stats.forEach(stat => {
        html += `<tr>
            <td><strong>${escapeHtml(stat.artist_name)}</strong></td>
            <td>${stat.track_count}</td>
            <td>${stat.album_count}</td>
            <td>${formatDuration(stat.total_duration)}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    resultsDiv.innerHTML = html;
}

// ==================== GLOBAL SEARCH ====================

function handleGlobalSearch(event) {
    if (event.key === 'Enter') {
        const term = document.getElementById('globalSearch').value.trim();
        if (term) {
            // Switch to search section
            showSection('search');
            document.getElementById('searchTitle').value = term;
            searchByTitle();
        }
    }
}

// ==================== SQL QUERIES DISPLAY ====================

function renderSQLQueries() {
    // Schema DDL
    document.getElementById('sqlSchemaCode').innerHTML = highlightSQL(`-- ============================================
-- Aether - Modern Music System
-- Database Schema (DDL)
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
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
        ON DELETE CASCADE
);

-- 4. Tracks Table
CREATE TABLE tracks (
    track_id     INT PRIMARY KEY AUTO_INCREMENT,
    track_title  VARCHAR(100) NOT NULL,
    album_id     INT NOT NULL,
    artist_id    INT NOT NULL,
    genre_id     INT NOT NULL,
    duration     INT,
    release_date DATE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id)  REFERENCES albums(album_id)  ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id)  REFERENCES genres(genre_id)   ON DELETE CASCADE
);

-- 5. Playlists Table
CREATE TABLE playlists (
    playlist_id   INT PRIMARY KEY AUTO_INCREMENT,
    playlist_name VARCHAR(100) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Playlist Tracks (Junction Table — Many-to-Many)
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

-- 8. Favorites (Junction Table)
CREATE TABLE favorites (
    user_id      INT NOT NULL,
    track_id     INT NOT NULL,
    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
);

-- 9. Play History
CREATE TABLE play_history (
    history_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id      INT,
    track_id     INT NOT NULL,
    played_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE SET NULL,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
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

-- 11. Deletion Audit Log
CREATE TABLE deletion_log (
    log_id       INT PRIMARY KEY AUTO_INCREMENT,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    INT NOT NULL,
    entity_name  VARCHAR(100),
    deleted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_artist_name   ON artists(artist_name);
CREATE INDEX idx_album_artist  ON albums(artist_id);
CREATE INDEX idx_track_title   ON tracks(track_title);
CREATE INDEX idx_track_artist  ON tracks(artist_id);
CREATE INDEX idx_track_genre   ON tracks(genre_id);
CREATE INDEX idx_playlist_name ON playlists(playlist_name);`);

    // Sample Queries
    document.getElementById('sqlQueriesCode').innerHTML = highlightSQL(`-- ============================================
-- Sample DML Queries
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

-- 3. Get all songs in an album
SELECT t.track_title, a.artist_name, g.genre_name, t.duration
FROM tracks t
JOIN artists a ON t.artist_id = a.artist_id
JOIN genres g  ON t.genre_id  = g.genre_id
WHERE t.album_id = 1
ORDER BY t.track_title;

-- 4. Get playlist with all tracks
SELECT p.playlist_name, t.track_title, a.artist_name, t.duration
FROM playlists p
JOIN playlist_tracks pt ON p.playlist_id  = pt.playlist_id
JOIN tracks t           ON pt.track_id    = t.track_id
JOIN artists a          ON t.artist_id    = a.artist_id
WHERE p.playlist_id = 1
ORDER BY pt.added_at;

-- 5. Get total duration of a playlist
SELECT p.playlist_name,
       SEC_TO_TIME(SUM(t.duration)) AS total_duration,
       COUNT(t.track_id) AS track_count
FROM playlists p
JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
JOIN tracks t           ON pt.track_id   = t.track_id
WHERE p.playlist_id = 1
GROUP BY p.playlist_id;

-- 6. Top genres by song count
SELECT g.genre_name, COUNT(t.track_id) AS song_count
FROM genres g
JOIN tracks t ON g.genre_id = t.genre_id
GROUP BY g.genre_id, g.genre_name
ORDER BY song_count DESC;

-- 7. Top artists by track count
SELECT a.artist_name, COUNT(t.track_id) AS track_count
FROM artists a
JOIN tracks t ON a.artist_id = t.artist_id
GROUP BY a.artist_id, a.artist_name
ORDER BY track_count DESC;

-- 8. Insert a new track
INSERT INTO tracks (track_title, album_id, artist_id, genre_id, duration, release_date)
VALUES ('New Song', 1, 1, 1, 240, '2024-01-15');

-- 9. Update an artist
UPDATE artists
SET country = 'United Kingdom', bio = 'Updated biography'
WHERE artist_id = 1;

-- 10. Delete a track (cascades to playlist_tracks)
DELETE FROM tracks WHERE track_id = 5;`);

    // Views
    document.getElementById('sqlViewsCode').innerHTML = highlightSQL(`-- ============================================
-- Database Views
-- ============================================

-- View 1: Track Details (pre-joined)
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

-- Usage: SELECT * FROM track_details_view WHERE genre_name = 'Rock';

-- View 2: Playlist Summary
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

-- Usage: SELECT * FROM playlist_summary_view;

-- View 3: Artist Statistics
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
LEFT JOIN albums ab ON a.artist_id  = ab.artist_id
LEFT JOIN tracks t  ON a.artist_id  = t.artist_id
GROUP BY a.artist_id, a.artist_name, a.country;

-- Usage: SELECT * FROM artist_stats_view ORDER BY track_count DESC;`);

    // Stored Procedures
    document.getElementById('sqlProceduresCode').innerHTML = highlightSQL(`-- ============================================
-- Stored Procedures
-- ============================================

-- Procedure 1: Safely add track to playlist
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

-- Usage: CALL sp_add_track_to_playlist(1, 5);

-- Procedure 2: Get artist discography
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
    JOIN tracks t  ON ab.album_id  = t.album_id
    JOIN genres g  ON t.genre_id   = g.genre_id
    WHERE a.artist_id = p_artist_id
    ORDER BY ab.release_year, t.track_title;
END //
DELIMITER ;

-- Usage: CALL sp_get_artist_discography(1);

-- Procedure 3: Universal search
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

-- Usage: CALL sp_search_library('Beatles');`);

    // Triggers
    document.getElementById('sqlTriggersCode').innerHTML = highlightSQL(`-- ============================================
-- Triggers
-- ============================================

-- Trigger 1: Auto-update playlist timestamp on track add
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

-- Trigger 2: Auto-update playlist timestamp on track remove
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

-- Trigger 3: Log track deletion for audit
DELIMITER //
CREATE TRIGGER trg_log_track_deletion
BEFORE DELETE ON tracks
FOR EACH ROW
BEGIN
    INSERT INTO deletion_log (entity_type, entity_id, entity_name)
    VALUES ('track', OLD.track_id, OLD.track_title);
END //
DELIMITER ;

-- Trigger 4: Log artist deletion for audit
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
        SET MESSAGE_TEXT = 'Genre name already exists';
    END IF;
END //
DELIMITER ;`);

    // Advanced Queries
    document.getElementById('sqlAdvancedCode').innerHTML = highlightSQL(`-- ============================================
-- Advanced SQL Queries
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

-- 6. Self-join pattern: Albums by same artist
SELECT
    a1.album_name AS album_1,
    a2.album_name AS album_2,
    ar.artist_name
FROM albums a1
JOIN albums a2 ON a1.artist_id = a2.artist_id AND a1.album_id < a2.album_id
JOIN artists ar ON a1.artist_id = ar.artist_id;

-- 7. Aggregate with HAVING: Genres with more than 3 songs
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
JOIN albums ab ON t.album_id = ab.album_id;`);
}

// SQL Syntax Highlighter
function highlightSQL(code) {
    // Escape HTML first
    let result = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Comments
    result = result.replace(/(--[^\n]*)/g, '<span class="sql-comment">$1</span>');

    // Strings
    result = result.replace(/('([^']*)')/g, '<span class="sql-string">$1</span>');

    // Numbers (standalone)
    result = result.replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');

    // SQL Keywords
    const keywords = [
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
        'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ORDER BY', 'GROUP BY', 'HAVING',
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE TABLE',
        'CREATE VIEW', 'CREATE INDEX', 'CREATE PROCEDURE', 'CREATE TRIGGER',
        'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
        'AUTO_INCREMENT', 'NOT NULL', 'UNIQUE', 'DEFAULT', 'CASCADE',
        'ON DELETE', 'ON UPDATE', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG',
        'MAX', 'MIN', 'IF', 'THEN', 'ELSE', 'END', 'BEGIN', 'DECLARE',
        'DELIMITER', 'CALL', 'RETURN', 'INTO', 'AFTER', 'BEFORE', 'FOR EACH ROW',
        'NEW', 'OLD', 'SIGNAL', 'SQLSTATE', 'MESSAGE_TEXT', 'WITH', 'PARTITION BY',
        'OVER', 'ROWS', 'UNBOUNDED', 'PRECEDING', 'COALESCE', 'CONCAT',
        'WHEN', 'CASE', 'EXISTS', 'CHECK', 'BETWEEN', 'LIMIT', 'OFFSET',
        'UNIQUE KEY', 'SEC_TO_TIME', 'CURRENT_TIMESTAMP', 'YEAR', 'DATE',
        'TIMESTAMP', 'SET NULL', 'ROW_NUMBER', 'RANK', 'DESC', 'ASC'
    ];

    // SQL types
    const types = ['INT', 'VARCHAR', 'TEXT', 'TINYINT', 'BOOLEAN', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL'];

    // Functions
    const functions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'COALESCE', 'CONCAT', 'SEC_TO_TIME', 'ROW_NUMBER', 'RANK', 'LOWER'];

    // Highlight functions
    functions.forEach(fn => {
        const regex = new RegExp(`\\b(${fn})\\s*\\(`, 'gi');
        result = result.replace(regex, (match, p1) => `<span class="sql-function">${p1}</span>(`);
    });

    // Highlight types (with size like VARCHAR(100))
    types.forEach(t => {
        const regex = new RegExp(`\\b(${t})\\b`, 'gi');
        result = result.replace(regex, '<span class="sql-type">$1</span>');
    });

    // Highlight keywords (longest first to handle multi-word)
    keywords.sort((a, b) => b.length - a.length);
    keywords.forEach(kw => {
        // Only match if not already inside a span
        const regex = new RegExp(`(?<!<[^>]*)\\b(${kw.replace(/\s+/g, '\\s+')})\\b(?![^<]*>)`, 'gi');
        result = result.replace(regex, '<span class="sql-keyword">$1</span>');
    });

    return result;
}

// ==================== SQL TAB SWITCHING ====================

function initSQLTabs() {
    const tabs = document.querySelectorAll('.sql-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Toggle content
            document.querySelectorAll('.sql-content').forEach(c => c.classList.remove('active'));
            const targetId = `sql-${tab.dataset.tab}`;
            document.getElementById(targetId).classList.add('active');
        });
    });
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
        selectPlaylist.innerHTML = '<option value="">Choose a playlist</option>';
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
        selectTrack.innerHTML = '<option value="">Choose a track</option>';
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== PLAY ALL / PLAY PLAYLIST ====================

function playAllTracks() {
    const tracks = db.getTracks();
    if (tracks.length === 0) {
        showToast('No tracks to play. Add some tracks first!', 'warning');
        return;
    }
    player.playTrack(tracks[0].track_id, tracks);
    showToast(`Playing all ${tracks.length} tracks`, 'success', 'Now Playing');
}

function playPlaylist(playlistId) {
    const tracks = db.getPlaylistTracks(playlistId);
    const playlist = db.getPlaylistById(playlistId);
    if (tracks.length === 0) {
        showToast('This playlist is empty. Add some tracks first!', 'warning');
        return;
    }
    player.playTrack(tracks[0].track_id, tracks);
    showToast(`Playing "${playlist.playlist_name}" (${tracks.length} tracks)`, 'success', 'Now Playing');
}

// ==================== QUICK ADD TO PLAYLIST ====================

function showQuickAddToPlaylist() {
    if (!player.currentTrack) {
        showToast('No track is playing', 'warning');
        return;
    }
    const playlists = db.getPlaylists();
    const select = document.getElementById('quickPlaylistSelect');
    select.innerHTML = '<option value="">Choose a playlist</option>';
    playlists.forEach(p => {
        select.innerHTML += `<option value="${p.playlist_id}">${escapeHtml(p.playlist_name)}</option>`;
    });
    document.getElementById('quickPlaylistNewName').value = '';
    document.getElementById('quickPlaylistModal').classList.add('active');
}

function closeQuickPlaylistModal() {
    document.getElementById('quickPlaylistModal').classList.remove('active');
}

function confirmQuickAddToPlaylist() {
    if (!player.currentTrack) return;
    const trackId = player.currentTrack.track_id;
    const selectVal = document.getElementById('quickPlaylistSelect').value;
    const newName = document.getElementById('quickPlaylistNewName').value.trim();

    let playlistId;
    if (newName) {
        const newPlaylist = db.addPlaylist(newName, '');
        playlistId = newPlaylist.playlist_id;
        showToast(`Created playlist "${newName}"`, 'success');
    } else if (selectVal) {
        playlistId = parseInt(selectVal);
    } else {
        showToast('Select a playlist or enter a name for a new one', 'warning');
        return;
    }

    const result = db.addTrackToPlaylist(playlistId, trackId);
    if (result.error) {
        showToast(result.error, 'warning');
    } else {
        const playlist = db.getPlaylistById(playlistId);
        showToast(`Added to "${playlist.playlist_name}"`, 'success');
    }
    closeQuickPlaylistModal();
}

// ==================== INITIALIZATION ======================================

document.addEventListener('DOMContentLoaded', function() {
    // Setup sidebar navigation
    document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            showSection(btn.dataset.section);
        });
    });

    // Hamburger menu
    document.getElementById('hamburgerBtn').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

    // Close modals on overlay click
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeEditModal();
    });
    document.getElementById('quickPlaylistModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeQuickPlaylistModal();
    });

    // SQL tabs
    initSQLTabs();

    // Initial data load
    populateAllDropdowns();
    updateDashboard();
    
    // Initialize Player
    player.init();
});
