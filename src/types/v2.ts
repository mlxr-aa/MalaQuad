// 麻辣四格 v2.0 数据结构 - 场景对象数组方案

// 场景类型枚举
export type SceneType = 'prelude' | 'scene' | 'epilogue'

// 场景对象
export interface Scene {
  id: string
  type: SceneType
  order: number // 显示顺序
  title: string // 场景标题
  content: string // 场景内容
  image?: string // 场景图片URL
  chapterTitle?: string // 章节标题（用于显示）
}

// 序幕数据（特殊场景）
export interface Prelude {
  title: string
  subtitle?: string
  background?: string
  author?: string
  tags?: string[]
  coverImage?: string
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

// 新版本主题数据结构
export interface ThemeV2 {
  id: string
  title: string
  prelude: Prelude
  scenes: Scene[] // 场景数组，包含序幕、场景和尾声
  meta?: ThemeMeta
}

// 应用状态（保持不变）
export interface AppState {
  index: number        // 当前场景索引
  themeId: string      // 当前主题ID
  fontScale: 1 | 1.2   // 字体缩放
  unlockedMax: number  // 已解锁最大场景数
}

// 场景创建选项
export interface CreateSceneOptions {
  type: SceneType
  title: string
  content?: string
  image?: string
  chapterTitle?: string
}

// 场景更新选项
export interface UpdateSceneOptions {
  title?: string
  content?: string
  image?: string
  chapterTitle?: string
}

// 主题创建选项
export interface CreateThemeOptions {
  title: string
  prelude: Prelude
  scenes?: CreateSceneOptions[]
}

// 场景验证结果
export interface SceneValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 主题验证结果
export interface ThemeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sceneResults: SceneValidationResult[]
}

// 场景排序选项
export interface SceneSortOptions {
  by: 'order' | 'type' | 'title'
  direction: 'asc' | 'desc'
}

// 场景查询选项
export interface SceneQueryOptions {
  type?: SceneType
  hasImage?: boolean
  hasContent?: boolean
  order?: {
    min?: number
    max?: number
  }
}

// 导出场景数据
export interface ExportedScene {
  id: string
  type: SceneType
  order: number
  title: string
  content: string
  image?: {
    name: string
    data: string
    type: string
    size: number
  }
  chapterTitle?: string
}

// 导出主题数据
export interface ExportedThemeV2 {
  id: string
  title: string
  version: string
  prelude: {
    title: string
    subtitle?: string
    background?: string
    author?: string
    tags?: string[]
    coverImage?: {
      name: string
      data: string
      type: string
      size: number
    }
  }
  scenes: ExportedScene[]
  meta: {
    createdAt: string
    updatedAt: string
    exportedAt: string
    exportedBy: string
    appVersion: string
  }
}

// 默认场景配置
export const DEFAULT_SCENES: CreateSceneOptions[] = [
  { type: 'scene', title: '第一幕', content: '', chapterTitle: '第一幕' },
  { type: 'scene', title: '第二幕', content: '', chapterTitle: '第二幕' },
  { type: 'scene', title: '第三幕', content: '', chapterTitle: '第三幕' },
  { type: 'epilogue', title: '尾声', content: '', chapterTitle: '尾声' }
]

// 场景类型常量
export const SCENE_TYPES = {
  PRELUDE: 'prelude' as SceneType,
  SCENE: 'scene' as SceneType,
  EPILOGUE: 'epilogue' as SceneType
} as const

// 场景排序常量
export const SCENE_ORDERS = {
  PRELUDE: 0,
  SCENE1: 1,
  SCENE2: 2,
  SCENE3: 3,
  EPILOGUE: 4
} as const
