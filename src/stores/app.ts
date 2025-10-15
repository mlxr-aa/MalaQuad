import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppState, FontScale } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 状态定义
  const index = ref<number>(0) // 当前幕索引 (0-4)
  const themeId = ref<string>('')
  const fontScale = ref<FontScale>(1)
  const unlockedMax = ref<number>(0)

  // 计算属性
  const currentIndex = computed(() => index.value)
  const currentThemeId = computed(() => themeId.value)
  const currentFontScale = computed(() => fontScale.value)
  const maxUnlocked = computed(() => unlockedMax.value)

  // 导航相关计算属性
  const canNavigateNext = computed(() => index.value < unlockedMax.value)
  const canNavigatePrev = computed(() => index.value > 0)
  const isAtBeginning = computed(() => index.value === 0)
  const isAtEnd = computed(() => index.value === 4)

  // 进度相关计算属性
  const progress = computed(() => {
    return {
      current: index.value,
      total: 5,
      unlocked: unlockedMax.value,
      percentage: Math.round((index.value / 4) * 100)
    }
  })

  // Actions - 导航控制
  const setIndex = (newIndex: number) => {
    if (newIndex >= 0 && newIndex <= unlockedMax.value) {
      index.value = newIndex
      saveToLocalStorage()
    }
  }

  const next = () => {
    if (canNavigateNext.value) {
      index.value++
      if (index.value > unlockedMax.value) {
        unlockedMax.value = index.value
      }
      saveToLocalStorage()
    }
  }

  const prev = () => {
    if (canNavigatePrev.value) {
      index.value--
      saveToLocalStorage()
    }
  }

  const jumpTo = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex <= unlockedMax.value) {
      index.value = targetIndex
      saveToLocalStorage()
    }
  }

  // Actions - 主题管理
  const setTheme = (id: string) => {
    themeId.value = id
    // 切换主题时重置到序幕，但解锁所有场景
    index.value = 0
    unlockedMax.value = 4 // 解锁所有5个场景（0-4）
    saveToLocalStorage()
  }

  const clearTheme = () => {
    themeId.value = ''
    index.value = 0
    unlockedMax.value = 0
    saveToLocalStorage()
  }

  // Actions - 字体缩放
  const setFontScale = (scale: FontScale) => {
    fontScale.value = scale
    saveToLocalStorage()
  }

  const toggleFontScale = () => {
    fontScale.value = fontScale.value === 1 ? 1.2 : 1
    saveToLocalStorage()
  }

  // Actions - 解锁管理
  const unlockNext = () => {
    if (unlockedMax.value < 4) {
      unlockedMax.value++
      saveToLocalStorage()
    }
  }

  const unlockAll = () => {
    unlockedMax.value = 4
    saveToLocalStorage()
  }

  const resetProgress = () => {
    index.value = 0
    unlockedMax.value = 0
    saveToLocalStorage()
  }

  // 本地存储操作
  const saveToLocalStorage = () => {
    try {
      const state: AppState = {
        index: index.value,
        themeId: themeId.value,
        fontScale: fontScale.value,
        unlockedMax: unlockedMax.value
      }
      localStorage.setItem('malaquad_app_state', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save app state to localStorage:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('malaquad_app_state')
      if (saved) {
        const state: AppState = JSON.parse(saved)
        index.value = state.index || 0
        themeId.value = state.themeId || ''
        fontScale.value = state.fontScale || 1
        unlockedMax.value = state.unlockedMax || 0
      }
    } catch (error) {
      console.error('Failed to load app state from localStorage:', error)
    }
  }

  // 初始化
  const initialize = () => {
    loadFromLocalStorage()
  }

  // 重置所有状态
  const reset = () => {
    index.value = 0
    themeId.value = ''
    fontScale.value = 1
    unlockedMax.value = 0
    saveToLocalStorage()
  }

  return {
    // 状态
    index,
    themeId,
    fontScale,
    unlockedMax,
    
    // 计算属性
    currentIndex,
    currentThemeId,
    currentFontScale,
    maxUnlocked,
    canNavigateNext,
    canNavigatePrev,
    isAtBeginning,
    isAtEnd,
    progress,
    
    // Actions
    setIndex,
    next,
    prev,
    jumpTo,
    setTheme,
    clearTheme,
    setFontScale,
    toggleFontScale,
    unlockNext,
    unlockAll,
    resetProgress,
    initialize,
    reset
  }
})
