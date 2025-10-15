<template>
  <div class="reader-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">加载失败</h2>
        <p class="error-message">{{ error }}</p>
        <button class="btn btn-primary" @click="retry">重试</button>
      </div>
    </div>

    <!-- 无主题状态 -->
    <div v-else-if="!currentTheme" class="empty-container">
      <div class="empty-content">
        <div class="empty-icon">📚</div>
        <h2 class="empty-title">暂无主题</h2>
        <p class="empty-message">请先选择一个主题开始阅读</p>
        <button class="btn btn-primary" @click="goToHome">返回首页</button>
      </div>
    </div>

    <!-- 阅读内容 -->
    <div v-else class="reader-content" @click="handleReaderClick">
      <!-- 序幕封面页 -->
      <div v-if="currentIndex === 0" class="prelude-cover">
        <!-- 第一页：封面、目录和简介 -->
        <div v-if="preludePage === 0" class="prelude-page">
          <div
            class="cover-background"
            :style="{
              backgroundImage: `url(${currentTheme.prelude.coverImage})`,
            }"
          >
            <div class="cover-overlay">
              <div class="cover-content">
                <h1 class="cover-title">{{ currentTheme.prelude.title }}</h1>
                <div v-if="currentTheme.prelude.author" class="cover-author">
                  作者: {{ currentTheme.prelude.author }}
                </div>

                <!-- 目录 -->
                <div class="chapter-list">
                  <div class="chapter-item active">序幕</div>
                  <div
                    class="chapter-item"
                    v-for="(title, index) in chapterTitles.slice(0, 3)"
                    :key="index"
                  >
                    {{ `第${index + 1}幕${title ? '·' + title : ''}` }}
                  </div>
                  <div class="chapter-item">尾声</div>
                </div>

                <!-- 简介 -->
                <div
                  v-if="currentTheme.prelude.subtitle"
                  class="cover-description"
                >
                  <h3 class="description-title">简介</h3>
                  <p class="description-text">
                    {{ currentTheme.prelude.subtitle }}
                  </p>
                </div>

                <!-- 进入按钮 -->
                <button class="enter-story-btn" @click="nextPreludePage">
                  开始阅读
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 第二页：简介和用户身份 -->
        <div v-else-if="preludePage === 1" class="prelude-page">
          <div
            class="cover-background"
            :style="{
              backgroundImage: `url(${currentTheme.prelude.coverImage})`,
            }"
          >
            <div class="cover-overlay">
              <div class="cover-content">
                <h1 class="cover-title">{{ currentTheme.prelude.title }}</h1>

                <!-- 序幕内容 -->
                <div v-if="currentSceneText" class="prelude-content">
                  <h3 class="content-title">序幕</h3>
                  <div
                    class="content-text"
                    v-html="formatSceneText(currentSceneText)"
                  ></div>
                </div>

                <!-- 用户身份 -->
                <div
                  v-if="currentTheme.prelude.background"
                  class="user-identity"
                >
                  <h3 class="identity-title">你的身份</h3>
                  <p class="identity-text">
                    {{ currentTheme.prelude.background }}
                  </p>
                </div>

                <!-- 导航按钮 -->
                <div class="prelude-navigation">
                  <button class="btn btn-outline" @click="prevPreludePage">
                    返回
                  </button>
                  <button class="btn btn-primary" @click="startStory">
                    进入你的ML故事
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 场景内容 -->
      <div v-else class="scene-content">
        <div
          class="scene-background"
          :style="{ backgroundImage: `url(${currentImageUrl})` }"
        >
          <div
            class="scene-overlay"
            :class="{ hidden: textHidden }"
            :style="{ '--overlay-opacity': overlayOpacity }"
          >
            <div class="scene-text-container">
              <div class="scene-text-wrapper" ref="sceneTextWrapper">
                <div
                  class="scene-text"
                  v-html="formatSceneText(currentSceneText)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 沉浸式UI控制 -->
      <div v-if="showUI" class="immersive-ui">
        <!-- 顶部标题 -->
        <div class="top-title">
          <div class="title-content">
            <h1 class="main-title">{{ currentTheme?.title || '麻辣四格' }}</h1>
            <div class="chapter-name">{{ getChapterName(currentIndex) }}</div>
          </div>
        </div>

        <!-- 底部进度条 -->
        <div class="bottom-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${(currentIndex / 4) * 100}%` }"
            ></div>
          </div>
          <div class="progress-text">{{ currentIndex + 1 }} / 5</div>
        </div>

        <!-- 设置面板 -->
        <div class="settings-panel">
          <button class="settings-btn" @click.stop="toggleSettings">⚙️</button>
          <div v-if="showSettings" class="settings-content">
            <div class="setting-item">
              <label>文字大小</label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                v-model="fontScale"
                @input="updateFontScale"
              />
            </div>
            <div class="setting-item">
              <label>文字颜色</label>
              <select v-model="textColor" @change="updateTextColor">
                <option value="white">白色</option>
                <option value="black">黑色</option>
                <option value="yellow">黄色</option>
                <option value="cyan">青色</option>
              </select>
            </div>
            <div class="setting-item">
              <label>遮罩透明度</label>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.1"
                v-model="overlayOpacity"
                @input="updateOverlayOpacity"
              />
              <span class="opacity-value"
                >{{ Math.round(overlayOpacity * 100) }}%</span
              >
            </div>
            <div class="setting-item">
              <button @click="toggleText">
                {{ textHidden ? '显示文字' : '隐藏文字' }}
              </button>
            </div>
            <div class="setting-item">
              <button @click="goToHome" class="back-home-btn">
                ← 返回主页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import AppExit from '@/utils/app-exit'

const router = useRouter()
const appStore = useAppStore()
const themeStore = useThemeStore()

// 响应式状态
const loading = ref(false)
const error = ref<string | null>(null)
const textHidden = ref(false)
const showUI = ref(false)
const showSettings = ref(false)
const fontScale = ref(1.0)
const textColor = ref('white')
const overlayOpacity = ref(0.8)
const sceneTextWrapper = ref<HTMLElement | null>(null)

// 序幕分页状态
const preludePage = ref(0)

// 计算属性
const currentTheme = computed(() => themeStore.currentThemeData)
const currentIndex = computed(() => appStore.currentIndex)
const unlockedMax = computed(() => appStore.maxUnlocked)

// 当前场景数据
const currentImageUrl = computed(() => {
  if (!currentTheme.value) return ''

  // 检查是否为v2格式
  if (Array.isArray(currentTheme.value.scenes)) {
    // v2格式：直接从scenes数组获取
    return currentTheme.value.scenes[currentIndex.value]?.image || ''
  } else {
    // v1格式：从images数组获取
    if (currentIndex.value === 0)
      return currentTheme.value.prelude.coverImage || ''
    const imageIndex = currentIndex.value - 1
    return (currentTheme.value as any).images[imageIndex] || ''
  }
})

const currentSceneText = computed(() => {
  if (!currentTheme.value) return ''

  // 检查是否为v2格式
  if (Array.isArray(currentTheme.value.scenes)) {
    // v2格式：直接从scenes数组获取
    return currentTheme.value.scenes[currentIndex.value]?.content || ''
  } else {
    // v1格式：从scenes对象获取
    if (currentIndex.value === 0) return currentTheme.value.prelude.title || ''
    const sceneKeys = ['scene1', 'scene2', 'scene3', 'epilogue']
    const sceneKey = sceneKeys[currentIndex.value - 1]
    return (currentTheme.value.scenes as any)[sceneKey] || ''
  }
})

const chapterTitles = computed(() => {
  if (!currentTheme.value) return []

  // 检查是否为v2格式
  if (Array.isArray(currentTheme.value.scenes)) {
    // v2格式：从scenes数组获取标题
    return currentTheme.value.scenes.slice(1).map((scene) => scene.title)
  } else {
    // v1格式：从chapterTitles或使用默认值
    if (
      (currentTheme.value as any).chapterTitles &&
      (currentTheme.value as any).chapterTitles.length > 0
    ) {
      return (currentTheme.value as any).chapterTitles
    }
    return ['第一幕', '第二幕', '第三幕', '尾声']
  }
})

// 方法

const retry = async () => {
  error.value = null
  await loadTheme()
}

const goToHome = async () => {
  // 检查是否在移动端环境
  if (AppExit.shouldShowExit()) {
    // 在移动端，退出应用
    await AppExit.exit()
  } else {
    // 在Web环境，返回主页
    router.push('/')
  }
}

const startStory = () => {
  // 进入第一幕（索引1，因为索引0是序幕）
  appStore.setIndex(1)
}

// 序幕分页方法
const nextPreludePage = () => {
  preludePage.value = 1
}

const prevPreludePage = () => {
  preludePage.value = 0
}

const toggleText = () => {
  textHidden.value = !textHidden.value
}

const formatSceneText = (text: string) => {
  // 将换行符转换为HTML换行
  return text.replace(/\n/g, '<br>')
}

// 沉浸式阅读交互
const handleReaderClick = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top
  const width = rect.width
  const height = rect.height

  // 序幕第一页不允许左右翻页，只允许点击中间区域
  if (currentIndex.value === 0 && preludePage.value === 0) {
    // 点击中间区域进入下一页
    if (
      clickX > width * 0.3 &&
      clickX < width * 0.7 &&
      clickY > height * 0.3 &&
      clickY < height * 0.7
    ) {
      nextPreludePage()
    }
    return
  }

  // 序幕第二页允许左右翻页
  if (currentIndex.value === 0 && preludePage.value === 1) {
    // 点击左侧区域返回上一页
    if (clickX < width * 0.3) {
      prevPreludePage()
      return
    }

    // 点击右侧区域进入故事
    if (clickX > width * 0.7) {
      startStory()
      return
    }

    // 点击中间区域显示/隐藏UI
    if (
      clickX > width * 0.3 &&
      clickX < width * 0.7 &&
      clickY > height * 0.3 &&
      clickY < height * 0.7
    ) {
      showUI.value = !showUI.value
      showSettings.value = false
      return
    }
    return
  }

  // 其他场景的正常翻页逻辑
  // 点击中间区域显示/隐藏UI
  if (
    clickX > width * 0.3 &&
    clickX < width * 0.7 &&
    clickY > height * 0.3 &&
    clickY < height * 0.7
  ) {
    showUI.value = !showUI.value
    showSettings.value = false
    return
  }

  // 点击左侧区域向前翻页
  if (clickX < width * 0.3) {
    if (currentIndex.value > 0) {
      appStore.prev()
    }
    return
  }

  // 点击右侧区域向后翻页
  if (clickX > width * 0.7) {
    if (currentIndex.value < unlockedMax.value) {
      appStore.next()
    }
    return
  }
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const updateFontScale = () => {
  document.documentElement.style.setProperty(
    '--font-scale',
    fontScale.value.toString()
  )
}

const updateTextColor = () => {
  document.documentElement.style.setProperty('--text-color', textColor.value)
}

const updateOverlayOpacity = () => {
  // 透明度更新会自动通过CSS变量生效
}

const getChapterName = (index: number) => {
  if (!currentTheme.value) return '未知章节'

  // 检查是否为v2格式
  if (Array.isArray(currentTheme.value.scenes)) {
    // v2格式：直接从scenes数组获取标题
    const scene = currentTheme.value.scenes[index]
    if (scene) {
      return scene.title
    }
    return '未知章节'
  } else {
    // v1格式：使用原有逻辑
    if (index === 0) {
      return '序幕'
    } else if (index === 4) {
      return '尾声'
    } else {
      // 第一幕到第三幕
      const chapterIndex = index - 1
      const chapterTitle = (currentTheme.value as any).chapterTitles?.[
        chapterIndex
      ]
      if (chapterTitle) {
        return `第${index}幕·${chapterTitle}`
      } else {
        return `第${index}幕`
      }
    }
  }
}

const loadTheme = async () => {
  if (!appStore.currentThemeId) {
    error.value = '未选择主题'
    return
  }

  try {
    loading.value = true
    error.value = null

    const theme = await themeStore.loadTheme(appStore.currentThemeId)
    if (!theme) {
      error.value = themeStore.errorMessage || '加载主题失败'
    }
  } catch (err) {
    error.value = `加载主题失败: ${err}`
    console.error('Failed to load theme:', err)
  } finally {
    loading.value = false
  }
}

// 监听主题变化
watch(
  () => appStore.currentThemeId,
  async (newThemeId) => {
    if (newThemeId && newThemeId !== themeStore.currentThemeData?.id) {
      await loadTheme()
    }
  }
)

// 监听主题错误
watch(
  () => themeStore.hasError,
  (hasError) => {
    if (hasError) {
      error.value = themeStore.errorMessage
    }
  }
)

// 监听场景切换，重置滚动位置
watch(
  () => currentIndex.value,
  async () => {
    await nextTick()
    if (sceneTextWrapper.value) {
      sceneTextWrapper.value.scrollTop = 0
    }
  }
)

// 生命周期
onMounted(async () => {
  await loadTheme()
})
</script>

<style scoped>
.reader-container {
  min-height: 100vh;
  background: var(--reader-bg);
  color: var(--reader-text);
}

/* Galgame风格样式 */
.prelude-cover {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.prelude-page {
  width: 100%;
  height: 100%;
  position: relative;
}

.cover-background {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.cover-content {
  text-align: center;
  color: white;
  max-width: 600px;
  width: 100%;
}

.cover-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.cover-author {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
}

.chapter-list {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.chapter-item {
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
  text-align: center;
  min-width: 120px;
  transition: all 0.3s ease;
}

.chapter-item.active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: bold;
  transform: scale(1.05);
}

.cover-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.user-identity {
  font-size: 1rem;
  font-style: italic;
  margin-bottom: 2rem;
  color: #ffd700;
}

.prelude-content {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  max-height: 40vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.content-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.content-text {
  white-space: pre-wrap;
  text-align: left;
  color: #f0f0f0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.enter-story-btn {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.enter-story-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
}

/* 沉浸式阅读样式 */
.reader-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: none;
  user-select: none;
}

.reader-content:hover {
  cursor: pointer;
}

/* 场景内容样式 */
.scene-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.scene-background {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.scene-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, var(--overlay-opacity, 0.8));
  color: var(--text-color, white);
  padding: 20px 30px 30px 30px;
  transition: opacity 0.3s ease;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.scene-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.scene-text-container {
  max-width: 1000px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.scene-text-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-right: 20px;
  margin-right: -20px;
  min-height: 0;
  max-height: calc(100vh - 120px);
  width: 100%;
}

.scene-text-wrapper::-webkit-scrollbar {
  width: 6px;
}

.scene-text-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.scene-text-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.scene-text-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.scene-text {
  font-size: calc(1.1rem * var(--font-scale, 1));
  line-height: 1.8;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  padding: 5px 0 15px 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

/* 沉浸式UI样式 */
.immersive-ui {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: none;
  animation: fadeIn 0.3s ease;
}

.immersive-ui > * {
  pointer-events: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 顶部标题样式 */
.top-title {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
  padding: 20px 30px;
  z-index: 5;
}

.title-content {
  max-width: 900px;
  margin: 0 auto;
  text-align: left;
}

.main-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
}

.chapter-name {
  font-size: 1.1rem;
  color: #ffd700;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.bottom-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.settings-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
}

.settings-btn {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  pointer-events: auto;
  position: relative;
  z-index: 21;
}

.settings-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: rgba(255, 255, 255, 0.5);
}

.settings-content {
  position: absolute;
  top: 50px;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 15px;
  min-width: 200px;
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease;
  z-index: 22;
  pointer-events: auto;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.setting-item {
  margin-bottom: 15px;
  color: white;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: 500;
}

.setting-item input[type='range'] {
  width: 100%;
  margin: 5px 0;
}

.setting-item select {
  width: 100%;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
}

.setting-item button {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.setting-item button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.opacity-value {
  margin-left: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.back-home-btn {
  background: rgba(255, 107, 107, 0.8) !important;
  color: white !important;
  border: 1px solid rgba(255, 107, 107, 0.9) !important;
  font-weight: bold;
}

.back-home-btn:hover {
  background: rgba(255, 107, 107, 1) !important;
  border-color: rgba(255, 107, 107, 1) !important;
}

.loading-container,
.error-container,
.empty-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-6);
}

.loading-content,
.error-content,
.empty-content {
  text-align: center;
  max-width: 400px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-4);
}

.loading-text,
.error-message,
.empty-message {
  color: var(--text-secondary);
  margin: var(--spacing-4) 0;
}

.error-icon,
.empty-icon {
  font-size: var(--font-size-5xl);
  margin-bottom: var(--spacing-4);
}

.error-title,
.empty-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.reader-content {
  min-height: 100vh;
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
  .loading-container,
  .error-container,
  .empty-container {
    padding: var(--spacing-4);
  }

  .error-icon,
  .empty-icon {
    font-size: var(--font-size-4xl);
  }

  .error-title,
  .empty-title {
    font-size: var(--font-size-xl);
  }

  /* 移动端封面内容优化 */
  .cover-content {
    padding: 1rem;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .cover-title {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }

  .cover-author {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .chapter-list {
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .chapter-item {
    font-size: 0.9rem;
    padding: 0.3rem 0.6rem;
  }

  .cover-description {
    margin-bottom: 1rem;
    flex: 1;
    overflow-y: auto;
    max-height: 50vh;
  }

  .description-title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .description-text {
    font-size: 0.9rem;
    line-height: 1.4;
    margin-bottom: 0.5rem;
  }

  .enter-story-btn {
    margin-top: auto;
    padding: 12px 24px;
    font-size: 1rem;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(255, 107, 107, 0.6);
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
    flex-shrink: 0;
  }

  /* 确保按钮在移动端可见 */
  .prelude-cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .cover-background {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .cover-overlay {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    position: relative;
  }
}

/* 小屏幕手机优化 */
@media (max-width: 480px) {
  .cover-content {
    padding: 0.8rem;
  }

  .cover-title {
    font-size: 1.5rem;
    margin-bottom: 0.4rem;
  }

  .cover-author {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
  }

  .chapter-list {
    margin-bottom: 0.8rem;
  }

  .chapter-item {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }

  .description-title {
    font-size: 0.9rem;
  }

  .description-text {
    font-size: 0.85rem;
    line-height: 1.3;
  }

  .cover-description {
    flex: 1;
    overflow-y: auto;
    max-height: 45vh;
  }

  .enter-story-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
    border-radius: 18px;
    bottom: 0.8rem;
  }

  .cover-overlay {
    padding: 0.8rem;
  }
}

/* 序幕分页内容样式 */
.description-title,
.identity-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.description-text,
.identity-text {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  color: #f0f0f0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.prelude-navigation {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.prelude-navigation .btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.prelude-navigation .btn-outline {
  background: transparent;
  color: white;
  border-color: rgba(255, 255, 255, 0.5);
}

.prelude-navigation .btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.8);
}

.prelude-navigation .btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.prelude-navigation .btn-primary:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
}
</style>
