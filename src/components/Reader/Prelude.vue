<template>
  <div class="prelude-container">
    <div class="prelude-content">
      <!-- 封面图片 -->
      <div v-if="prelude.coverImage" class="cover-section">
        <img
          :src="prelude.coverImage"
          :alt="prelude.title"
          class="cover-image"
          @error="handleImageError"
        />
      </div>

      <!-- 标题区域 -->
      <div class="title-section">
        <h1 class="main-title">{{ prelude.title }}</h1>
        <h2 v-if="prelude.chapter" class="chapter-title">
          {{ prelude.chapter }}
        </h2>
        <p v-if="prelude.subtitle" class="subtitle">{{ prelude.subtitle }}</p>
      </div>

      <!-- 背景说明 -->
      <div v-if="prelude.background" class="background-section">
        <div class="background-card">
          <h3 class="section-title">背景设定</h3>
          <p class="background-text">{{ prelude.background }}</p>
        </div>
      </div>

      <!-- 作者信息 -->
      <div v-if="prelude.author || prelude.tags" class="meta-section">
        <div class="meta-card">
          <div v-if="prelude.author" class="author-info">
            <span class="author-label">作者：</span>
            <span class="author-name">{{ prelude.author }}</span>
          </div>
          <div v-if="prelude.tags && prelude.tags.length > 0" class="tags-info">
            <span class="tags-label">标签：</span>
            <div class="tags-list">
              <span v-for="tag in prelude.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ref } from 'vue'
import type { Prelude } from '@/types'

interface Props {
  prelude: Prelude
}

const props = defineProps<Props>()

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  console.warn('封面图片加载失败:', props.prelude.coverImage)
}
</script>

<style scoped>
.prelude-container {
  min-height: 100vh;
  background: var(--reader-bg);
  color: var(--reader-text);
  padding: var(--spacing-6) 0;
}

.prelude-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.cover-section {
  margin-bottom: var(--spacing-8);
  text-align: center;
}

.cover-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.title-section {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.main-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
  line-height: var(--line-height-tight);
}

.chapter-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-3) 0;
}

.subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-muted);
  margin: 0;
  font-style: italic;
}

.background-section {
  margin-bottom: var(--spacing-8);
}

.background-card {
  background: var(--reader-card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--reader-card-shadow);
  border: var(--border-width-1) solid var(--border-color-light);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.background-text {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
  margin: 0;
}

.meta-section {
  margin-bottom: var(--spacing-6);
}

.meta-card {
  background: var(--reader-card-bg);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  border: var(--border-width-1) solid var(--border-color-light);
}

.author-info {
  margin-bottom: var(--spacing-3);
}

.author-label,
.tags-label {
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.author-name {
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.tag {
  background: var(--color-primary);
  color: var(--color-white);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .prelude-content {
    padding: 0 var(--spacing-3);
  }

  .main-title {
    font-size: var(--font-size-3xl);
  }

  .chapter-title {
    font-size: var(--font-size-lg);
  }

  .subtitle {
    font-size: var(--font-size-base);
  }

  .background-card,
  .meta-card {
    padding: var(--spacing-4);
  }

  .tags-list {
    gap: var(--spacing-1);
  }

  .tag {
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-2);
  }
}

/* 字体缩放支持 */
.font-scale-1-2 .main-title {
  font-size: calc(var(--font-size-4xl) * 1.2);
}

.font-scale-1-2 .chapter-title {
  font-size: calc(var(--font-size-xl) * 1.2);
}

.font-scale-1-2 .subtitle {
  font-size: calc(var(--font-size-lg) * 1.2);
}

.font-scale-1-2 .background-text {
  font-size: calc(var(--font-size-base) * 1.2);
}
</style>
