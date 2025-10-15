// 主题导出相关类型定义

// 导出格式枚举
export type ExportFormat = 'json' | 'zip' | 'html' | 'pdf'

// 图片数据
export interface ExportedImage {
  name: string
  data: string // base64 编码的图片数据
  type: string // MIME 类型
  size: number // 文件大小
}

// 导出的主题数据
export interface ExportedTheme {
  // 主题基本信息
  id: string
  title: string
  version: string
  
  // 序幕数据
  prelude: {
    title: string
    subtitle?: string
    background?: string
    coverImage?: ExportedImage
    author?: string
    tags?: string[]
  }
  
  // 场景数据
  scenes: {
    scene1: string
    scene2: string
    scene3: string
    epilogue: string
  }
  
  // 章节标题
  chapterTitles?: string[]
  
  // 图片数据
  images: ExportedImage[]
  
  // 元数据
  meta: {
    createdAt: string
    updatedAt: string
    exportedAt: string
    exportedBy: string
    appVersion: string
  }
}

// 主题包数据
export interface ThemePackage {
  // 包信息
  package: {
    name: string
    version: string
    description: string
    author: string
    createdAt: string
    exportedAt: string
  }
  
  // 主题列表
  themes: ExportedTheme[]
  
  // 导出信息
  export: {
    format: ExportFormat
    version: string
    appVersion: string
    exportedAt: string
    exportedBy: string
  }
}

// 导出选项
export interface ExportOptions {
  format: ExportFormat
  includeImages: boolean
  compress: boolean
  includeMetadata: boolean
  fileName?: string
}

// 导出结果
export interface ExportResult {
  success: boolean
  data?: Blob | string | null
  fileName: string
  size: number
  error?: string
}

// HTML 导出模板数据
export interface HTMLExportData {
  title: string
  theme: ExportedTheme
  styles: string
  scripts: string
}

// 导出进度回调
export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'packaging' | 'complete'
  progress: number // 0-100
  message: string
}
