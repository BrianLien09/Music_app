/**
 * PWA 圖示生成腳本
 * 
 * 使用方式：
 * 1. 安裝 sharp: npm install sharp --save-dev
 * 2. 執行: node scripts/generate-icons.js
 * 
 * 或者使用線上工具：
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 * 
 * 將 public/icons/icon.svg 上傳即可生成所有尺寸
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SVG_PATH = path.join(ICONS_DIR, 'icon.svg');

// PWA 需要的圖示尺寸
const SIZES = [
  16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512
];

// iOS Splash Screen 尺寸
const SPLASH_SIZES = [
  { width: 640, height: 1136, name: 'splash-640x1136' },
  { width: 750, height: 1334, name: 'splash-750x1334' },
  { width: 1242, height: 2208, name: 'splash-1242x2208' },
];

async function generateIcons() {
  // 確保目錄存在
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  // 讀取 SVG
  const svgBuffer = fs.readFileSync(SVG_PATH);

  console.log('正在生成 PWA 圖示...\n');

  // 生成各尺寸圖示
  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ icon-${size}x${size}.png`);
  }

  // 生成 Splash Screens
  console.log('\n正在生成 Splash Screens...\n');
  
  for (const { width, height, name } of SPLASH_SIZES) {
    const outputPath = path.join(ICONS_DIR, `${name}.png`);
    
    // 計算圖示在 splash screen 中的大小（約 1/3 寬度）
    const iconSize = Math.floor(width / 3);
    
    // 建立背景並置中圖示
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 10, g: 10, b: 15, alpha: 1 } // #0a0a0f
      }
    })
    .composite([{
      input: await sharp(svgBuffer).resize(iconSize, iconSize).toBuffer(),
      gravity: 'centre'
    }])
    .png()
    .toFile(outputPath);
    
    console.log(`✓ ${name}.png`);
  }

  console.log('\n✅ 所有圖示生成完成！');
}

// 檢查是否已安裝 sharp
try {
  require.resolve('sharp');
  generateIcons().catch(console.error);
} catch (e) {
  console.log(`
⚠️  需要安裝 sharp 套件才能生成圖示

請執行以下指令：
  npm install sharp --save-dev

或者使用線上工具生成圖示：
  1. 前往 https://realfavicongenerator.net/
  2. 上傳 public/icons/icon.svg
  3. 下載生成的圖示並放入 public/icons/ 資料夾

所需圖示尺寸：
${SIZES.map(s => `  - icon-${s}x${s}.png`).join('\n')}
  `);
}
