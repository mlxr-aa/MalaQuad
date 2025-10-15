import type { Theme, ValidationResult, ImageInfo } from '@/types'

// 验证规则常量
const VALIDATION_RULES = {
  TEXT: {
    MAX_LENGTH: 500,
    MIN_LENGTH: 1,
    ALLOWED_CHARS: /^[\u4e00-\u9fa5\w\s.,!?;:()""''-]*$/,
    REQUIRED_FIELDS: ['title']
  },
  IMAGE: {
    MAX_SIZE: 5000 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_DIMENSIONS: { width: 4096, height: 4096 },
    MIN_DIMENSIONS: { width: 1080, height: 608 }, // 16:9 ratio minimum
    ASPECT_RATIO: 16 / 9
  },
  THEME: {
    REQUIRED_IMAGES: 4,
    REQUIRED_SCENES: ['scene1', 'scene2', 'scene3', 'epilogue'],
    EPILOGUE_KEYWORDS: ['二人幸终', 'HE', 'Happy End', 'happy end', 'HAPPY END']
  }
} as const

// 文本验证
export const validateText = (text: string, maxLength: number = VALIDATION_RULES.TEXT.MAX_LENGTH): boolean => {
  if (!text || typeof text !== 'string') return false
  if (text.length < VALIDATION_RULES.TEXT.MIN_LENGTH) return false
  if (text.length > maxLength) return false
  if (!VALIDATION_RULES.TEXT.ALLOWED_CHARS.test(text)) return false
  return true
}

// 图片文件验证
export const validateImageFile = (file: File): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查文件类型
  if (!VALIDATION_RULES.IMAGE.ALLOWED_TYPES.includes(file.type as any)) {
    errors.push(`不支持的文件类型: ${file.type}。支持的格式: ${VALIDATION_RULES.IMAGE.ALLOWED_TYPES.join(', ')}`)
  }

  // 检查文件大小
  if (file.size > VALIDATION_RULES.IMAGE.MAX_SIZE) {
    errors.push(`文件大小超过限制: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${(VALIDATION_RULES.IMAGE.MAX_SIZE / 1024 / 1024).toFixed(2)}MB`)
  }

  // 检查文件大小是否过小（可能是损坏的文件）
  if (file.size < 1024) { // 小于1KB
    warnings.push('文件大小异常小，请检查文件是否完整')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 图片URL验证
export const validateImageUrl = async (url: string): Promise<ValidationResult> => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // 检查URL格式
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('只支持HTTP和HTTPS协议的图片URL')
    }

    // 尝试加载图片获取尺寸信息
    const imageInfo = await getImageInfo(url)
    if (imageInfo) {
      // 检查图片尺寸
      if (imageInfo.width < VALIDATION_RULES.IMAGE.MIN_DIMENSIONS.width || 
          imageInfo.height < VALIDATION_RULES.IMAGE.MIN_DIMENSIONS.height) {
        warnings.push(`图片尺寸过小: ${imageInfo.width}x${imageInfo.height}，建议至少1080x608`)
      }

      // 检查宽高比
      const aspectRatio = imageInfo.width / imageInfo.height
      const expectedRatio = VALIDATION_RULES.IMAGE.ASPECT_RATIO
      const ratioDiff = Math.abs(aspectRatio - expectedRatio)
      if (ratioDiff > 0.1) { // 允许10%的误差
        warnings.push(`图片宽高比不是16:9，当前比例: ${aspectRatio.toFixed(2)}`)
      }

      // 检查文件大小
      if (imageInfo.size > VALIDATION_RULES.IMAGE.MAX_SIZE) {
        errors.push(`图片文件过大: ${(imageInfo.size / 1024 / 1024).toFixed(2)}MB`)
      }
    }
  } catch (error) {
    errors.push(`无法访问图片URL: ${error}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 获取图片信息
export const getImageInfo = (url: string): Promise<ImageInfo | null> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      resolve({
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: 0, // URL无法获取文件大小
        type: 'image'
      })
    }
    
    img.onerror = () => {
      resolve(null)
    }
    
    img.src = url
  })
}

// 序幕验证
export const validatePrelude = (prelude: any): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查必填字段
  if (!prelude.title || !validateText(prelude.title, 30)) {
    errors.push('标题是必填字段，且不能超过30个字符')
  }

  // 检查副标题
  if (prelude.subtitle && !validateText(prelude.subtitle, 50)) {
    errors.push('副标题不能超过50个字符')
  }

  // 检查背景说明
  if (prelude.background && !validateText(prelude.background, 200)) {
    errors.push('背景说明不能超过200个字符')
  }

  // 检查作者信息
  if (prelude.author && !validateText(prelude.author, 20)) {
    warnings.push('作者名称建议不超过20个字符')
  }

  // 检查标签
  if (prelude.tags && Array.isArray(prelude.tags)) {
    if (prelude.tags.length > 5) {
      warnings.push('标签数量建议不超过5个')
    }
    prelude.tags.forEach((tag: string, index: number) => {
      if (!validateText(tag, 10)) {
        errors.push(`标签${index + 1}格式不正确`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 场景验证
export const validateScenes = (scenes: any): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查必填场景
  VALIDATION_RULES.THEME.REQUIRED_SCENES.forEach(sceneKey => {
    if (!scenes[sceneKey] || !validateText(scenes[sceneKey], VALIDATION_RULES.TEXT.MAX_LENGTH)) {
      errors.push(`${sceneKey}是必填字段，且不能超过${VALIDATION_RULES.TEXT.MAX_LENGTH}个字符`)
    }
  })

  // 检查尾声是否包含关键词
  if (scenes.epilogue) {
    const epilogueText = scenes.epilogue.toLowerCase()
    const hasKeyword = VALIDATION_RULES.THEME.EPILOGUE_KEYWORDS.some(keyword => 
      epilogueText.includes(keyword.toLowerCase())
    )
    if (!hasKeyword) {
      errors.push('尾声必须包含"二人幸终"或类似表述')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 图片数组验证
export const validateImages = (images: string[]): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查图片数量
  if (!Array.isArray(images)) {
    errors.push('图片数据必须是数组格式')
    return { isValid: false, errors, warnings }
  }

  if (images.length !== VALIDATION_RULES.THEME.REQUIRED_IMAGES) {
    errors.push(`必须提供${VALIDATION_RULES.THEME.REQUIRED_IMAGES}张图片`)
  }

  // 检查每张图片
  images.forEach((image, index) => {
    if (!image || typeof image !== 'string') {
      errors.push(`图片${index + 1}不能为空`)
    } else if (image.trim() === '') {
      errors.push(`图片${index + 1}不能为空字符串`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 主题完整验证
export const validateTheme = (theme: Theme): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查基本结构
  if (!theme.id || typeof theme.id !== 'string') {
    errors.push('主题ID是必填字段')
  }

  if (!theme.title || typeof theme.title !== 'string') {
    errors.push('主题标题是必填字段')
  }

  // 验证序幕
  if (theme.prelude) {
    const preludeResult = validatePrelude(theme.prelude)
    errors.push(...preludeResult.errors)
    warnings.push(...preludeResult.warnings)
  } else {
    errors.push('序幕信息是必填字段')
  }

  // 验证场景
  if (theme.scenes) {
    const scenesResult = validateScenes(theme.scenes)
    errors.push(...scenesResult.errors)
    warnings.push(...scenesResult.warnings)
  } else {
    errors.push('场景信息是必填字段')
  }

  // 验证图片
  if (theme.images) {
    const imagesResult = validateImages(theme.images)
    errors.push(...imagesResult.errors)
    warnings.push(...imagesResult.warnings)
  } else {
    errors.push('图片信息是必填字段')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// XSS防护 - 文本转义
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// XSS防护 - 反转义
export const unescapeHtml = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// 清理用户输入
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
    .replace(/\s+/g, ' ') // 合并多个空格
}

// 验证JSON数据
export const validateJsonData = (jsonString: string): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const data = JSON.parse(jsonString)
    
    if (typeof data !== 'object' || data === null) {
      errors.push('JSON数据必须是对象格式')
    } else {
      // 检查是否是主题数据
      if (data.id && data.title && data.prelude && data.scenes && data.images) {
        const themeResult = validateTheme(data as Theme)
        errors.push(...themeResult.errors)
        warnings.push(...themeResult.warnings)
      } else {
        warnings.push('JSON数据可能不是有效的主题格式')
      }
    }
  } catch (error) {
    errors.push(`JSON格式错误: ${error}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// 导出验证工具
export default {
  validateText,
  validateImageFile,
  validateImageUrl,
  validatePrelude,
  validateScenes,
  validateImages,
  validateTheme,
  validateJsonData,
  escapeHtml,
  unescapeHtml,
  sanitizeInput,
  getImageInfo
}
