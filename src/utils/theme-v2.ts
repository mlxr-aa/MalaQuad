// 主题 v2 管理工具

import type { ThemeV2, Scene, CreateSceneOptions, UpdateSceneOptions, SceneQueryOptions } from '@/types/v2'
import { SCENE_TYPES, SCENE_ORDERS, DEFAULT_SCENES } from '@/types/v2'

/**
 * 主题 v2 管理工具类
 */
export class ThemeV2Manager {
  /**
   * 创建新主题
   */
  static createTheme(options: {
    title: string
    prelude: {
      title: string
      subtitle?: string
      background?: string
      author?: string
      tags?: string[]
      coverImage?: string
    }
  }): ThemeV2 {
    const id = `theme_${Date.now()}`
    
    // 创建默认场景
    const scenes: Scene[] = DEFAULT_SCENES.map((sceneOptions, index) => ({
      id: `${id}_scene_${index + 1}`,
      type: sceneOptions.type,
      order: sceneOptions.type === SCENE_TYPES.SCENE ? index + 1 : SCENE_ORDERS.EPILOGUE,
      title: sceneOptions.title,
      content: sceneOptions.content || '',
      image: sceneOptions.image,
      chapterTitle: sceneOptions.chapterTitle
    }))

    return {
      id,
      title: options.title,
      prelude: options.prelude,
      scenes,
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '2.0'
      }
    }
  }

  /**
   * 添加场景
   */
  static addScene(theme: ThemeV2, options: CreateSceneOptions): ThemeV2 {
    const newScene: Scene = {
      id: `${theme.id}_scene_${Date.now()}`,
      type: options.type,
      order: theme.scenes.length,
      title: options.title,
      content: options.content || '',
      image: options.image,
      chapterTitle: options.chapterTitle
    }

    return {
      ...theme,
      scenes: [...theme.scenes, newScene],
      meta: {
        ...theme.meta,
        updatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 更新场景
   */
  static updateScene(theme: ThemeV2, sceneId: string, options: UpdateSceneOptions): ThemeV2 {
    const updatedScenes = theme.scenes.map(scene => 
      scene.id === sceneId 
        ? { ...scene, ...options }
        : scene
    )

    return {
      ...theme,
      scenes: updatedScenes,
      meta: {
        ...theme.meta,
        updatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 删除场景
   */
  static removeScene(theme: ThemeV2, sceneId: string): ThemeV2 {
    const filteredScenes = theme.scenes.filter(scene => scene.id !== sceneId)
    
    // 重新排序
    const reorderedScenes = filteredScenes.map((scene, index) => ({
      ...scene,
      order: index
    }))

    return {
      ...theme,
      scenes: reorderedScenes,
      meta: {
        ...theme.meta,
        updatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 重新排序场景
   */
  static reorderScenes(theme: ThemeV2, sceneIds: string[]): ThemeV2 {
    const sceneMap = new Map(theme.scenes.map(scene => [scene.id, scene]))
    const reorderedScenes = sceneIds.map((id, index) => {
      const scene = sceneMap.get(id)
      return scene ? { ...scene, order: index } : null
    }).filter(Boolean) as Scene[]

    return {
      ...theme,
      scenes: reorderedScenes,
      meta: {
        ...theme.meta,
        updatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 查询场景
   */
  static queryScenes(theme: ThemeV2, options: SceneQueryOptions): Scene[] {
    let scenes = theme.scenes

    if (options.type) {
      scenes = scenes.filter(scene => scene.type === options.type)
    }

    if (options.hasImage !== undefined) {
      scenes = scenes.filter(scene => options.hasImage ? !!scene.image : !scene.image)
    }

    if (options.hasContent !== undefined) {
      scenes = scenes.filter(scene => options.hasContent ? !!scene.content : !scene.content)
    }

    if (options.order) {
      scenes = scenes.filter(scene => {
        if (options.order!.min !== undefined && scene.order < options.order!.min) return false
        if (options.order!.max !== undefined && scene.order > options.order!.max) return false
        return true
      })
    }

    return scenes.sort((a, b) => a.order - b.order)
  }

  /**
   * 获取场景
   */
  static getScene(theme: ThemeV2, sceneId: string): Scene | undefined {
    return theme.scenes.find(scene => scene.id === sceneId)
  }

  /**
   * 获取场景（按顺序）
   */
  static getSceneByOrder(theme: ThemeV2, order: number): Scene | undefined {
    return theme.scenes.find(scene => scene.order === order)
  }

  /**
   * 获取序幕场景
   */
  static getPreludeScene(theme: ThemeV2): Scene | undefined {
    return theme.scenes.find(scene => scene.type === SCENE_TYPES.PRELUDE)
  }

  /**
   * 获取普通场景
   */
  static getSceneScenes(theme: ThemeV2): Scene[] {
    return theme.scenes
      .filter(scene => scene.type === SCENE_TYPES.SCENE)
      .sort((a, b) => a.order - b.order)
  }

  /**
   * 获取尾声场景
   */
  static getEpilogueScene(theme: ThemeV2): Scene | undefined {
    return theme.scenes.find(scene => scene.type === SCENE_TYPES.EPILOGUE)
  }

  /**
   * 获取所有场景（按顺序）
   */
  static getAllScenes(theme: ThemeV2): Scene[] {
    return theme.scenes.sort((a, b) => a.order - b.order)
  }

  /**
   * 验证主题
   */
  static validateTheme(theme: ThemeV2): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 基本验证
    if (!theme.id) errors.push('主题ID缺失')
    if (!theme.title) errors.push('主题标题缺失')
    if (!theme.prelude.title) errors.push('序幕标题缺失')

    // 场景验证
    if (!theme.scenes || theme.scenes.length === 0) {
      errors.push('场景数据缺失')
    } else {
      // 检查场景顺序
      const orders = theme.scenes.map(s => s.order)
      const uniqueOrders = [...new Set(orders)]
      if (orders.length !== uniqueOrders.length) {
        errors.push('场景顺序重复')
      }

      // 检查必需场景
      const types = theme.scenes.map(s => s.type)
      if (!types.includes(SCENE_TYPES.PRELUDE)) {
        errors.push('缺少序幕场景')
      }
      if (!types.includes(SCENE_TYPES.EPILOGUE)) {
        errors.push('缺少尾声场景')
      }

      // 检查场景内容
      theme.scenes.forEach((scene, index) => {
        if (!scene.title) errors.push(`场景${index + 1}标题缺失`)
        if (!scene.content) errors.push(`场景${index + 1}内容缺失`)
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取主题统计信息
   */
  static getThemeStats(theme: ThemeV2): {
    totalScenes: number
    sceneCount: number
    hasImages: number
    hasContent: number
    completionRate: number
  } {
    const totalScenes = theme.scenes.length
    const sceneCount = theme.scenes.filter(s => s.type === SCENE_TYPES.SCENE).length
    const hasImages = theme.scenes.filter(s => !!s.image).length
    const hasContent = theme.scenes.filter(s => !!s.content).length
    const completionRate = totalScenes > 0 ? (hasContent / totalScenes) * 100 : 0

    return {
      totalScenes,
      sceneCount,
      hasImages,
      hasContent,
      completionRate
    }
  }
}
