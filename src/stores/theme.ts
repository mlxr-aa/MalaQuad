import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Theme } from '@/types'
import type { ThemeV2 } from '@/types/v2'
import { indexedDBUtils } from '@/utils/indexeddb'

export const useThemeStore = defineStore('theme', () => {
  // 状态定义
  const currentTheme = ref<Theme | ThemeV2 | null>(null)
  const themes = ref<(Theme | ThemeV2)[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  
  // 日间/夜间模式状态
  const isDarkMode = ref<boolean>(false)

  // 计算属性
  const currentThemeData = computed(() => currentTheme.value)
  const availableThemes = computed(() => themes.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const errorMessage = computed(() => error.value)
  const isDark = computed(() => isDarkMode.value)

  // 主题验证
  const validateTheme = (theme: Theme | ThemeV2): boolean => {
    // 基本验证：必须有id和title
    if (!theme.id || !theme.title) return false
    
    // 检查prelude是否存在
    if (!theme.prelude) return false
    
    // 检查是否为v2格式
    if (Array.isArray(theme.scenes)) {
      // v2格式：检查scenes数组（更宽松的验证）
      if (!theme.scenes || theme.scenes.length === 0) return false
      // 至少有一个场景有内容
      return theme.scenes.some(scene => scene.title || scene.content)
    } else {
      // v1格式：检查原有结构（更宽松的验证）
      const v1Theme = theme as any
      // 至少要有prelude内容
      if (!v1Theme.prelude.title && !v1Theme.prelude.subtitle) return false
      // 如果有scenes，检查基本结构
      if (v1Theme.scenes) {
        return v1Theme.scenes.scene1 || v1Theme.scenes.scene2 || 
               v1Theme.scenes.scene3 || v1Theme.scenes.epilogue
      }
      return true
    }
  }

  // 主题操作
  const loadTheme = async (themeId: string): Promise<Theme | ThemeV2 | null> => {
    try {
      loading.value = true
      error.value = null

      // 从主题列表中查找
      const theme = themes.value.find(t => t.id === themeId)
      if (theme) {
        currentTheme.value = theme
        return theme
      }

      // 如果主题列表中不存在，尝试从存储加载
      const savedTheme = await loadThemeFromStorage(themeId)
      if (savedTheme) {
        currentTheme.value = savedTheme
        return savedTheme
      }

      error.value = `主题 "${themeId}" 未找到`
      return null
    } catch (err) {
      error.value = `加载主题失败: ${err}`
      return null
    } finally {
      loading.value = false
    }
  }

  const saveTheme = async (theme: Theme | ThemeV2): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      // 验证主题数据
      if (!validateTheme(theme)) {
        error.value = '主题数据验证失败'
        return false
      }

      // 保存到存储
      await saveThemeToStorage(theme)

      // 更新主题列表
      const existingIndex = themes.value.findIndex(t => t.id === theme.id)
      if (existingIndex >= 0) {
        themes.value[existingIndex] = theme
      } else {
        themes.value.push(theme)
      }

      // 如果是当前主题，更新当前主题
      if (currentTheme.value?.id === theme.id) {
        currentTheme.value = theme
      }

      return true
    } catch (err) {
      error.value = `保存主题失败: ${err}`
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteTheme = async (themeId: string): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null

      // 从存储中删除
      await deleteThemeFromStorage(themeId)

      // 从主题列表中移除
      const index = themes.value.findIndex(t => t.id === themeId)
      if (index >= 0) {
        themes.value.splice(index, 1)
      }

      // 如果是当前主题，清空当前主题
      if (currentTheme.value?.id === themeId) {
        currentTheme.value = null
      }

      return true
    } catch (err) {
      error.value = `删除主题失败: ${err}`
      return false
    } finally {
      loading.value = false
    }
  }

  const createTheme = (themeData: Partial<Theme>): Theme => {
    const now = new Date().toISOString()
    return {
      id: themeData.id || `theme_${Date.now()}`,
      title: themeData.title || '未命名主题',
      prelude: themeData.prelude || {
        title: '',
        chapter: '',
        subtitle: '',
        background: '',
        coverImage: '',
        author: '',
        tags: []
      },
      images: themeData.images || ['', '', '', ''],
      scenes: themeData.scenes || {
        scene1: '',
        scene2: '',
        scene3: '',
        epilogue: ''
      },
      meta: {
        ...themeData.meta,
        createdAt: now,
        updatedAt: now,
        locale: 'zh-CN'
      }
    }
  }

  const duplicateTheme = (themeId: string): Theme | ThemeV2 | null => {
    const theme = themes.value.find(t => t.id === themeId)
    if (!theme) return null

    // 检查是否为v2格式
    if (Array.isArray(theme.scenes)) {
      // v2格式：直接复制
      const duplicated: ThemeV2 = {
        ...(theme as ThemeV2),
        id: `theme_${Date.now()}`,
        title: `${theme.title} (副本)`,
        meta: {
          ...theme.meta,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      return duplicated
    } else {
      // v1格式：使用createTheme
      const duplicated = createTheme({
        ...(theme as Theme),
        id: `theme_${Date.now()}`,
        title: `${theme.title} (副本)`
      })
      return duplicated
    }
  }

  // 存储操作（这些方法将在存储工具中实现）
  const loadThemeFromStorage = async (themeId: string): Promise<Theme | null> => {
    try {
      return await indexedDBUtils.getTheme(themeId)
    } catch (err) {
      console.error('Failed to load theme from storage:', err)
      return null
    }
  }

  const saveThemeToStorage = async (theme: Theme | ThemeV2): Promise<void> => {
    try {
      await indexedDBUtils.saveTheme(theme)
    } catch (err) {
      console.error('Failed to save theme to storage:', err)
      throw err
    }
  }

  const deleteThemeFromStorage = async (themeId: string): Promise<void> => {
    try {
      await indexedDBUtils.deleteTheme(themeId)
    } catch (err) {
      console.error('Failed to delete theme from storage:', err)
      throw err
    }
  }

  // 主题列表管理
  const loadThemes = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      // 从存储加载所有主题
      const savedThemes = await loadAllThemesFromStorage()
      
      // 如果没有找到主题，直接清空状态，不显示错误
      if (!savedThemes || savedThemes.length === 0) {
        themes.value = []
        loading.value = false
        return
      }
      
      themes.value = savedThemes
    } catch (err) {
      // 加载失败时也清空状态，不显示错误
      console.error('加载主题失败:', err)
      themes.value = []
      error.value = null
    } finally {
      loading.value = false
    }
  }

  const loadAllThemesFromStorage = async (): Promise<Theme[]> => {
    try {
      return await indexedDBUtils.getAllThemes()
    } catch (err) {
      console.error('Failed to load themes from storage:', err)
      return []
    }
  }

  // 清空错误
  const clearError = () => {
    error.value = null
  }

  // 清空所有状态（用于重试失败时）
  const clearAll = () => {
    currentTheme.value = null
    themes.value = []
    loading.value = false
    error.value = null
  }

  // 日间/夜间模式切换
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    saveThemeModeToStorage()
    applyThemeMode()
  }

  const setDarkMode = (dark: boolean) => {
    isDarkMode.value = dark
    saveThemeModeToStorage()
    applyThemeMode()
  }

  const saveThemeModeToStorage = () => {
    try {
      localStorage.setItem('malaquad_theme_mode', JSON.stringify(isDarkMode.value))
    } catch (error) {
      console.error('Failed to save theme mode to localStorage:', error)
    }
  }

  const loadThemeModeFromStorage = () => {
    try {
      const saved = localStorage.getItem('malaquad_theme_mode')
      if (saved !== null) {
        isDarkMode.value = JSON.parse(saved)
      } else {
        // 第一次打开，默认为日间模式
        isDarkMode.value = false
      }
      applyThemeMode()
    } catch (error) {
      console.error('Failed to load theme mode from localStorage:', error)
      isDarkMode.value = false
      applyThemeMode()
    }
  }

  const applyThemeMode = () => {
    const root = document.documentElement
    if (isDarkMode.value) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }

  // 重置状态
  const reset = () => {
    currentTheme.value = null
    themes.value = []
    loading.value = false
    error.value = null
  }

  return {
    // 状态
    currentTheme,
    themes,
    loading,
    error,
    isDarkMode,
    
    // 计算属性
    currentThemeData,
    availableThemes,
    isLoading,
    hasError,
    errorMessage,
    isDark,
    
    // Actions
    loadTheme,
    saveTheme,
    deleteTheme,
    createTheme,
    duplicateTheme,
    loadThemes,
    clearError,
    clearAll,
    
    // 日间/夜间模式
    toggleDarkMode,
    setDarkMode,
    loadThemeModeFromStorage,
    applyThemeMode,
    
    reset
  }
})
