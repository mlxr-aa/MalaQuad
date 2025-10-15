<template>
  <div class="progress-container">
    <div class="progress-content">
      <div class="progress-dots">
        <button
          v-for="index in total"
          :key="index"
          class="progress-dot"
          :class="getDotClass(index - 1)"
          :disabled="!isUnlocked(index - 1)"
          @click="handleJump(index - 1)"
          :title="getDotTitle(index - 1)"
        >
          <span class="dot-number">{{ index }}</span>
        </button>
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  total: number
  unlocked: number
}

interface Emits {
  (e: 'jump', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const progressPercentage = computed(() => {
  return Math.round((props.current / (props.total - 1)) * 100)
})

// 方法
const getDotClass = (index: number) => {
  return {
    active: index === props.current,
    completed: index < props.current,
    unlocked: index <= props.unlocked,
    locked: index > props.unlocked,
  }
}

const isUnlocked = (index: number) => {
  return index <= props.unlocked
}

const getDotTitle = (index: number) => {
  const titles = ['序幕', '设定', '冲突', '转折', '尾声']
  const title = titles[index] || '未知'

  if (index > props.unlocked) {
    return `${title} (未解锁)`
  } else if (index === props.current) {
    return `${title} (当前)`
  } else {
    return title
  }
}

const handleJump = (index: number) => {
  if (isUnlocked(index)) {
    emit('jump', index)
  }
}
</script>

<style scoped>
.progress-container {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-index-sticky);
  width: 100%;
  max-width: 400px;
  padding: 0 var(--spacing-4);
}

.progress-content {
  background: var(--nav-bg);
  border: var(--border-width-1) solid var(--nav-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-3);
  box-shadow: var(--shadow-lg);
}

.progress-dots {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.progress-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: var(--border-width-2) solid var(--color-gray-300);
  background: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.progress-dot:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.progress-dot:active:not(:disabled) {
  transform: scale(0.95);
}

.progress-dot:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.progress-dot.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.progress-dot.completed {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-white);
}

.progress-dot.unlocked:not(.active):not(.completed) {
  background: var(--color-white);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.progress-dot.locked {
  background: var(--color-gray-100);
  border-color: var(--color-gray-300);
  color: var(--color-gray-500);
}

.dot-number {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.progress-bar {
  height: 4px;
  background: var(--color-gray-200);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    var(--color-success)
  );
  border-radius: var(--border-radius-full);
  transition: width var(--transition-base);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: var(--color-white);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-container {
    bottom: 70px;
    padding: 0 var(--spacing-3);
  }

  .progress-content {
    padding: var(--spacing-2);
  }

  .progress-dot {
    width: 32px;
    height: 32px;
  }

  .dot-number {
    font-size: var(--font-size-xs);
  }

  .progress-bar {
    height: 3px;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .progress-content {
    background: var(--color-gray-800);
    border-color: var(--color-gray-600);
  }

  .progress-dot {
    background: var(--color-gray-700);
    border-color: var(--color-gray-500);
  }

  .progress-dot.unlocked:not(.active):not(.completed) {
    background: var(--color-gray-700);
    border-color: var(--color-primary);
  }

  .progress-dot.locked {
    background: var(--color-gray-800);
    border-color: var(--color-gray-600);
  }

  .progress-bar {
    background: var(--color-gray-600);
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.progress-dot.active {
  animation: pulse 2s infinite;
}
</style>
