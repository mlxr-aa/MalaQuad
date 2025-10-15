// 麻辣四格核心类型定义

// 序幕数据结构
export interface Prelude {
  title: string
  chapter?: string
  subtitle?: string
  background?: string
  coverImage?: string
  author?: string
  tags?: string[]
}

// 场景数据结构
export interface Scenes {
  scene1: string
  scene2: string
  scene3: string
  epilogue: string
}

// 主题元数据
export interface ThemeMeta {
  locale?: string
  createdAt?: string
  updatedAt?: string
  version?: string
  isDraft?: boolean
  extra?: Record<string, any>
}

// 主题数据结构
export interface Theme {
  id: string
  title: string
  prelude: Prelude
  images: string[] // 4张图片URL
  scenes: Scenes
  chapterTitles?: string[] // 章节标题数组
  meta?: ThemeMeta
}

// 应用状态
export interface AppState {
  index: number        // 当前幕索引 (0-4)
  themeId: string      // 当前主题ID
  fontScale: 1 | 1.2   // 字体缩放
  unlockedMax: number  // 已解锁最大幕数
}

// 主题状态
export interface ThemeState {
  currentTheme: Theme | null
  themes: Theme[]
  loading: boolean
  error: string | null
}

// 编辑器状态
export interface EditorState {
  currentTheme: Theme | null
  isEditing: boolean
  hasUnsavedChanges: boolean
  draftData: Theme | null
}

// 导航方向
export type NavigationDirection = 'prev' | 'next'

// 字体缩放选项
export type FontScale = 1 | 1.2

// 验证结果
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 图片信息
export interface ImageInfo {
  url: string
  width: number
  height: number
  size: number
  type: string
}

// 存储配置
export interface StorageConfig {
  themeId: string
  fontScale: FontScale
  unlockedMax: number
}

// 导入导出选项
export interface ImportExportOptions {
  format: 'json' | 'base64' | 'zip'
  includeImages: boolean
  compress: boolean
}

// 错误类型
export interface AppError {
  code: string
  message: string
  details?: any
}

// 组件Props类型
export interface ReaderProps {
  theme: Theme
  currentIndex: number
  unlockedMax: number
}

export interface EditorProps {
  theme: Theme | null
  mode: 'create' | 'edit'
}

export interface NavigationProps {
  current: number
  max: number
  canNavigatePrev: boolean
  canNavigateNext: boolean
}

export interface ProgressIndicatorProps {
  current: number
  total: number
  unlocked: number
}

// 事件类型
export interface ReaderEmits {
  'update:index': (index: number) => void
  'navigate': (direction: NavigationDirection) => void
}

export interface EditorEmits {
  'save': (theme: Theme) => void
  'cancel': () => void
  'preview': (theme: Theme) => void
}

export interface NavigationEmits {
  'navigate': (direction: NavigationDirection) => void
  'jump': (index: number) => void
}

// 工具函数类型
export type ThemeValidator = (theme: Theme) => ValidationResult
export type TextValidator = (text: string, maxLength: number) => boolean
export type ImageValidator = (file: File) => ValidationResult

// 存储操作类型
export interface StorageOperations {
  saveTheme: (theme: Theme) => Promise<void>
  loadTheme: (id: string) => Promise<Theme | null>
  deleteTheme: (id: string) => Promise<void>
  listThemes: () => Promise<Theme[]>
  saveDraft: (theme: Theme) => Promise<void>
  loadDraft: () => Promise<Theme | null>
  clearDraft: () => Promise<void>
}

// 性能监控类型
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  imageLoadTime: number
}

// 设备信息类型
export interface DeviceInfo {
  platform: 'android' | 'ios' | 'web'
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  orientation: 'portrait' | 'landscape'
}

// 主题包信息
export interface ThemePackage {
  themes: Theme[]
  metadata: {
    name: string
    version: string
    description: string
    author: string
  }
}
