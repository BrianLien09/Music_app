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

const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');

// Songs Configuration (Playlist)
const songs = [
    {
        title: '平庸',
        artist: '薛之謙',
        cover: 'cover/平庸.jpg',
        path: 'music/平庸_薛之謙.mp3',
        lrc: 'lrc/平庸_薛之謙.lrc'
    },
    {
        title: '頑疾',
        artist: '薛之謙',
        cover: 'cover/頑疾.jpg',
        path: 'music/頑疾_薛之謙.mp3',
        lrc: 'lrc/頑疾_薛之謙.lrc'
    },
    {
        title: '友情提示',
        artist: '薛之謙',
        cover: 'cover/友情提示.jpg',
        path: 'music/友情提示_薛之謙.mp3',
        lrc: 'lrc/友情提示_薛之謙.lrc'
    },
    {
        title: '這麼久沒見',
        artist: '薛之謙',
        cover: 'cover/這麼久沒見.jpg',
        path: 'music/這麼久沒見_薛之謙.mp3',
        lrc: 'lrc/這麼久沒見_薛之謙.lrc'
    },
    {
        title: '陪你去流浪',
        artist: '薛之謙/錘娜麗莎',
        cover: 'cover/陪你去流浪.jpg',
        path: 'music/陪你去流浪_薛之謙&錘娜麗莎.mp3',
        lrc: 'lrc/陪你去流浪_薛之謙&錘娜麗莎.lrc'
    },
    {
        title: '憐憫',
        artist: '張靚穎',
        cover: 'cover/憐憫.jpg',
        path: 'music/憐憫_張靚穎.mp3',
        lrc: 'lrc/憐憫_張靚穎.lrc'
    },
    {
        title: '最後一頁',
        artist: '王赫野/姚曉棠',
        cover: 'cover/最後一頁.jpg',
        path: 'music/最後一頁_王赫野&姚曉棠.mp3',
        lrc: 'lrc/最後一頁_王赫野&姚曉棠.lrc'
    },
    {
        title: '字字句句',
        artist: '王赫野&張碧晨',
        cover: 'cover/字字句句.jpg',
        path: 'music/字字句句_王赫野&張碧晨.mp3',
        lrc: 'lrc/字字句句_王赫野&張碧晨.lrc'
    },
];

let currentSongIndex = 0;
let lyricsData = [];
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0; // 0: All, 1: One, 2: Off

// Initialize
function init() {
    loadSettings();
    renderPlaylist();
    loadSong(currentSongIndex);
    updatePlaybackControlsUI();
    
    // Event Listeners
    playBtn.addEventListener('click', () => togglePlay());
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', () => nextSong(true));
    
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);

    // Playlist Toggle
    playlistBtn.addEventListener('click', () => {
        playlistSidebar.classList.toggle('active');
    });
    closePlaylistBtn.addEventListener('click', () => {
        playlistSidebar.classList.remove('active');
    });

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audioPlayer.duration);
        progressBar.max = Math.floor(audioPlayer.duration);
    });
    
    // Auto Next / Repeat Logic
    audioPlayer.addEventListener('ended', () => {
        if (repeatMode === 1) {
            // Repeat One
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else if (repeatMode === 2) {
            // Repeat Off: Stop unless it's not the last song (linear check only if not shuffle/random)
             if (!isShuffle && currentSongIndex === songs.length - 1) {
                 return;
             }
             nextSong(false);
        } else {
            // Repeat All (Default)
            nextSong(false);
        }
    });

    progressBar.addEventListener('input', () => {
        audioPlayer.currentTime = progressBar.value;
        syncLyrics();
    });

    volumeBar.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
        localStorage.setItem('volume', audioPlayer.volume);
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); 
            togglePlay();
        } else if (e.code === 'ArrowRight') {
            audioPlayer.currentTime = Math.min(audioPlayer.currentTime + 5, audioPlayer.duration);
        } else if (e.code === 'ArrowLeft') {
            audioPlayer.currentTime = Math.max(audioPlayer.currentTime - 5, 0);
        } else if (e.code === 'ArrowUp') {
            e.preventDefault(); 
            const newVol = Math.min(audioPlayer.volume + 0.1, 1);
            audioPlayer.volume = newVol;
            volumeBar.value = newVol * 100;
            localStorage.setItem('volume', newVol);
        } else if (e.code === 'ArrowDown') {
            e.preventDefault(); 
             const newVol = Math.max(audioPlayer.volume - 0.1, 0);
            audioPlayer.volume = newVol;
            volumeBar.value = newVol * 100;
            localStorage.setItem('volume', newVol);
        }
    });
}

function loadSettings() {
    const savedVol = localStorage.getItem('volume');
    if (savedVol !== null) {
        audioPlayer.volume = parseFloat(savedVol);
        volumeBar.value = parseFloat(savedVol) * 100;
    }
    
    const savedIndex = localStorage.getItem('lastSongIndex');
    if (savedIndex !== null) {
        currentSongIndex = parseInt(savedIndex);
        if (currentSongIndex >= songs.length) currentSongIndex = 0;
    }
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
    localStorage.setItem('lastSongIndex', currentSongIndex);
    const song = songs[index];
    
    audioPlayer.src = song.path;
    songTitle.textContent = song.title;
    artistName.textContent = song.artist;
    
    // Dynamic Title
    document.title = `🎵 ${song.title} - ${song.artist}`;

    // Update Cover Art
    if (song.cover) {
        coverArt.innerHTML = `<img src="${song.cover}" alt="${song.title}">`;
    } else {
        coverArt.innerHTML = '<span class="material-icons-round">music_note</span>';
    }
    
    updatePlaylistActiveState();
    loadLyrics(song.lrc);
    
    // Reset state
    coverArt.classList.remove('playing');
    progressBar.value = 0;
    currentTimeEl.textContent = '0:00';
    isPlaying = false;
    updatePlayIcon();
    
    // Reset Lyrics Position
    lyricsContainer.style.transform = 'translateY(0)';
}

function nextSong(isManual = false) {
    if (isShuffle) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * songs.length);
        } while (newIndex === currentSongIndex && songs.length > 1);
        currentSongIndex = newIndex;
    } else {
        currentSongIndex++;
        if (currentSongIndex > songs.length - 1) {
            currentSongIndex = 0;
        }
    }
    loadSong(currentSongIndex);
    togglePlay(true);
}

function prevSong() {
     if (isShuffle) {
         let newIndex;
        do {
            newIndex = Math.floor(Math.random() * songs.length);
        } while (newIndex === currentSongIndex && songs.length > 1);
        currentSongIndex = newIndex;
    } else {
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = songs.length - 1;
        }
    }
    loadSong(currentSongIndex);
    togglePlay(true);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    updatePlaybackControlsUI();
}

function toggleRepeat() {
    repeatMode++;
    if (repeatMode > 2) repeatMode = 0;
    updatePlaybackControlsUI();
}

function updatePlaybackControlsUI() {
    // Shuffle
    if (isShuffle) {
        shuffleBtn.classList.add('active');
    } else {
        shuffleBtn.classList.remove('active');
    }

    // Repeat (Icon change)
    const icon = repeatBtn.querySelector('.material-icons-round');
    if (repeatMode === 0) {
        // Repeat All
        repeatBtn.classList.add('active');
        icon.textContent = 'repeat';
        repeatBtn.title = '循環全部';
    } else if (repeatMode === 1) {
         // Repeat One
        repeatBtn.classList.add('active');
        icon.textContent = 'repeat_one';
        repeatBtn.title = '單曲循環';
    } else {
        // Off
        repeatBtn.classList.remove('active');
        icon.textContent = 'repeat';
        repeatBtn.title = '不循環';
    }
}


// Load and Parse Lyrics
async function loadLyrics(path) {
    lyricsContainer.innerHTML = '<p class="lyrics-placeholder">歌詞載入中...</p>';
    lyricsContainer.style.transform = 'translateY(0)'; // Reset
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
        document.title = `▶ ${songs[currentSongIndex].title} - ${songs[currentSongIndex].artist}`; // Add play icon
    } else {
        audioPlayer.pause();
        coverArt.classList.remove('playing');
        document.title = `⏸ ${songs[currentSongIndex].title} - ${songs[currentSongIndex].artist}`; // Add pause icon
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
    
    // Don't redraw if active line hasn't changed to avoid jitter, 
    // BUT we need to ensure styling is correct if we switched songs
    // Simple check: see if current active class is on the right index
    const currentActive = document.querySelector('.lyrics-line.active');
    const currentActiveIndex = currentActive ? parseInt(currentActive.dataset.index) : -1;

    if (activeIndex !== currentActiveIndex) {
        allLines.forEach(line => line.classList.remove('active'));
        
        if (activeIndex !== -1 && activeIndex < allLines.length) {
            const activeLine = allLines[activeIndex];
            activeLine.classList.add('active');
            
            // New Transform Logic
            // We want the active line to be in the center of the lyrics-card
            // lyrics-wrapper starts at top: 50% (css).
            // So translateY should be - (line.offsetTop + line.height/2)
            
            const lineTop = activeLine.offsetTop;
            const lineHeight = activeLine.clientHeight;
            
            // Because wrapper is top: 50%, a translateY of -(lineTop + lineHeight/2) 
            // moves that point to the vertical center of the screen.
            const offset = -(lineTop + lineHeight / 2);
            
            lyricsContainer.style.transform = `translateY(${offset}px)`;
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
