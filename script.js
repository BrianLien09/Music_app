// ============================================
// DOM 元素快取 (Cache DOM Elements)
// ============================================
const DOM = {
  audio: document.getElementById('audioPlayer'),
  playBtn: document.getElementById('playBtn'),
  playIcon: document.getElementById('playIcon'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  progressBar: document.getElementById('progressBar'),
  volumeBar: document.getElementById('volumeBar'),
  currentTime: document.getElementById('currentTime'),
  duration: document.getElementById('duration'),
  lyricsContainer: document.getElementById('lyricsContainer'),
  coverArt: document.getElementById('coverArt'),
  songTitle: document.getElementById('songTitle'),
  artistName: document.getElementById('artistName'),
  playlistBtn: document.getElementById('playlistBtn'),
  closePlaylistBtn: document.getElementById('closePlaylistBtn'),
  playlistSidebar: document.getElementById('playlistSidebar'),
  playlistContent: document.getElementById('playlistContent'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  repeatBtn: document.getElementById('repeatBtn')
};

// ============================================
// 常數定義 (Constants)
// ============================================
const CONSTANTS = {
  STORAGE_KEYS: {
    VOLUME: 'volume',
    LAST_SONG_INDEX: 'lastSongIndex'
  },
  REPEAT_MODES: {
    ALL: 0,
    ONE: 1,
    OFF: 2
  },
  SEEK_TIME: 5, // 快轉/倒轉秒數
  VOLUME_STEP: 0.1, // 音量調整步進
  DEFAULT_VOLUME: 0.8 // 預設音量
};

// ============================================
// 播放清單資料 (Songs Configuration)
// ============================================
const BASE_URL = import.meta.env.BASE_URL;

const songs = [
  {
    title: '平庸',
    artist: '薛之謙',
    cover: `${BASE_URL}cover/平庸.jpg`,
    path: `${BASE_URL}music/平庸_薛之謙.mp3`,
    lrc: `${BASE_URL}lrc/平庸_薛之謙.lrc`
  },
  {
    title: '頑疾',
    artist: '薛之謙',
    cover: `${BASE_URL}cover/頑疾.jpg`,
    path: `${BASE_URL}music/頑疾_薛之謙.mp3`,
    lrc: `${BASE_URL}lrc/頑疾_薛之謙.lrc`
  },
  {
    title: '友情提示',
    artist: '薛之謙',
    cover: `${BASE_URL}cover/友情提示.jpg`,
    path: `${BASE_URL}music/友情提示_薛之謙.mp3`,
    lrc: `${BASE_URL}lrc/友情提示_薛之謙.lrc`
  },
  {
    title: '這麼久沒見',
    artist: '薛之謙',
    cover: `${BASE_URL}cover/這麼久沒見.jpg`,
    path: `${BASE_URL}music/這麼久沒見_薛之謙.mp3`,
    lrc: `${BASE_URL}lrc/這麼久沒見_薛之謙.lrc`
  },
  {
    title: '陪你去流浪',
    artist: '薛之謙/錘娜麗莎',
    cover: `${BASE_URL}cover/陪你去流浪.jpg`,
    path: `${BASE_URL}music/陪你去流浪_薛之謙&錘娜麗莎.mp3`,
    lrc: `${BASE_URL}lrc/陪你去流浪_薛之謙&錘娜麗莎.lrc`
  },
  {
    title: '憐憫',
    artist: '張靚穎',
    cover: `${BASE_URL}cover/憐憫.jpg`,
    path: `${BASE_URL}music/憐憫_張靚穎.mp3`,
    lrc: `${BASE_URL}lrc/憐憫_張靚穎.lrc`
  },
  {
    title: '最後一頁',
    artist: '王赫野/姚曉棠',
    cover: `${BASE_URL}cover/最後一頁.jpg`,
    path: `${BASE_URL}music/最後一頁_王赫野&姚曉棠.mp3`,
    lrc: `${BASE_URL}lrc/最後一頁_王赫野&姚曉棠.lrc`
  },
  {
    title: '字字句句',
    artist: '王赫野&張碧晨',
    cover: `${BASE_URL}cover/字字句句.jpg`,
    path: `${BASE_URL}music/字字句句_王赫野&張碧晨.mp3`,
    lrc: `${BASE_URL}lrc/字字句句_王赫野&張碧晨.lrc`
  },
  {
    title: '崇拜',
    artist: '薛之謙',
    cover: `${BASE_URL}cover/崇拜.jpg`,
    path: `${BASE_URL}music/崇拜_薛之謙.mp3`,
    lrc: `${BASE_URL}lrc/崇拜_薛之謙.lrc`
  }
];

// ============================================
// 應用狀態 (Application State)
// ============================================
const state = {
  currentSongIndex: 0,
  lyricsData: [],
  isPlaying: false,
  isShuffle: false,
  repeatMode: CONSTANTS.REPEAT_MODES.ALL,
  lastActiveLyricsIndex: -1 // 用來追蹤上次活動的歌詞行，避免不必要的重繪
};

// ============================================
// 工具函式 (Utility Functions)
// ============================================
const Utils = {
  /**
   * 格式化秒數為 mm:ss 格式
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  },

  /**
   * 解析 LRC 歌詞格式
   */
  parseLyrics(lrcText) {
    const lines = lrcText.split('\n');
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    return lines
      .map(line => {
        const match = timeRegex.exec(line);
        if (!match) return null;

        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3], 10);
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = line.replace(timeRegex, '').trim();

        return text ? { time, text } : null;
      })
      .filter(item => item !== null);
  },

  /**
   * 取得隨機索引（不重複當前索引）
   */
  getRandomIndex(currentIndex, arrayLength) {
    if (arrayLength <= 1) return 0;
    
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * arrayLength);
    } while (newIndex === currentIndex);
    
    return newIndex;
  },

  /**
   * 安全的 clamp 函式
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
};

// ============================================
// 本地存儲管理 (Local Storage Manager)
// ============================================
const Storage = {
  /**
   * 載入使用者設定
   */
  loadSettings() {
    // 載入音量
    const savedVolume = localStorage.getItem(CONSTANTS.STORAGE_KEYS.VOLUME);
    if (savedVolume !== null) {
      const volume = parseFloat(savedVolume);
      DOM.audio.volume = volume;
      DOM.volumeBar.value = volume * 100;
    } else {
      DOM.audio.volume = CONSTANTS.DEFAULT_VOLUME;
      DOM.volumeBar.value = CONSTANTS.DEFAULT_VOLUME * 100;
    }
    
    // 載入上次播放的歌曲索引
    const savedIndex = localStorage.getItem(CONSTANTS.STORAGE_KEYS.LAST_SONG_INDEX);
    if (savedIndex !== null) {
      const index = parseInt(savedIndex, 10);
      state.currentSongIndex = Utils.clamp(index, 0, songs.length - 1);
    }
  },

  /**
   * 儲存音量設定
   */
  saveVolume(volume) {
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.VOLUME, volume);
  },

  /**
   * 儲存歌曲索引
   */
  saveSongIndex(index) {
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.LAST_SONG_INDEX, index);
  }
};

// ============================================
// UI 更新相關 (UI Updates)
// ============================================
const UI = {
  /**
   * 更新播放/暫停圖示
   */
  updatePlayIcon() {
    DOM.playIcon.textContent = state.isPlaying ? 'pause' : 'play_arrow';
  },

  /**
   * 更新專輯封面
   */
  updateCoverArt(song) {
    if (song.cover) {
      DOM.coverArt.innerHTML = `<img src="${song.cover}" alt="${song.title}">`;
    } else {
      DOM.coverArt.innerHTML = '<span class="material-icons-round">music_note</span>';
    }
  },

  /**
   * 更新歌曲資訊顯示
   */
  updateSongInfo(song) {
    DOM.songTitle.textContent = song.title;
    DOM.artistName.textContent = song.artist;
    document.title = `🎵 ${song.title} - ${song.artist}`;
  },

  /**
   * 更新播放控制按鈕狀態（隨機/循環）
   */
  updatePlaybackControls() {
    // 隨機播放按鈕
    DOM.shuffleBtn.classList.toggle('active', state.isShuffle);

    // 循環模式按鈕
    const icon = DOM.repeatBtn.querySelector('.material-icons-round');
    DOM.repeatBtn.classList.toggle('active', state.repeatMode !== CONSTANTS.REPEAT_MODES.OFF);

    switch (state.repeatMode) {
      case CONSTANTS.REPEAT_MODES.ALL:
        icon.textContent = 'repeat';
        DOM.repeatBtn.title = '循環全部';
        break;
      case CONSTANTS.REPEAT_MODES.ONE:
        icon.textContent = 'repeat_one';
        DOM.repeatBtn.title = '單曲循環';
        break;
      case CONSTANTS.REPEAT_MODES.OFF:
        icon.textContent = 'repeat';
        DOM.repeatBtn.title = '不循環';
        break;
    }
  },

  /**
   * 更新播放列表中的活動狀態
   */
  updatePlaylistActiveState() {
    const items = document.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
      item.classList.toggle('active-song', index === state.currentSongIndex);
    });
  },

  /**
   * 渲染播放列表
   */
  renderPlaylist() {
    DOM.playlistContent.innerHTML = songs
      .map((song, index) => `
        <div class="playlist-item ${index === state.currentSongIndex ? 'active-song' : ''}" data-index="${index}">
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
        </div>
      `)
      .join('');

    // 使用事件委派綁定點擊事件
    DOM.playlistContent.addEventListener('click', (e) => {
      const item = e.target.closest('.playlist-item');
      if (!item) return;

      const index = parseInt(item.dataset.index, 10);
      if (state.currentSongIndex !== index) {
        Player.loadSong(index);
        Player.togglePlay(true);
      }
    });
  },

  /**
   * 顯示歌詞載入中
   */
  showLyricsLoading() {
    DOM.lyricsContainer.innerHTML = '<p class="lyrics-placeholder">歌詞載入中...</p>';
    DOM.lyricsContainer.style.transform = 'translateY(0)';
  },

  /**
   * 顯示歌詞載入失敗
   */
  showLyricsError() {
    DOM.lyricsContainer.innerHTML = '<p class="lyrics-placeholder">無法載入歌詞</p>';
  },

  /**
   * 渲染歌詞內容
   */
  renderLyrics(lyricsData) {
    DOM.lyricsContainer.innerHTML = lyricsData
      .map((line, index) => `
        <p class="lyrics-line" data-index="${index}" data-time="${line.time}">
          ${line.text}
        </p>
      `)
      .join('');

    // 使用事件委派綁定歌詞點擊事件
    DOM.lyricsContainer.addEventListener('click', (e) => {
      const line = e.target.closest('.lyrics-line');
      if (!line) return;

      const time = parseFloat(line.dataset.time);
      DOM.audio.currentTime = time;
      Player.togglePlay(true);
    });
  }
};

// ============================================
// 歌詞管理 (Lyrics Manager)
// ============================================
const Lyrics = {
  /**
   * 載入並解析歌詞檔案
   */
  async load(lrcPath) {
    UI.showLyricsLoading();
    state.lyricsData = [];
    state.lastActiveLyricsIndex = -1;
    
    try {
      const response = await fetch(lrcPath);
      if (!response.ok) throw new Error('Lyrics not found');
      
      const lrcText = await response.text();
      state.lyricsData = Utils.parseLyrics(lrcText);
      UI.renderLyrics(state.lyricsData);
    } catch (error) {
      console.error('載入歌詞失敗:', error);
      UI.showLyricsError();
    }
  },

  /**
   * 同步歌詞高亮與滾動
   */
  sync(currentTime = DOM.audio.currentTime) {
    if (state.lyricsData.length === 0) return;

    // 找到當前應該高亮的歌詞行
    let activeIndex = -1;
    for (let i = 0; i < state.lyricsData.length; i++) {
      if (state.lyricsData[i].time <= currentTime) {
        activeIndex = i;
      } else {
        break;
      }
    }

    // 如果活動歌詞行沒有變化，不需要重繪（效能優化）
    if (activeIndex === state.lastActiveLyricsIndex) return;

    state.lastActiveLyricsIndex = activeIndex;
    const allLines = document.querySelectorAll('.lyrics-line');

    // 移除所有高亮
    allLines.forEach(line => line.classList.remove('active'));
    
    // 高亮當前歌詞並滾動到中央
    if (activeIndex !== -1 && activeIndex < allLines.length) {
      const activeLine = allLines[activeIndex];
      activeLine.classList.add('active');
      
      // 計算滾動位置：將當前歌詞行滾動到容器中央
      // lyrics-wrapper 的 top: 50% 已經將其定位在中央
      // 所以只需要 translateY 負的 (offsetTop + height/2)
      const lineTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;
      const offset = -(lineTop + lineHeight / 2);
      
      DOM.lyricsContainer.style.transform = `translateY(${offset}px)`;
    }
  }
};

// ============================================
// 播放器核心邏輯 (Player Core)
// ============================================
const Player = {
  /**
   * 載入指定索引的歌曲
   */
  loadSong(index) {
    state.currentSongIndex = index;
    Storage.saveSongIndex(index);
    
    const song = songs[index];
    
    // 更新音訊源
    DOM.audio.src = song.path;
    
    // 更新 UI
    UI.updateSongInfo(song);
    UI.updateCoverArt(song);
    UI.updatePlaylistActiveState();
    
    // 載入歌詞
    Lyrics.load(song.lrc);
    
    // 重置播放狀態
    DOM.coverArt.classList.remove('playing');
    DOM.progressBar.value = 0;
    DOM.currentTime.textContent = '0:00';
    state.isPlaying = false;
    UI.updatePlayIcon();
  },

  /**
   * 切換播放/暫停
   */
  togglePlay(forcePlay = null) {
    // 處理強制播放/暫停
    if (forcePlay !== null) {
      state.isPlaying = forcePlay;
    } else {
      state.isPlaying = !state.isPlaying;
    }

    if (state.isPlaying) {
      DOM.audio.play().catch(e => console.error("播放失敗:", e));
      DOM.coverArt.classList.add('playing');
      document.title = `▶ ${songs[state.currentSongIndex].title} - ${songs[state.currentSongIndex].artist}`;
    } else {
      DOM.audio.pause();
      DOM.coverArt.classList.remove('playing');
      document.title = `⏸ ${songs[state.currentSongIndex].title} - ${songs[state.currentSongIndex].artist}`;
    }
    
    UI.updatePlayIcon();
  },

  /**
   * 下一首
   */
  nextSong() {
    if (state.isShuffle) {
      state.currentSongIndex = Utils.getRandomIndex(state.currentSongIndex, songs.length);
    } else {
      state.currentSongIndex = (state.currentSongIndex + 1) % songs.length;
    }
    
    this.loadSong(state.currentSongIndex);
    this.togglePlay(true);
  },

  /**
   * 上一首
   */
  prevSong() {
    if (state.isShuffle) {
      state.currentSongIndex = Utils.getRandomIndex(state.currentSongIndex, songs.length);
    } else {
      state.currentSongIndex = state.currentSongIndex - 1;
      if (state.currentSongIndex < 0) {
        state.currentSongIndex = songs.length - 1;
      }
    }
    
    this.loadSong(state.currentSongIndex);
    this.togglePlay(true);
  },

  /**
   * 切換隨機播放
   */
  toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    UI.updatePlaybackControls();
  },

  /**
   * 切換循環模式
   */
  toggleRepeat() {
    state.repeatMode = (state.repeatMode + 1) % 3;
    UI.updatePlaybackControls();
  },

  /**
   * 更新播放進度條
   */
  updateProgress() {
    const current = DOM.audio.currentTime;
    DOM.progressBar.value = current;
    DOM.currentTime.textContent = Utils.formatTime(current);
    Lyrics.sync(current);
  },

  /**
   * 處理歌曲結束事件
   */
  handleSongEnded() {
    switch (state.repeatMode) {
      case CONSTANTS.REPEAT_MODES.ONE:
        // 單曲循環
        DOM.audio.currentTime = 0;
        DOM.audio.play();
        break;
      
      case CONSTANTS.REPEAT_MODES.OFF:
        // 不循環：到最後一首就停止
        if (!state.isShuffle && state.currentSongIndex === songs.length - 1) {
          return;
        }
        this.nextSong();
        break;
      
      case CONSTANTS.REPEAT_MODES.ALL:
      default:
        // 循環全部
        this.nextSong();
        break;
    }
  }
};

// ============================================
// 事件監聽器管理 (Event Listeners)
// ============================================
const Events = {
  /**
   * 初始化所有事件監聽器
   */
  init() {
    // 播放控制
    DOM.playBtn.addEventListener('click', () => Player.togglePlay());
    DOM.prevBtn.addEventListener('click', () => Player.prevSong());
    DOM.nextBtn.addEventListener('click', () => Player.nextSong());
    DOM.shuffleBtn.addEventListener('click', () => Player.toggleShuffle());
    DOM.repeatBtn.addEventListener('click', () => Player.toggleRepeat());

    // 播放列表面板
    DOM.playlistBtn.addEventListener('click', () => {
      DOM.playlistSidebar.classList.toggle('active');
    });
    DOM.closePlaylistBtn.addEventListener('click', () => {
      DOM.playlistSidebar.classList.remove('active');
    });

    // 音訊事件
    DOM.audio.addEventListener('timeupdate', () => Player.updateProgress());
    DOM.audio.addEventListener('loadedmetadata', () => {
      DOM.duration.textContent = Utils.formatTime(DOM.audio.duration);
      DOM.progressBar.max = Math.floor(DOM.audio.duration);
    });
    DOM.audio.addEventListener('ended', () => Player.handleSongEnded());

    // 進度條與音量條
    DOM.progressBar.addEventListener('input', () => {
      DOM.audio.currentTime = DOM.progressBar.value;
      Lyrics.sync();
    });

    DOM.volumeBar.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      DOM.audio.volume = volume;
      Storage.saveVolume(volume);
    });

    // 鍵盤快捷鍵
    this.initKeyboardShortcuts();
  },

  /**
   * 初始化鍵盤快捷鍵
   */
  initKeyboardShortcuts() {
    const keyActions = {
      'Space': (e) => {
        e.preventDefault();
        Player.togglePlay();
      },
      'ArrowRight': () => {
        DOM.audio.currentTime = Utils.clamp(
          DOM.audio.currentTime + CONSTANTS.SEEK_TIME,
          0,
          DOM.audio.duration
        );
      },
      'ArrowLeft': () => {
        DOM.audio.currentTime = Utils.clamp(
          DOM.audio.currentTime - CONSTANTS.SEEK_TIME,
          0,
          DOM.audio.duration
        );
      },
      'ArrowUp': (e) => {
        e.preventDefault();
        const newVolume = Utils.clamp(
          DOM.audio.volume + CONSTANTS.VOLUME_STEP,
          0,
          1
        );
        DOM.audio.volume = newVolume;
        DOM.volumeBar.value = newVolume * 100;
        Storage.saveVolume(newVolume);
      },
      'ArrowDown': (e) => {
        e.preventDefault();
        const newVolume = Utils.clamp(
          DOM.audio.volume - CONSTANTS.VOLUME_STEP,
          0,
          1
        );
        DOM.audio.volume = newVolume;
        DOM.volumeBar.value = newVolume * 100;
        Storage.saveVolume(newVolume);
      }
    };

    document.addEventListener('keydown', (e) => {
      const action = keyActions[e.code];
      if (action) action(e);
    });
  }
};

// ============================================
// 應用初始化 (App Initialization)
// ============================================
function init() {
  // 載入使用者設定
  Storage.loadSettings();
  
  // 渲染 UI
  UI.renderPlaylist();
  UI.updatePlaybackControls();
  
  // 載入歌曲
  Player.loadSong(state.currentSongIndex);
  
  // 初始化事件監聽器
  Events.init();
}

// 啟動應用
init();
