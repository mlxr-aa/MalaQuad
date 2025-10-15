import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useUIThemeStore = defineStore('ui-theme', () => {
  // 状态定义
  const themeMode = ref<ThemeMode>('auto')
  const isDark = ref(false)

  // 计算属性
  const currentTheme = computed(() => {
    if (themeMode.value === 'auto') {
      return isDark.value ? 'dark' : 'light'
    }
    return themeMode.value
  })

  const isLightTheme = computed(() => currentTheme.value === 'light')
  const isDarkTheme = computed(() => currentTheme.value === 'dark')

  // 方法
  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
    applyTheme()
    saveToStorage()
  }

  const toggleTheme = () => {
    if (themeMode.value === 'auto') {
      setThemeMode(isDark.value ? 'light' : 'dark')
    } else {
      setThemeMode(themeMode.value === 'light' ? 'dark' : 'light')
    }
  }

  const applyTheme = () => {
    const root = document.documentElement
    const isDarkMode = currentTheme.value === 'dark'
    
    // 移除旧的主题类
    root.classList.remove('theme-light', 'theme-dark')
    
    // 添加新的主题类
    root.classList.add(`theme-${currentTheme.value}`)
    
    // 设置CSS变量
    if (isDarkMode) {
      // 夜间主题：暗辣墨影风
      root.style.setProperty('--bg-primary', '#121212')
      root.style.setProperty('--bg-secondary', '#1E1E1E')
      root.style.setProperty('--text-primary', '#E0E0E0')
      root.style.setProperty('--text-secondary', '#9E9E9E')
      root.style.setProperty('--text-muted', '#6C6C6C')
      root.style.setProperty('--color-primary', '#FF5252')
      root.style.setProperty('--color-primary-hover', '#FF6B6B')
      root.style.setProperty('--border-color', '#333333')
      root.style.setProperty('--border-color-light', '#2A2A2A')
      root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)')
      root.style.setProperty('--shadow-md', '0 3px 6px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--shadow-lg', '0 10px 20px rgba(0, 0, 0, 0.5), 0 6px 6px rgba(0, 0, 0, 0.4)')
    } else {
      // 日间主题：红白叙事风
      root.style.setProperty('--bg-primary', '#FAFAFA')
      root.style.setProperty('--bg-secondary', '#FFFFFF')
      root.style.setProperty('--text-primary', '#111111')
      root.style.setProperty('--text-secondary', '#666666')
      root.style.setProperty('--text-muted', '#BDBDBD')
      root.style.setProperty('--color-primary', '#E53935')
      root.style.setProperty('--color-primary-hover', '#D32F2F')
      root.style.setProperty('--border-color', '#E0E0E0')
      root.style.setProperty('--border-color-light', '#F5F5F5')
      root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)')
      root.style.setProperty('--shadow-md', '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)')
      root.style.setProperty('--shadow-lg', '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)')
    }
  }

  const detectSystemTheme = () => {
    if (themeMode.value === 'auto') {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme()
    }
  }

  const saveToStorage = () => {
    localStorage.setItem('malaquad-ui-theme', themeMode.value)
  }

  const loadFromStorage = () => {
    const saved = localStorage.getItem('malaquad-ui-theme') as ThemeMode
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      themeMode.value = saved
    } else {
      // 第一次进入，默认为日间模式
      themeMode.value = 'light'
    }
  }

  const initialize = () => {
    loadFromStorage()
    
    // 立即应用主题，确保第一次进入是日间模式
    applyTheme()
    
    // 只有在auto模式下才检测系统主题
    if (themeMode.value === 'auto') {
      detectSystemTheme()
    }
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', detectSystemTheme)
    
    return () => {
      mediaQuery.removeEventListener('change', detectSystemTheme)
    }
  }

  return {
    themeMode,
    isDark,
    currentTheme,
    isLightTheme,
    isDarkTheme,
    setThemeMode,
    toggleTheme,
    applyTheme,
    initialize
  }
})
