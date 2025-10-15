<template>
  <div id="app" :class="appClasses">
    <!-- 导航栏
    <nav class="nav-container" v-if="showNavigation">
      <div class="container">
        <div class="nav-content">
          <div class="nav-brand">
            <h1>麻辣四格</h1>
          </div>
          <div class="nav-actions">
            <button
              class="btn btn-ghost"
              @click="toggleFontScale"
              :title="`字体大小: ${fontScale === 1 ? '标准' : '大'}`"
            >
              <span class="font-icon">Aa</span>
            </button>
            <button class="btn btn-ghost" @click="goToEditor" title="编辑器">
              <span class="edit-icon">✏️</span>
            </button>
          </div>
        </div>
      </div>
    </nav> -->

    <!-- 主题切换按钮 - 仅在主页显示 -->
    <div v-if="isHomePage" class="theme-toggle-container">
      <ThemeToggle />
    </div>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 全局加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- 全局错误提示 -->
    <div v-if="error" class="error-toast">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">{{ error }}</span>
        <button class="btn btn-ghost btn-sm" @click="clearError">×</button>
      </div>
    </div>

    <!-- PWA 安装提示 -->
    <PWAInstallPrompt />

    <!-- 移动端安装提示 -->
    <MobileInstallPrompt />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { useUIThemeStore } from '@/stores/ui-theme'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt.vue'
import MobileInstallPrompt from '@/components/common/MobileInstallPrompt.vue'
import BackButtonHandler from '@/utils/back-button'
import { pwaManager } from '@/utils/pwa'
import '@/utils/pwa-debug'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const themeStore = useThemeStore()
const uiThemeStore = useUIThemeStore()

// 响应式状态
const isLoading = ref(false)
const error = ref<string | null>(null)

// 计算属性
const fontScale = computed(() => appStore.currentFontScale)
const isHomePage = computed(() => route.path === '/')

const appClasses = computed(() => ({
  'font-scale-1': fontScale.value === 1,
  'font-scale-1-2': fontScale.value === 1.2,
}))

// 方法

const clearError = () => {
  error.value = null
}

// 初始化应用
const initializeApp = async () => {
  try {
    isLoading.value = true

    // 初始化UI主题（默认日间模式）
    uiThemeStore.initialize()

    // 初始化应用状态
    appStore.initialize()

    // 初始化返回键处理（Android）
    BackButtonHandler.initialize(router)

    // 初始化 PWA
    await pwaManager.initialize()

    // 加载主题列表
    await themeStore.loadThemes()

    // 如果有当前主题，加载主题数据
    if (appStore.currentThemeId) {
      await themeStore.loadTheme(appStore.currentThemeId)
    }
  } catch (err) {
    error.value = `应用初始化失败: ${err}`
    console.error('App initialization failed:', err)
  } finally {
    isLoading.value = false
  }
}

// 监听主题错误
const handleThemeError = () => {
  if (themeStore.hasError) {
    error.value = themeStore.errorMessage
  }
}

// 生命周期
onMounted(() => {
  initializeApp()

  // 监听主题错误
  themeStore.$subscribe(() => {
    handleThemeError()
  })
})
</script>

<style scoped>
.nav-container {
  background: var(--nav-bg);
  border-bottom: var(--border-width-1) solid var(--nav-border);
  box-shadow: var(--nav-shadow);
  padding: var(--spacing-3) 0;
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h1 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.nav-actions {
  display: flex;
  gap: var(--spacing-2);
}

.font-icon,
.edit-icon {
  font-size: var(--font-size-lg);
}

.theme-toggle-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: var(--z-index-tooltip);
}

.main-content {
  min-height: calc(100vh - 60px);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-200);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--color-danger);
  color: var(--color-white);
  padding: var(--spacing-3);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-tooltip);
  max-width: 400px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.error-icon {
  font-size: var(--font-size-lg);
}

.error-message {
  flex: 1;
  font-size: var(--font-size-sm);
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-sm);
  min-height: 32px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 var(--spacing-4);
  }

  .nav-brand h1 {
    font-size: var(--font-size-lg);
  }

  .error-toast {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
