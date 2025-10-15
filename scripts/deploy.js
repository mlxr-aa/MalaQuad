#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 开始部署麻辣四格应用...')

const platform = process.argv[2] || 'web'

try {
  // 检查构建文件
  if (!fs.existsSync('dist')) {
    console.log('📦 构建文件不存在，开始构建...')
    execSync('node scripts/build.js', { stdio: 'inherit' })
  }

  switch (platform) {
    case 'web':
      console.log('🌐 准备Web部署...')
      execSync('npm run preview', { stdio: 'inherit' })
      break

    default:
      console.log('❌ 不支持的平台:', platform)
      console.log('支持的平台: web')
      process.exit(1)
  }

  console.log('✅ 部署准备完成！')
  console.log(`🌐 平台: ${platform}`)
} catch (error) {
  console.error('❌ 部署失败:', error.message)
  process.exit(1)
}
