import type { Theme, Prelude, Scenes, ThemeMeta } from '@/types'
import { validateTheme } from './validation'

/**
 * 主题工具函数
 * 提供主题相关的数据操作、验证、转换等功能
 */

/**
 * 创建新的主题
 */
export function createNewTheme(): Theme {
  const now = new Date().toISOString()
  
  return {
    id: `theme_${Date.now()}`,
    title: '新主题',
    prelude: {
      title: '',
      chapter: '',
      subtitle: '',
      background: '',
      coverImage: '',
      author: '',
      tags: []
    },
    images: ['', '', '', ''],
    scenes: {
      scene1: '',
      scene2: '',
      scene3: '',
      epilogue: ''
    },
    meta: {
      locale: 'zh-CN',
      createdAt: now,
      updatedAt: now
    }
  }
}

/**
 * 复制主题
 */
export function duplicateTheme(theme: Theme, newTitle?: string): Theme {
  const now = new Date().toISOString()
  
  return {
    ...theme,
    id: `theme_${Date.now()}`,
    title: newTitle || `${theme.title} (副本)`,
    meta: {
      ...theme.meta,
      createdAt: now,
      updatedAt: now
    }
  }
}

/**
 * 更新主题元数据
 */
export function updateThemeMeta(theme: Theme, updates: Partial<ThemeMeta>): Theme {
  return {
    ...theme,
    meta: {
      ...theme.meta,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  }
}

/**
 * 更新主题标题
 */
export function updateThemeTitle(theme: Theme, title: string): Theme {
  return {
    ...theme,
    title,
    meta: {
      ...theme.meta,
      updatedAt: new Date().toISOString()
    }
  }
}

/**
 * 更新序幕信息
 */
export function updatePrelude(theme: Theme, prelude: Partial<Prelude>): Theme {
  return {
    ...theme,
    prelude: {
      ...theme.prelude,
      ...prelude
    },
    meta: {
      ...theme.meta,
      updatedAt: new Date().toISOString()
    }
  }
}

/**
 * 更新场景内容
 */
export function updateScene(theme: Theme, sceneKey: keyof Scenes, content: string): Theme {
  return {
    ...theme,
    scenes: {
      ...theme.scenes,
      [sceneKey]: content
    },
    meta: {
      ...theme.meta,
      updatedAt: new Date().toISOString()
    }
  }
}

/**
 * 更新场景图片
 */
export function updateSceneImage(theme: Theme, sceneIndex: number, imageUrl: string): Theme {
  const newImages = [...theme.images]
  newImages[sceneIndex] = imageUrl
  
  return {
    ...theme,
    images: newImages,
    meta: {
      ...theme.meta,
      updatedAt: new Date().toISOString()
    }
  }
}

/**
 * 获取主题摘要信息
 */
export function getThemeSummary(theme: Theme) {
  const sceneCount = Object.values(theme.scenes).filter(scene => scene.trim()).length
  const imageCount = theme.images.filter(img => img.trim()).length
  
  return {
    id: theme.id,
    title: theme.title,
    preludeTitle: theme.prelude.title,
    author: theme.prelude.author,
    sceneCount,
    imageCount,
    hasCover: !!theme.prelude.coverImage,
    tags: theme.prelude.tags || [],
    createdAt: theme.meta?.createdAt || new Date().toISOString(),
    updatedAt: theme.meta?.updatedAt || new Date().toISOString(),
    isComplete: sceneCount === 4 && imageCount === 4
  }
}

/**
 * 检查主题是否完整
 */
export function isThemeComplete(theme: Theme): boolean {
  const validation = validateTheme(theme)
  return validation.isValid
}

/**
 * 获取主题完成度
 */
export function getThemeCompletion(theme: Theme): number {
  let completed = 0
  let total = 0
  
  // 序幕信息
  total += 1
  if (theme.prelude.title.trim()) completed += 1
  
  // 场景内容
  const scenes = Object.values(theme.scenes)
  total += scenes.length
  completed += scenes.filter(scene => scene.trim()).length
  
  // 场景图片
  total += theme.images.length
  completed += theme.images.filter(img => img.trim()).length
  
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

/**
 * 获取主题统计信息
 */
export function getThemeStats(theme: Theme) {
  const scenes = Object.values(theme.scenes)
  const totalTextLength = scenes.reduce((sum, scene) => sum + scene.length, 0)
  const avgTextLength = scenes.length > 0 ? Math.round(totalTextLength / scenes.length) : 0
  
  return {
    totalTextLength,
    avgTextLength,
    sceneCount: scenes.filter(scene => scene.trim()).length,
    imageCount: theme.images.filter(img => img.trim()).length,
    tagCount: theme.prelude.tags?.length || 0,
    completion: getThemeCompletion(theme)
  }
}

/**
 * 搜索主题
 */
export function searchThemes(themes: Theme[], query: string): Theme[] {
  if (!query.trim()) return themes
  
  const lowercaseQuery = query.toLowerCase()
  
  return themes.filter(theme => {
    // 搜索标题
    if (theme.title.toLowerCase().includes(lowercaseQuery)) return true
    if (theme.prelude.title.toLowerCase().includes(lowercaseQuery)) return true
    
    // 搜索副标题
    if (theme.prelude.subtitle?.toLowerCase().includes(lowercaseQuery)) return true
    
    // 搜索作者
    if (theme.prelude.author?.toLowerCase().includes(lowercaseQuery)) return true
    
    // 搜索标签
    if (theme.prelude.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))) return true
    
    // 搜索场景内容
    const scenes = Object.values(theme.scenes)
    if (scenes.some(scene => scene.toLowerCase().includes(lowercaseQuery))) return true
    
    return false
  })
}

/**
 * 按字段排序主题
 */
export function sortThemes(themes: Theme[], field: 'title' | 'createdAt' | 'updatedAt' | 'completion', order: 'asc' | 'desc' = 'desc'): Theme[] {
  return [...themes].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (field) {
      case 'title':
        aValue = a.prelude.title || a.title
        bValue = b.prelude.title || b.title
        break
      case 'createdAt':
        aValue = new Date(a.meta?.createdAt || new Date().toISOString())
        bValue = new Date(b.meta?.createdAt || new Date().toISOString())
        break
      case 'updatedAt':
        aValue = new Date(a.meta?.updatedAt || new Date().toISOString())
        bValue = new Date(b.meta?.updatedAt || new Date().toISOString())
        break
      case 'completion':
        aValue = getThemeCompletion(a)
        bValue = getThemeCompletion(b)
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * 过滤主题
 */
export function filterThemes(themes: Theme[], filters: {
  completion?: 'all' | 'complete' | 'incomplete'
  hasImages?: boolean
  hasTags?: boolean
  author?: string
}): Theme[] {
  return themes.filter(theme => {
    // 完成度过滤
    if (filters.completion === 'complete' && !isThemeComplete(theme)) return false
    if (filters.completion === 'incomplete' && isThemeComplete(theme)) return false
    
    // 图片过滤
    if (filters.hasImages && theme.images.every(img => !img.trim())) return false
    
    // 标签过滤
    if (filters.hasTags && (!theme.prelude.tags || theme.prelude.tags.length === 0)) return false
    
    // 作者过滤
    if (filters.author && !theme.prelude.author?.toLowerCase().includes(filters.author.toLowerCase())) return false
    
    return true
  })
}

/**
 * 导出主题数据
 */
export function exportThemeData(theme: Theme): string {
  return JSON.stringify(theme, null, 2)
}

/**
 * 导入主题数据
 */
export function importThemeData(jsonString: string): Theme {
  const data = JSON.parse(jsonString)
  
  // 验证数据格式
  if (!data.id || !data.prelude || !data.scenes || !data.meta) {
    throw new Error('无效的主题数据格式')
  }
  
  // 生成新的ID和时间戳
  data.id = `theme_${Date.now()}`
  data.meta.createdAt = new Date().toISOString()
  data.meta.updatedAt = new Date().toISOString()
  
  return data as Theme
}

/**
 * 批量导出主题数据
 */
export function exportThemesData(themes: Theme[]): string {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    themeCount: themes.length,
    themes
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * 批量导入主题数据
 */
export function importThemesData(jsonString: string): Theme[] {
  const data = JSON.parse(jsonString)
  
  if (!data.themes || !Array.isArray(data.themes)) {
    throw new Error('无效的主题包格式')
  }
  
  return data.themes.map((theme: any, index: number) => {
    // 为每个主题生成新的ID
    theme.id = `theme_${Date.now()}_${index}`
    theme.meta.createdAt = new Date().toISOString()
    theme.meta.updatedAt = new Date().toISOString()
    
    return theme as Theme
  })
}

/**
 * 清理主题数据
 */
export function cleanThemeData(theme: Theme): Theme {
  return {
    ...theme,
    prelude: {
      title: theme.prelude.title?.trim() || '',
      chapter: theme.prelude.chapter?.trim() || '',
      subtitle: theme.prelude.subtitle?.trim() || '',
      background: theme.prelude.background?.trim() || '',
      coverImage: theme.prelude.coverImage?.trim() || '',
      author: theme.prelude.author?.trim() || '',
      tags: theme.prelude.tags?.filter(tag => tag.trim()) || []
    },
    images: theme.images.map(img => img.trim()),
    scenes: {
      scene1: theme.scenes.scene1?.trim() || '',
      scene2: theme.scenes.scene2?.trim() || '',
      scene3: theme.scenes.scene3?.trim() || '',
      epilogue: theme.scenes.epilogue?.trim() || ''
    }
  }
}

/**
 * 验证主题数据完整性
 */
export function validateThemeData(theme: Theme): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 基本字段验证
  if (!theme.id) errors.push('主题ID不能为空')
  if (!theme.prelude.title.trim()) errors.push('主题标题不能为空')
  
  // 场景内容验证
  const scenes = Object.values(theme.scenes)
  if (scenes.every(scene => !scene.trim())) {
    errors.push('至少需要一个场景内容')
  }
  
  // 尾声特殊验证
  if (theme.scenes.epilogue.trim()) {
    const epilogueText = theme.scenes.epilogue.toLowerCase()
    const hasHappyEnding = ['二人幸终', 'he', 'happy end', 'happy ending'].some(keyword => 
      epilogueText.includes(keyword.toLowerCase())
    )
    if (!hasHappyEnding) {
      errors.push('尾声必须包含"二人幸终"或类似表述')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
