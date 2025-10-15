<template>
  <div class="navigation-container">
    <div class="nav-content">
      <!-- 上一幕按钮 -->
      <button
        class="nav-button nav-prev"
        :class="{ disabled: !canNavigatePrev }"
        :disabled="!canNavigatePrev"
        @click="handlePrev"
        title="上一幕"
      >
        <span class="nav-icon">←</span>
        <span class="nav-text">上一幕</span>
      </button>

      <!-- 中间信息 -->
      <div class="nav-info">
        <span class="nav-title">{{ currentTitle }}</span>
        <span class="nav-progress">{{ current }}/5</span>
      </div>

      <!-- 下一幕按钮 -->
      <button
        class="nav-button nav-next"
        :class="{ disabled: !canNavigateNext }"
        :disabled="!canNavigateNext"
        @click="handleNext"
        title="下一幕"
      >
        <span class="nav-text">下一幕</span>
        <span class="nav-icon">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  max: number
  canNavigatePrev: boolean
  canNavigateNext: boolean
}

interface Emits {
  (e: 'navigate', direction: 'prev' | 'next'): void
  (e: 'jump', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const currentTitle = computed(() => {
  const titles = ['序幕', '设定', '冲突', '转折', '尾声']
  return titles[props.current] || '未知'
})

// 方法
const handlePrev = () => {
  if (props.canNavigatePrev) {
    emit('navigate', 'prev')
  }
}

const handleNext = () => {
  if (props.canNavigateNext) {
    emit('navigate', 'next')
  }
}
</script>

<style scoped>
.navigation-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--nav-bg);
  border-top: var(--border-width-1) solid var(--nav-border);
  box-shadow: var(--nav-shadow);
  z-index: var(--z-index-sticky);
  padding: var(--spacing-3) 0;
}

.nav-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.nav-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: var(--touch-target-min);
  min-width: 120px;
  justify-content: center;
}

.nav-button:hover:not(.disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.nav-button.disabled {
  background: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
  opacity: 0.6;
}

.nav-icon {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.nav-text {
  font-size: var(--font-size-sm);
}

.nav-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  flex: 1;
  max-width: 200px;
}

.nav-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.nav-progress {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--color-gray-100);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 var(--spacing-3);
    gap: var(--spacing-2);
  }

  .nav-button {
    min-width: 100px;
    padding: var(--spacing-2) var(--spacing-3);
  }

  .nav-text {
    display: none;
  }

  .nav-icon {
    font-size: var(--font-size-xl);
  }

  .nav-info {
    max-width: 150px;
  }

  .nav-title {
    font-size: var(--font-size-base);
  }

  .nav-progress {
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-2);
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .nav-progress {
    background: var(--color-gray-700);
    color: var(--color-gray-300);
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .nav-button {
    min-height: 48px;
    padding: var(--spacing-4);
  }

  .nav-button:active:not(.disabled) {
    transform: scale(0.95);
  }
}
</style>
