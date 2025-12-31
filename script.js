const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const lyricsContainer = document.getElementById('lyricsContainer');
const coverArt = document.getElementById('coverArt');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');

const playlistBtn = document.getElementById('playlistBtn');
const closePlaylistBtn = document.getElementById('closePlaylistBtn');
const playlistSidebar = document.getElementById('playlistSidebar');
const playlistContent = document.getElementById('playlistContent');

// Songs Configuration (Playlist)
const songs = [
    {
        title: '平庸',
        artist: '薛之謙',
        path: 'music/平庸_薛之謙.mp3',
        lrc: 'lrc/平庸_薛之謙.lrc'
    },
    {
        title: '放任',
        artist: '汪六六',
        path: 'music/汪六六_放任.mp3',
        lrc: 'lrc/汪六六_放任.lrc'
    },
    {
        title: '頑疾',
        artist: '薛之謙',
        path: 'music/頑疾_薛之謙.mp3',
        lrc: 'lrc/頑疾_薛之謙.lrc'
    },
    {
        title: '友情提示',
        artist: '薛之謙',
        path: 'music/友情提示_薛之謙.mp3',
        lrc: 'lrc/友情提示_薛之謙.lrc'
    },
    // Add more songs here manually
    // {
    //     title: 'Song 2',
    //     artist: 'Artist 2',
    //     path: 'song2.mp3',
    //     lrc: 'song2.lrc'
    // }
];

let currentSongIndex = 0;
let lyricsData = [];
let isPlaying = false;

// Initialize
function init() {
    renderPlaylist();
    loadSong(currentSongIndex);
    
    // Event Listeners
    playBtn.addEventListener('click', () => togglePlay());
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    
    // Playlist Toggle
    playlistBtn.addEventListener('click', () => {
        playlistSidebar.classList.add('active');
    });
    closePlaylistBtn.addEventListener('click', () => {
        playlistSidebar.classList.remove('active');
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audioPlayer.duration);
        progressBar.max = Math.floor(audioPlayer.duration);
    });
    
    // Auto Next
    audioPlayer.addEventListener('ended', () => {
        nextSong();
    });

    progressBar.addEventListener('input', () => {
        audioPlayer.currentTime = progressBar.value;
        syncLyrics();
    });

    volumeBar.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
    });

    // Handle initial volume
    audioPlayer.volume = volumeBar.value / 100;
}

// Render Playlist UI
function renderPlaylist() {
    playlistContent.innerHTML = '';
    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.classList.add('playlist-item');
        if (index === currentSongIndex) item.classList.add('active-song');
        
        item.innerHTML = `
            <div class="song-index">${index + 1}</div>
            <div class="playlist-item-info">
                <span class="playlist-item-title">${song.title}</span>
                <span class="playlist-item-artist">${song.artist}</span>
            </div>
            <div class="playing-indicator">
                <div class="bar"></div>
                <div class="bar"></div>
                <div class="bar"></div>
            </div>
        `;

        item.addEventListener('click', () => {
            if (currentSongIndex !== index) {
                loadSong(index);
                togglePlay(true);
            }
        });

        playlistContent.appendChild(item);
    });
}

function updatePlaylistActiveState() {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
        if (index === currentSongIndex) {
            item.classList.add('active-song');
        } else {
            item.classList.remove('active-song');
        }
    });
}

// Load Song Info
function loadSong(index) {
    currentSongIndex = index;
    const song = songs[index];
    
    audioPlayer.src = song.path;
    songTitle.textContent = song.title;
    artistName.textContent = song.artist;
    
    updatePlaylistActiveState();
    loadLyrics(song.lrc);
    
    // Reset state
    coverArt.classList.remove('playing');
    progressBar.value = 0;
    currentTimeEl.textContent = '0:00';
    isPlaying = false;
    updatePlayIcon();
}

function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = songs.length - 1;
    }
    loadSong(currentSongIndex);
    togglePlay(true);
}

function nextSong() {
    currentSongIndex++;
    if (currentSongIndex > songs.length - 1) {
        currentSongIndex = 0;
    }
    loadSong(currentSongIndex);
    togglePlay(true);
}

// Load and Parse Lyrics
async function loadLyrics(path) {
    lyricsContainer.innerHTML = '<p class="lyrics-placeholder">歌詞載入中...</p>';
    lyricsData = [];
    
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Lyrics not found');
        const lrcText = await response.text();
        parseLyrics(lrcText);
    } catch (error) {
        lyricsContainer.innerHTML = '<p class="lyrics-placeholder">無法載入歌詞</p>';
        console.error(error);
    }
}

function parseLyrics(lrc) {
    const lines = lrc.split('\n');
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lyricsData = lines.map(line => {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();
            return { time, text };
        }
        return null; // Skip non-lyric lines
    }).filter(item => item !== null && item.text !== '');

    renderLyrics();
}

function renderLyrics() {
    lyricsContainer.innerHTML = '';
    lyricsData.forEach((line, index) => {
        const p = document.createElement('p');
        p.classList.add('lyrics-line');
        p.textContent = line.text;
        p.dataset.index = index;
        p.dataset.time = line.time;
        
        // Click line to seek
        p.addEventListener('click', () => {
            audioPlayer.currentTime = line.time;
            togglePlay(true); // Ensure playing
        });
        
        lyricsContainer.appendChild(p);
    });
}

// Playback Controls
function togglePlay(forcePlay = null) {
    if (forcePlay === true) {
        isPlaying = true;
    } else if (forcePlay === false) {
        isPlaying = false;
    } else {
        isPlaying = !isPlaying;
    }

    if (isPlaying) {
        audioPlayer.play().catch(e => console.error("Playback failed:", e)); // Handle auto-play policies
        coverArt.classList.add('playing');
    } else {
        audioPlayer.pause();
        coverArt.classList.remove('playing');
    }
    updatePlayIcon();
}

function updatePlayIcon() {
    playIcon.textContent = isPlaying ? 'pause' : 'play_arrow';
}

// Progress & Sync Logic
function updateProgress() {
    const current = audioPlayer.currentTime;
    progressBar.value = current;
    currentTimeEl.textContent = formatTime(current);
    syncLyrics(current);
}

function syncLyrics(currentTime = audioPlayer.currentTime) {
    // Find active lyric line
    let activeIndex = -1;
    for (let i = 0; i < lyricsData.length; i++) {
        if (lyricsData[i].time <= currentTime) {
            activeIndex = i;
        } else {
            break;
        }
    }

    // Update UI
    const allLines = document.querySelectorAll('.lyrics-line');
    allLines.forEach(line => line.classList.remove('active'));

    if (activeIndex !== -1 && activeIndex < allLines.length) {
        const activeLine = allLines[activeIndex];
        activeLine.classList.add('active');
        
        // Scroll to center
        const wrapperHeight = lyricsContainer.clientHeight;
        const lineTop = activeLine.offsetTop;
        const lineHeight = activeLine.clientHeight;
        
        // Ensure offsetParent is valid (e.g., when visible)
        if (activeLine.offsetParent) {
             lyricsContainer.scrollTo({
                top: lineTop - wrapperHeight / 2 + lineHeight / 2,
                behavior: 'smooth'
            });
        }
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Start
init();
