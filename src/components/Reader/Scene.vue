<template>
  <div class="scene-container">
    <div class="scene-content">
      <!-- 场景图片 -->
      <div class="image-section">
        <div class="image-wrapper">
          <img
            :src="imageUrl"
            :alt="`场景${sceneIndex}图片`"
            class="scene-image"
            @load="handleImageLoad"
            @error="handleImageError"
            :class="{ loading: imageLoading }"
          />
          <div v-if="imageLoading" class="image-loading">
            <div class="loading-spinner"></div>
          </div>
          <div v-if="imageError" class="image-error">
            <div class="error-content">
              <span class="error-icon">🖼️</span>
              <p class="error-message">图片加载失败</p>
              <button class="btn btn-primary btn-sm" @click="retryImage">
                重试
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 场景文本 -->
      <div class="text-section">
        <div class="text-card">
          <div class="scene-header">
            <h2 class="scene-title">{{ sceneTitle }}</h2>
            <div class="scene-number">{{ sceneIndex }}/4</div>
          </div>
          <div class="scene-text">
            <p class="text-content">{{ sceneText }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

interface Props {
  imageUrl: string
  sceneText: string
  sceneIndex: number
  sceneTitle: string
}

const props = defineProps<Props>()

// 响应式状态
const imageLoading = ref(true)
const imageError = ref(false)

// 计算属性
const sceneTitle = computed(() => {
  const titles = ['设定', '冲突', '转折', '尾声']
  return titles[props.sceneIndex - 1] || '场景'
})

// 方法
const handleImageLoad = () => {
  imageLoading.value = false
  imageError.value = false
}

const handleImageError = () => {
  imageLoading.value = false
  imageError.value = true
}

const retryImage = () => {
  imageError.value = false
  imageLoading.value = true

  // 强制重新加载图片
  const img = document.querySelector('.scene-image') as HTMLImageElement
  if (img) {
    const originalSrc = img.src
    img.src = ''
    nextTick(() => {
      img.src = originalSrc
    })
  }
}

// 预加载下一张图片
// const preloadNextImage = (nextImageUrl: string) => {
//   if (nextImageUrl) {
//     const img = new Image()
//     img.src = nextImageUrl
//   }
// }

// 生命周期
onMounted(() => {
  // 组件挂载时开始加载图片
  imageLoading.value = true
})
</script>

<style scoped>
.scene-container {
  min-height: 100vh;
  background: var(--reader-bg);
  color: var(--reader-text);
  padding: var(--spacing-6) 0;
}

.scene-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.image-section {
  margin-bottom: var(--spacing-8);
}

.image-wrapper {
  position: relative;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: var(--color-gray-100);
}

.scene-image {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  transition: opacity var(--transition-base);
}

.scene-image.loading {
  opacity: 0.6;
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-gray-300);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.image-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.error-content {
  text-align: center;
  padding: var(--spacing-4);
}

.error-icon {
  font-size: var(--font-size-3xl);
  display: block;
  margin-bottom: var(--spacing-2);
}

.error-message {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-3) 0;
  font-size: var(--font-size-sm);
}

.text-section {
  margin-bottom: var(--spacing-6);
}

.text-card {
  background: var(--reader-card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--reader-card-shadow);
  border: var(--border-width-1) solid var(--border-color-light);
}

.scene-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: var(--border-width-1) solid var(--border-color-light);
}

.scene-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.scene-number {
  background: var(--color-primary);
  color: var(--color-white);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.scene-text {
  line-height: var(--line-height-relaxed);
}

.text-content {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
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
  .scene-content {
    padding: 0 var(--spacing-3);
  }

  .text-card {
    padding: var(--spacing-4);
  }

  .scene-title {
    font-size: var(--font-size-lg);
  }

  .text-content {
    font-size: var(--font-size-sm);
  }

  .scene-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }

  .scene-number {
    align-self: flex-end;
  }
}

/* 字体缩放支持 */
.font-scale-1-2 .text-content {
  font-size: calc(var(--font-size-base) * 1.2);
}

.font-scale-1-2 .scene-title {
  font-size: calc(var(--font-size-xl) * 1.2);
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .image-wrapper {
    background: var(--color-gray-800);
  }

  .image-error {
    background: var(--color-gray-800);
  }
}
</style>
