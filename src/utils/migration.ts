// 数据迁移工具 - 从 v1 迁移到 v2

import type { Theme } from '@/types'
import type { ThemeV2, Scene } from '@/types/v2'
import { SCENE_TYPES, SCENE_ORDERS } from '@/types/v2'

/**
 * 数据迁移工具类
 * 负责将旧版本数据结构迁移到新版本
 */
export class DataMigration {
  /**
   * 将 v1 主题迁移到 v2
   */
  static migrateThemeV1ToV2(themeV1: Theme): ThemeV2 {
    const scenes: Scene[] = []

    // 创建序幕场景
    scenes.push({
      id: `${themeV1.id}_prelude`,
      type: SCENE_TYPES.PRELUDE,
      order: SCENE_ORDERS.PRELUDE,
      title: themeV1.prelude.title,
      content: themeV1.prelude.subtitle || themeV1.prelude.title,
      image: themeV1.prelude.coverImage,
      chapterTitle: '序幕'
    })

    // 创建场景
    const sceneData = [
      { key: 'scene1', order: SCENE_ORDERS.SCENE1, chapterTitle: themeV1.chapterTitles?.[0] || '第一幕' },
      { key: 'scene2', order: SCENE_ORDERS.SCENE2, chapterTitle: themeV1.chapterTitles?.[1] || '第二幕' },
      { key: 'scene3', order: SCENE_ORDERS.SCENE3, chapterTitle: themeV1.chapterTitles?.[2] || '第三幕' },
      { key: 'epilogue', order: SCENE_ORDERS.EPILOGUE, chapterTitle: themeV1.chapterTitles?.[3] || '尾声' }
    ]

    sceneData.forEach((scene, index) => {
      scenes.push({
        id: `${themeV1.id}_${scene.key}`,
        type: scene.key === 'epilogue' ? SCENE_TYPES.EPILOGUE : SCENE_TYPES.SCENE,
        order: scene.order,
        title: scene.chapterTitle,
        content: (themeV1.scenes as any)[scene.key] || '',
        image: themeV1.images[index],
        chapterTitle: scene.chapterTitle
      })
    })

    return {
      id: themeV1.id,
      title: themeV1.title,
      prelude: {
        title: themeV1.prelude.title,
        subtitle: themeV1.prelude.subtitle,
        background: themeV1.prelude.background,
        author: themeV1.prelude.author,
        tags: themeV1.prelude.tags,
        coverImage: themeV1.prelude.coverImage
      },
      scenes,
      meta: themeV1.meta
    }
  }

  /**
   * 将 v2 主题转换为 v1 格式（向后兼容）
   */
  static migrateThemeV2ToV1(themeV2: ThemeV2): Theme {
    // 按顺序排序场景
    const sortedScenes = themeV2.scenes.sort((a, b) => a.order - b.order)
    
    // 分离序幕和场景
    const preludeScene = sortedScenes.find(s => s.type === SCENE_TYPES.PRELUDE)
    const sceneScenes = sortedScenes.filter(s => s.type === SCENE_TYPES.SCENE)
    const epilogueScene = sortedScenes.find(s => s.type === SCENE_TYPES.EPILOGUE)

    // 构建场景内容
    const scenes = {
      scene1: sceneScenes[0]?.content || '',
      scene2: sceneScenes[1]?.content || '',
      scene3: sceneScenes[2]?.content || '',
      epilogue: epilogueScene?.content || ''
    }

    // 构建图片数组
    const images = [
      sceneScenes[0]?.image,
      sceneScenes[1]?.image,
      sceneScenes[2]?.image,
      epilogueScene?.image
    ].filter(Boolean) as string[]

    // 构建章节标题
    const chapterTitles = [
      sceneScenes[0]?.chapterTitle,
      sceneScenes[1]?.chapterTitle,
      sceneScenes[2]?.chapterTitle,
      epilogueScene?.chapterTitle
    ].filter(Boolean) as string[]

    return {
      id: themeV2.id,
      title: themeV2.title,
      prelude: {
        title: themeV2.prelude.title,
        subtitle: preludeScene?.content || themeV2.prelude.subtitle,
        background: themeV2.prelude.background,
        author: themeV2.prelude.author,
        tags: themeV2.prelude.tags,
        coverImage: preludeScene?.image || themeV2.prelude.coverImage
      },
      images,
      scenes,
      chapterTitles,
      meta: themeV2.meta
    }
  }

  /**
   * 批量迁移主题
   */
  static migrateThemesV1ToV2(themesV1: Theme[]): ThemeV2[] {
    return themesV1.map(theme => this.migrateThemeV1ToV2(theme))
  }

  /**
   * 批量迁移主题（反向）
   */
  static migrateThemesV2ToV1(themesV2: ThemeV2[]): Theme[] {
    return themesV2.map(theme => this.migrateThemeV2ToV1(theme))
  }

  /**
   * 检查主题版本
   */
  static getThemeVersion(theme: any): 'v1' | 'v2' | 'unknown' {
    if (theme.scenes && Array.isArray(theme.scenes)) {
      return 'v2'
    } else if (theme.scenes && typeof theme.scenes === 'object' && theme.scenes.scene1) {
      return 'v1'
    }
    return 'unknown'
  }

  /**
   * 自动迁移主题（智能检测版本）
   */
  static autoMigrateTheme(theme: any): ThemeV2 {
    const version = this.getThemeVersion(theme)
    
    switch (version) {
      case 'v1':
        return this.migrateThemeV1ToV2(theme)
      case 'v2':
        return theme as ThemeV2
      default:
        throw new Error('无法识别的主题版本')
    }
  }

  /**
   * 验证迁移后的主题
   */
  static validateMigratedTheme(themeV2: ThemeV2): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查基本字段
    if (!themeV2.id) errors.push('主题ID缺失')
    if (!themeV2.title) errors.push('主题标题缺失')
    if (!themeV2.prelude.title) errors.push('序幕标题缺失')

    // 检查场景
    if (!themeV2.scenes || themeV2.scenes.length === 0) {
      errors.push('场景数据缺失')
    } else {
      // 检查场景顺序
      const orders = themeV2.scenes.map(s => s.order).sort()
      const expectedOrders = [0, 1, 2, 3, 4]
      if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
        errors.push('场景顺序不正确')
      }

      // 检查场景类型
      const types = themeV2.scenes.map(s => s.type)
      if (!types.includes(SCENE_TYPES.PRELUDE)) {
        errors.push('缺少序幕场景')
      }
      if (!types.includes(SCENE_TYPES.EPILOGUE)) {
        errors.push('缺少尾声场景')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
