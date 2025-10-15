import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 图标尺寸配置
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
]

// Apple Touch Icon 尺寸
const appleTouchIconSizes = [{ size: 180, name: 'apple-touch-icon.png' }]

// 确保输出目录存在
const iconsDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

async function generateIcons() {
  try {
    const inputPath = path.join(__dirname, '../public/icons/icon.svg')

    // 检查源文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.error('源图标文件不存在:', inputPath)
      return
    }

    console.log('开始生成图标...')

    // 生成标准图标
    for (const config of iconSizes) {
      await sharp(inputPath)
        .resize(config.size, config.size)
        .png()
        .toFile(path.join(iconsDir, config.name))

      console.log(`✓ 生成 ${config.name} (${config.size}x${config.size})`)
    }

    // 生成 Apple Touch Icon
    for (const config of appleTouchIconSizes) {
      await sharp(inputPath)
        .resize(config.size, config.size)
        .png()
        .toFile(path.join(iconsDir, config.name))

      console.log(`✓ 生成 ${config.name} (${config.size}x${config.size})`)
    }

    // 生成 favicon.ico (16x16)
    await sharp(inputPath)
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.ico'))

    console.log('✓ 生成 favicon.ico')

    // 生成 apple-touch-icon.png (180x180)
    await sharp(inputPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '../public/apple-touch-icon.png'))

    console.log('✓ 生成 apple-touch-icon.png')

    console.log('\n🎉 所有图标生成完成！')
    console.log('生成的图标文件：')

    // 列出生成的文件
    const files = fs.readdirSync(iconsDir)
    files.forEach((file) => {
      const filePath = path.join(iconsDir, file)
      const stats = fs.statSync(filePath)
      console.log(`  - ${file} (${stats.size} bytes)`)
    })
  } catch (error) {
    console.error('生成图标时出错:', error)
    process.exit(1)
  }
}

// 运行脚本
generateIcons()
