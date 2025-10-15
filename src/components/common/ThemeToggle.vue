<template>
  <div class="theme-toggle">
    <button
      class="theme-toggle-btn"
      @click="toggleTheme"
      :title="`切换到${isLightTheme ? '夜间' : '日间'}模式`"
    >
      <span class="theme-icon">{{ isLightTheme ? '🌙' : '🌞' }}</span>
      <span class="theme-label">{{ isLightTheme ? '夜间' : '日间' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIThemeStore } from '@/stores/ui-theme'

const uiThemeStore = useUIThemeStore()

// 计算属性
const isLightTheme = computed(() => uiThemeStore.isLightTheme)

// 方法
const toggleTheme = () => {
  uiThemeStore.toggleTheme()
}
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.theme-toggle-btn:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.theme-toggle-btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.theme-icon {
  font-size: 16px;
  line-height: 1;
}

.theme-label {
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

/* 夜间主题特殊效果 */
.theme-dark .theme-toggle-btn:hover {
  background: var(--color-primary);
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.3);
}

/* 日间主题特殊效果 */
.theme-light .theme-toggle-btn:hover {
  background: var(--color-primary);
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-toggle-btn {
    padding: 6px 10px;
    font-size: var(--font-size-xs);
  }

  .theme-label {
    display: none;
  }

  .theme-icon {
    font-size: 18px;
  }
}
</style>
