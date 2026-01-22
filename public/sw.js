// ============================================
// Service Worker - Glass Music Player PWA
// 支援離線快取與背景音樂播放
// ============================================

const CACHE_NAME = 'glass-music-player-v1';
const STATIC_CACHE_NAME = 'static-v1';
const MUSIC_CACHE_NAME = 'music-v1';

// 靜態資源 - 安裝時預快取
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// ============================================
// 安裝事件 - 預快取靜態資源
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] 安裝中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 預快取靜態資源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 立即啟用新的 Service Worker
        return self.skipWaiting();
      })
  );
});

// ============================================
// 啟用事件 - 清理舊快取
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] 啟用中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // 刪除舊版本快取
              return name !== STATIC_CACHE_NAME && 
                     name !== MUSIC_CACHE_NAME &&
                     name !== CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] 刪除舊快取:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // 立即控制所有頁面
        return self.clients.claim();
      })
  );
});

// ============================================
// 請求攔截 - 快取策略
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只處理同源請求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 根據資源類型選擇快取策略
  if (isStaticAsset(url.pathname)) {
    // 靜態資源：Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isMusicAsset(url.pathname)) {
    // 音樂檔案：Cache First（較大檔案，優先使用快取）
    event.respondWith(cacheFirst(request, MUSIC_CACHE_NAME));
  } else if (isLrcAsset(url.pathname)) {
    // 歌詞檔案：Network First（可能會更新）
    event.respondWith(networkFirst(request, STATIC_CACHE_NAME));
  } else {
    // 其他資源：Network First
    event.respondWith(networkFirst(request, CACHE_NAME));
  }
});

// ============================================
// 快取策略函式
// ============================================

/**
 * Cache First 策略
 * 優先使用快取，快取沒有再從網路取得
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // 只快取成功的回應
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] 網路請求失敗:', error);
    // 返回離線頁面或錯誤回應
    return new Response('離線中', { status: 503 });
  }
}

/**
 * Network First 策略
 * 優先從網路取得，失敗則使用快取
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // 快取成功的回應
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] 網路失敗，使用快取:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('離線中，且無快取資源', { status: 503 });
  }
}

// ============================================
// 輔助函式 - 資源類型判斷
// ============================================

function isStaticAsset(pathname) {
  return /\.(html|css|js|json|woff2?|ttf|eot)$/i.test(pathname) ||
         pathname === '/' ||
         pathname === '';
}

function isMusicAsset(pathname) {
  return /\.(mp3|wav|ogg|m4a|flac)$/i.test(pathname);
}

function isLrcAsset(pathname) {
  return /\.lrc$/i.test(pathname);
}

function isImageAsset(pathname) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname);
}

// ============================================
// 背景同步（可選功能）
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-playlist') {
    console.log('[SW] 背景同步播放列表');
    // 可在此實作播放列表同步邏輯
  }
});

// ============================================
// 推送通知（可選功能）
// ============================================
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Glass Music Player', {
        body: data.body || '有新消息',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-72x72.png',
        tag: 'music-notification'
      })
    );
  }
});

console.log('[SW] Service Worker 已載入');
