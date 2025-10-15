#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 开始构建麻辣四格应用...')

try {
  // 清理之前的构建
  console.log('🧹 清理之前的构建文件...')
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true })
  }

  // 安装依赖
  console.log('📦 安装依赖...')
  execSync('npm install', { stdio: 'inherit' })

  // 构建应用
  console.log('🔨 构建应用...')
  execSync('npm run build', { stdio: 'inherit' })

  // 检查构建结果
  if (!fs.existsSync('dist')) {
    throw new Error('构建失败：dist目录不存在')
  }

  console.log('✅ 构建完成！')
  console.log('📁 构建文件位于: dist/')

  // 显示构建信息
  const distStats = fs.statSync('dist')
  console.log(`📊 构建大小: ${(distStats.size / 1024 / 1024).toFixed(2)} MB`)
} catch (error) {
  console.error('❌ 构建失败:', error.message)
  process.exit(1)
}
