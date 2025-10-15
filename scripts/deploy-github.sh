#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法: npm run deploy:github

echo "🚀 开始部署到 GitHub Pages..."

# 检查是否在正确的分支
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  警告: 当前分支是 $current_branch，建议在 main 分支上部署"
fi

# 构建项目
echo "📦 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败，dist 目录不存在"
    exit 1
fi

echo "✅ 构建成功"

# 创建临时分支用于部署
echo "🌿 创建部署分支..."
git checkout -B gh-pages

# 创建 MalaQuad 目录并移动 dist 内容
echo "📁 创建 MalaQuad 目录并移动构建文件..."
mkdir -p MalaQuad
cp -r dist/* MalaQuad/
cp dist/.* MalaQuad/ 2>/dev/null || true

# 添加所有文件
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"

# 推送到 GitHub Pages
echo "🚀 推送到 GitHub Pages..."
git push origin gh-pages --force

# 切换回主分支
echo "🔄 切换回主分支..."
git checkout main

# 删除临时分支
echo "🧹 清理临时分支..."
git branch -D gh-pages

echo "✅ 部署完成！"
echo "🌐 网站将在几分钟后可用: https://mlxr-aa.github.io/MalaQuad/"
