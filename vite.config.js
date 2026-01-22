import { defineConfig } from 'vite';

export default defineConfig({
  // 開發伺服器設定
  server: {
    port: 3000,
    open: true, // 啟動時自動開啟瀏覽器
    cors: true  // 解決 CORS 問題，確保歌詞檔案能正常載入
  },

  // 建置設定
  build: {
    outDir: 'dist',           // 輸出目錄
    assetsDir: 'assets',      // 靜態資源目錄
    sourcemap: false,         // 生產環境不需要 source map
    minify: 'esbuild',        // 使用 esbuild 壓縮（速度更快，Vite 內建）
    
    // esbuild 壓縮選項
    esbuild: {
      drop: ['console', 'debugger']  // 移除 console 和 debugger
    },

    // 程式碼分割策略
    rollupOptions: {
      output: {
        // 手動分割 chunks，提升快取效率
        manualChunks: {
          // 如果未來引入第三方庫，可以這樣分割
          // 'vendor': ['library-name']
        },
        // 檔名格式（含 hash 用於快取破壞）
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },

    // 最佳化設定
    chunkSizeWarningLimit: 1000, // chunk 大小警告閾值 (KB)
    
    // 效能優化
    reportCompressedSize: true,   // 顯示壓縮後大小
    cssCodeSplit: true,           // CSS 程式碼分割
  },

  // 公共基礎路徑
  // 開發時使用 './'，部署到 GitHub Pages 時使用 '/Repository名稱/'
  // GitHub Actions 會自動設定 GITHUB_REPOSITORY 環境變數
  base: process.env.GITHUB_ACTIONS 
    ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'music_app'}/`
    : './',

  // 靜態資源處理
  assetsInclude: ['**/*.lrc'], // 確保 .lrc 檔案被視為資源
  
  // PWA 相關：確保 Service Worker 和 manifest 被正確複製
  publicDir: 'public',

  // 預處理器選項（如果使用 SCSS/LESS）
  css: {
    devSourcemap: true // 開發時啟用 CSS source map
  }
});
