---
description: 一鍵部署到 GitHub Pages
---

# 🚀 GitHub Pages 自動部署工作流

這個工作流會幫助你快速設定並部署專案到 GitHub Pages。

## 📋 前置條件

確認以下項目已完成：

- ✅ 專案已經有 Git repository
- ✅ 已經安裝 Vite (`package.json` 和 `vite.config.js` 存在)
- ✅ 有 GitHub 帳號

## 🎯 執行步驟

### 步驟 1: 確認 GitHub Actions workflow 已建立

檢查是否存在檔案：`.github/workflows/deploy.yml`

如果不存在，workflow 檔案內容應該包含：

- 觸發條件：push 到 main 分支
- 建置步驟：npm ci && npm run build
- 部署步驟：deploy-pages@v4

### 步驟 2: 確認 vite.config.js 設定

確認 `vite.config.js` 的 base 設定為：

```javascript
base: process.env.GITHUB_ACTIONS
  ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'repository名稱'}/`
  : './',
```

### 步驟 3: 推送程式碼到 GitHub

```bash
# 如果還沒有遠端 repository
git remote add origin https://github.com/你的帳號/music_app.git

# 推送程式碼
git add .
git commit -m "feat: 加入 GitHub Pages 自動部署"
git push -u origin main
```

### 步驟 4: 啟用 GitHub Pages

1. 進入 GitHub repository 頁面
2. 點擊 **Settings**
3. 左側選單選擇 **Pages**
4. 在 **Source** 選擇 **GitHub Actions**
5. 儲存設定

### 步驟 5: 等待部署完成

1. 回到 repository 首頁
2. 點擊 **Actions** 分頁
3. 等待部署工作完成（綠色勾勾 ✅）
4. 你的網站會在：`https://你的帳號.github.io/repository名稱/`

## ✅ 驗證部署

訪問你的 GitHub Pages 網址，確認：

- [ ] 網站可以正常訪問
- [ ] 樣式正確載入
- [ ] 音樂播放器功能正常
- [ ] 歌詞可以正常顯示

## 🔄 後續使用

之後每次你修改程式碼並 push 到 GitHub：

```bash
git add .
git commit -m "你的更新說明"
git push
```

GitHub Actions 會自動：

1. 建置專案
2. 部署到 GitHub Pages
3. 約 2-3 分鐘後網站自動更新

## 📚 詳細文件

查看 `GITHUB_PAGES_SETUP.md` 獲取完整的設定指南和常見問題解決方案。

## 🎉 完成！

現在你的專案已經設定好自動部署，每次 push 都會自動更新線上版本！
