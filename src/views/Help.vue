<template>
  <div class="help-container">
    <div class="help-header">
      <h1>使用帮助</h1>
      <p>快速了解麻辣四格的使用方法</p>
    </div>

    <div class="help-content">
      <!-- 快速开始 -->
      <section class="help-section">
        <h2>🚀 快速开始</h2>
        <div class="help-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>创建新故事</h3>
              <p>点击"新建故事"按钮，填写基本信息</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>创作序幕</h3>
              <p>填写标题、副标题、作者信息和上传封面图片</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>完成四幕故事</h3>
              <p>按顺序创作四幕故事，每幕包含图片和文本</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>预览和保存</h3>
              <p>预览完整故事效果，满意后保存主题</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 创作技巧 -->
      <section class="help-section">
        <h2>💡 创作技巧</h2>
        <div class="tips-grid">
          <div class="tip-card">
            <h3>📸 图片选择</h3>
            <ul>
              <li>使用16:9比例的图片</li>
              <li>保持视觉风格统一</li>
              <li>确保图片清晰</li>
              <li>符合故事情感</li>
            </ul>
          </div>
          <div class="tip-card">
            <h3>✍️ 文本创作</h3>
            <ul>
              <li>每幕50-200字</li>
              <li>情感递进：轻松→紧张→圆满</li>
              <li>使用生动对话</li>
              <li>控制故事节奏</li>
            </ul>
          </div>
          <div class="tip-card">
            <h3>🎭 故事结构</h3>
            <ul>
              <li>四幕围绕同一主题</li>
              <li>主要人物贯穿始终</li>
              <li>故事发展符合逻辑</li>
              <li>完整的情感弧线</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 功能说明 -->
      <section class="help-section">
        <h2>🔧 功能说明</h2>
        <div class="feature-list">
          <div class="feature-item">
            <h3>故事管理</h3>
            <p>创建、编辑、预览、删除故事，支持批量操作</p>
          </div>
          <div class="feature-item">
            <h3>数据管理</h3>
            <p>自动保存、导入导出、离线使用</p>
          </div>
          <div class="feature-item">
            <h3>个性化设置</h3>
            <p>主题切换、字体大小、无障碍支持</p>
          </div>
        </div>
      </section>

      <!-- 常见问题 -->
      <section class="help-section">
        <h2>❓ 常见问题</h2>
        <div class="faq-list">
          <div class="faq-item">
            <h3>如何上传图片？</h3>
            <p>点击图片区域，选择"拍照"或"从相册选择"</p>
          </div>
          <div class="faq-item">
            <h3>可以离线使用吗？</h3>
            <p>可以！安装为PWA后支持离线编辑</p>
          </div>
          <div class="faq-item">
            <h3>如何分享作品？</h3>
            <p>预览时点击分享按钮，或导出后分享</p>
          </div>
          <div class="faq-item">
            <h3>数据会丢失吗？</h3>
            <p>不会，应用会自动保存您的创作</p>
          </div>
        </div>
      </section>

      <!-- 联系支持 -->
      <section class="help-section">
        <h2>🆘 需要帮助？</h2>
        <div class="support-options">
          <div class="support-card">
            <h3>📚 详细文档</h3>
            <p>查看完整的使用说明和最佳实践</p>
            <button class="btn btn-outline" @click="openManual">
              查看详细说明
            </button>
          </div>
          <div class="support-card">
            <h3>💬 用户反馈</h3>
            <p>遇到问题或有建议？加入我们的社区讨论</p>
            <div class="discussion-links">
              <a
                href="https://pd.qq.com/s/1dxcsj9ts"
                target="_blank"
                class="discussion-link"
              >
                <span class="link-icon">📢</span>
                <span class="link-text">腾讯频道</span>
                <span class="link-desc">有男不玩ml吧专属频道</span>
              </a>
              <a
                href="https://tieba.baidu.com/f?kw=%E6%9C%89%E7%94%B7%E4%B8%8D%E7%8E%A9ml&ie=utf-8"
                target="_blank"
                class="discussion-link"
              >
                <span class="link-icon">💬</span>
                <span class="link-text">百度贴吧</span>
                <span class="link-desc">有男不玩ml吧</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const openManual = () => {
  // 这里可以打开详细说明页面或外部链接
  window.open('https://github.com/mlxr-aa/MalaQuad', '_blank')
}
</script>

<style scoped>
.help-container {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 20px;
}

.help-header {
  text-align: center;
  margin-bottom: 40px;
}

.help-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: var(--color-primary);
}

.help-header p {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.help-content {
  max-width: 800px;
  margin: 0 auto;
}

.help-section {
  margin-bottom: 40px;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--shadow-md);
}

.help-section h2 {
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: var(--color-primary);
}

.help-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.step-content h3 {
  font-size: 1.3rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.step-content p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.tip-card {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

.tip-card h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: var(--color-primary);
}

.tip-card ul {
  list-style: none;
  padding: 0;
}

.tip-card li {
  padding: 5px 0;
  color: var(--text-secondary);
  position: relative;
  padding-left: 20px;
}

.tip-card li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: bold;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  padding: 20px;
  background: var(--bg-primary);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.feature-item h3 {
  font-size: 1.3rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.feature-item p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.faq-item {
  padding: 20px;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.faq-item h3 {
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: var(--color-primary);
}

.faq-item p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.support-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.support-card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.support-card h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: var(--color-primary);
}

.support-card p {
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.discussion-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.discussion-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  color: var(--text-primary);
  transition: all var(--transition-base);
  cursor: pointer;
}

.discussion-link:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.link-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.link-text {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.link-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-left: auto;
}

.discussion-link:hover .link-desc {
  color: rgba(255, 255, 255, 0.8);
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: white;
}

@media (max-width: 768px) {
  .help-container {
    padding: 15px;
  }

  .help-header h1 {
    font-size: 2rem;
  }

  .help-section {
    padding: 20px;
  }

  .step {
    flex-direction: column;
    text-align: center;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }

  .support-options {
    grid-template-columns: 1fr;
  }

  .discussion-links {
    gap: 8px;
  }

  .discussion-link {
    padding: 10px 12px;
    gap: 10px;
  }

  .link-icon {
    font-size: 16px;
  }

  .link-text {
    font-size: var(--font-size-sm);
  }

  .link-desc {
    font-size: var(--font-size-xs);
  }
}
</style>
