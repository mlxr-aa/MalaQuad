<template>
  <div class="home">
    <div class="container">
      <!-- 应用标题 -->
      <div class="hero-section">
        <h1 class="app-title">麻辣四格</h1>
        <p class="app-subtitle">短剧故事快速创作应用</p>
        <p class="app-description">
          用"序幕 + 四图四文"快速创作短剧故事，实现"二人幸终"的完满结局
        </p>
      </div>

      <!-- 故事选择 -->
      <div v-if="themes.length > 0" class="themes-section">
        <h2 class="section-title">选择故事</h2>
        <div class="themes-grid">
          <div
            v-for="theme in themes"
            :key="theme.id"
            class="theme-card"
            :class="{
              active: currentThemeId === theme.id,
              'is-draft': isDraft(theme),
            }"
            @click="selectTheme(theme.id)"
          >
            <div v-if="theme.prelude.coverImage" class="theme-cover">
              <img
                :src="theme.prelude.coverImage"
                :alt="theme.title"
                class="cover-image"
              />
            </div>
            <div v-else class="theme-cover no-image">
              <span class="no-image-icon">📖</span>
            </div>
            <div class="theme-info">
              <div class="theme-header">
                <h3 class="theme-title">
                  {{ theme.prelude.title || theme.title }}
                </h3>
                <span v-if="isDraft(theme)" class="draft-badge">草稿</span>
              </div>
              <p v-if="theme.prelude.subtitle" class="theme-description">
                {{ theme.prelude.subtitle }}
              </p>
              <div class="theme-meta">
                <span class="created-date"
                  >{{ isDraft(theme) ? '最后修改' : '创建时间' }}：{{
                    formatDate(
                      theme.meta?.updatedAt ||
                        theme.meta?.createdAt ||
                        new Date().toISOString()
                    )
                  }}</span
                >
              </div>
            </div>

            <!-- 主题操作按钮 -->
            <div class="theme-actions">
              <button
                class="action-btn delete-btn"
                @click.stop="deleteTheme(theme.id)"
                title="删除主题"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="themeStore.isLoading" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <h3 class="loading-title">正在加载主题...</h3>
          <p class="loading-message">请稍候</p>
        </div>
      </div>

      <!-- 错误状态 - 现在不会显示，因为错误时直接清空状态 -->

      <!-- 无主题状态 -->
      <div v-else class="empty-themes">
        <div class="empty-content">
          <div class="empty-icon">📚</div>
          <h3 class="empty-title">暂无主题</h3>
          <p class="empty-message">开始创建您的第一个主题吧</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <div class="action-buttons-grid">
          <button
            class="btn btn-primary btn-large"
            @click="goToReader"
            :disabled="!currentThemeId"
          >
            <span class="btn-icon">📖</span>
            开始阅读
          </button>
          <button
            class="btn btn-secondary btn-large"
            @click="goToNewStepEditor"
          >
            <span class="btn-icon">🎬</span>
            新建故事
          </button>
          <button
            class="btn btn-outline btn-large"
            @click="goToStepEditor"
            :disabled="!currentThemeId"
            :class="{ disabled: !currentThemeId }"
          >
            <span class="btn-icon">🎯</span>
            编辑故事
          </button>
          <button class="btn btn-outline btn-large" @click="importTheme">
            <span class="btn-icon">📥</span>
            导入故事
          </button>
          <button
            class="btn btn-outline btn-large"
            @click="exportTheme"
            :disabled="!currentThemeId"
            :class="{ disabled: !currentThemeId }"
          >
            <span class="btn-icon">📤</span>
            导出故事
          </button>
          <button class="btn btn-ghost btn-large" @click="goToHelp">
            <span class="btn-icon">❓</span>
            使用帮助
          </button>
        </div>
      </div>

      <!-- 功能说明 -->
      <div class="features-section">
        <h2 class="section-title">功能特色</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🎭</div>
            <h3 class="feature-title">5幕结构</h3>
            <p class="feature-description">序幕 + 四图四文的经典叙事结构</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📱</div>
            <h3 class="feature-title">移动优先</h3>
            <p class="feature-description">专为移动设备优化的阅读体验</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚡</div>
            <h3 class="feature-title">快速创作</h3>
            <p class="feature-description">快速创作短剧故事的完整流程</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">💝</div>
            <h3 class="feature-title">二人幸终</h3>
            <p class="feature-description">每部作品都有完满的结局</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog
      :show="showExportDialog"
      :theme="selectedTheme"
      @close="closeExportDialog"
      @export-complete="handleExportComplete"
    />

    <!-- 导入对话框 -->
    <ImportDialog
      :show="showImportDialog"
      @close="closeImportDialog"
      @import-complete="handleImportComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import ExportDialog from '@/components/common/ExportDialog.vue'
import ImportDialog from '@/components/common/ImportDialog.vue'
import type { Theme } from '@/types'
import type { ThemeV2 } from '@/types/v2'

const router = useRouter()
const appStore = useAppStore()
const themeStore = useThemeStore()

// 响应式状态
const showExportDialog = ref(false)
const showImportDialog = ref(false)
const selectedTheme = ref<Theme | null>(null)

// 计算属性
const themes = computed(() => themeStore.availableThemes)
const currentThemeId = computed(() => appStore.currentThemeId)

// 方法
const selectTheme = (themeId: string) => {
  appStore.setTheme(themeId)
  // 只选中主题，不自动开始阅读
}

// 判断是否为草稿
const isDraft = (theme: Theme | ThemeV2): boolean => {
  // 检查主题是否有草稿标记
  if (theme.meta?.isDraft) {
    return true
  }

  // 检查主题是否完整（v2格式）
  if (Array.isArray(theme.scenes)) {
    // v2格式：检查所有场景是否都有内容
    return theme.scenes.some(
      (scene) => !scene.content || scene.content.trim() === ''
    )
  }

  // v1格式：检查场景内容
  const v1Theme = theme as any
  if (v1Theme.scenes) {
    return (
      !v1Theme.scenes.scene1 ||
      !v1Theme.scenes.scene2 ||
      !v1Theme.scenes.scene3 ||
      !v1Theme.scenes.epilogue
    )
  }

  return false
}

const goToReader = () => {
  if (currentThemeId.value) {
    router.push('/reader')
  }
}

const goToNewStepEditor = () => {
  // 清除当前选中的主题，确保是新建模式
  appStore.clearTheme()
  console.log('Navigating to step editor for new theme')
  router.push('/step-editor')
}

const goToStepEditor = () => {
  if (!currentThemeId.value) {
    alert('请先选择一个故事进行编辑')
    return
  }
  console.log('Navigating to step editor for theme:', currentThemeId.value)
  router.push('/step-editor')
}

const goToHelp = () => {
  router.push('/help')
}

const importTheme = () => {
  showImportDialog.value = true
}

const exportTheme = async () => {
  if (!currentThemeId.value) {
    alert('请先选择一个故事进行导出')
    return
  }

  try {
    // 加载选中的主题数据
    const theme = await themeStore.loadTheme(currentThemeId.value)
    if (!theme) {
      alert('主题加载失败，无法导出')
      return
    }

    selectedTheme.value = theme as any
    showExportDialog.value = true
  } catch (error) {
    console.error('Failed to load theme for export:', error)
    alert('加载主题失败，无法导出')
  }
}

const closeExportDialog = () => {
  showExportDialog.value = false
  selectedTheme.value = null
}

const handleExportComplete = (result: any) => {
  console.log('Export completed:', result)
  closeExportDialog()
  alert('主题导出成功！')
}

const closeImportDialog = () => {
  showImportDialog.value = false
}

const handleImportComplete = async (result: {
  success: boolean
  theme?: Theme | ThemeV2
  error?: string
}) => {
  console.log('导入结果:', result)

  if (result.success && result.theme) {
    try {
      console.log('准备保存主题:', result.theme)

      // 保存导入的主题
      const saveResult = await themeStore.saveTheme(result.theme)
      console.log('保存结果:', saveResult)

      if (saveResult) {
        // 重新加载主题列表
        await themeStore.loadThemes()

        // 选中新导入的主题
        appStore.setTheme(result.theme.id)

        alert('主题导入成功！')
      } else {
        alert('主题数据验证失败，请检查主题格式')
      }
    } catch (error) {
      console.error('保存导入主题失败:', error)
      alert(`保存导入主题失败: ${error}`)
    }
  } else {
    alert(result.error || '导入失败')
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const deleteTheme = async (themeId: string) => {
  if (confirm('确定要删除这个主题吗？删除后无法恢复。')) {
    try {
      await themeStore.deleteTheme(themeId)

      // 如果删除的是当前选中的主题，清空当前主题
      if (currentThemeId.value === themeId) {
        appStore.clearTheme()
      }

      alert('主题已删除')
    } catch (error) {
      alert('删除主题失败')
      console.error('Delete theme error:', error)
    }
  }
}

// 主题切换功能已移至App.vue中的ThemeToggle组件

// 重试加载方法已移除，因为不再需要

// 生命周期
onMounted(async () => {
  // 加载主题列表，如果失败会自动清空状态
  await themeStore.loadThemes()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: var(--spacing-6) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.hero-section {
  text-align: center;
  margin-bottom: var(--spacing-12);
}

.app-title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-4) 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-subtitle {
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-3) 0;
}

.app-description {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.themes-section {
  margin-bottom: var(--spacing-12);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-6) 0;
  text-align: center;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-4);
}

.theme-card {
  background: var(--bg-secondary);
  border: var(--border-width-1) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-4);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  position: relative;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.theme-card.active {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  background: var(--color-primary);
  color: var(--color-white);
}

.theme-card.is-draft {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  position: relative;
}

.theme-card.is-draft::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #f59e0b, #d97706);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
}

.theme-card.is-draft .theme-title {
  color: #92400e;
}

.theme-card.is-draft .theme-description {
  color: #a16207;
}

.theme-card.is-draft .created-date {
  color: #a16207;
}

.theme-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.theme-card:hover .theme-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

.theme-cover {
  margin-bottom: var(--spacing-3);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.theme-cover.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  height: 120px;
  border-radius: var(--border-radius-md);
}

.no-image-icon {
  font-size: 48px;
  opacity: 0.5;
}

.btn:disabled,
.btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #d1d5db;
  color: #9ca3af;
}

.cover-image {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.theme-info {
  text-align: left;
}

.theme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.draft-badge {
  background: #f59e0b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.theme-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-2) 0;
  color: inherit;
}

.theme-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0 0 var(--spacing-2) 0;
}

.theme-card.active .theme-subtitle {
  color: rgba(255, 255, 255, 0.8);
}

.theme-meta {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.theme-card.active .theme-meta {
  color: rgba(255, 255, 255, 0.7);
}

.empty-themes {
  margin-bottom: var(--spacing-12);
}

.empty-content {
  text-align: center;
  padding: var(--spacing-8);
  background: var(--color-gray-50);
  border-radius: var(--border-radius-lg);
  border: var(--border-width-1) dashed var(--border-color);
}

.empty-icon {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--spacing-4);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.empty-message {
  color: var(--text-muted);
  margin: 0;
}

.actions-section {
  margin-bottom: var(--spacing-12);
}

.action-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-3);
  max-width: 900px;
  margin: 0 auto;
  justify-items: center;
}

.btn-large {
  padding: var(--spacing-4) var(--spacing-8);
  font-size: var(--font-size-lg);
  min-height: 56px;
  width: 100%;
  max-width: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.btn-large:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: 1px solid var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-secondary:hover {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-icon {
  margin-right: var(--spacing-2);
  font-size: var(--font-size-lg);
}

.features-section {
  margin-bottom: var(--spacing-8);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-6);
}

.feature-item {
  text-align: center;
  padding: var(--spacing-4);
}

.feature-icon {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-3);
}

.feature-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.feature-description {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home {
    padding: var(--spacing-4) 0;
  }

  .container {
    padding: 0 var(--spacing-3);
  }

  .app-title {
    font-size: var(--font-size-4xl);
  }

  .app-subtitle {
    font-size: var(--font-size-lg);
  }

  .themes-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
  }

  .btn-large {
    width: 100%;
    max-width: 300px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }
}

/* 加载和错误状态样式 */
.loading-state,
.error-state,
.empty-themes {
  text-align: center;
  padding: var(--spacing-12) 0;
}

.loading-content,
.error-content,
.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-4);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-title,
.error-title,
.empty-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.loading-message,
.error-message,
.empty-message {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-4) 0;
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-4);
}

.error-state .btn {
  margin-top: var(--spacing-4);
}
</style>
