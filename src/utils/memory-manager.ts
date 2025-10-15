/**
 * 内存管理工具
 * 用于防止大图片导致应用闪退
 */
export class MemoryManager {
  private static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB单张图片限制

  /**
   * 检查内存使用情况
   */
  static checkMemoryUsage(): boolean {
    // 简单的内存使用检查
    if ((performance as any).memory) {
      const usedMemory = (performance as any).memory.usedJSHeapSize
      const totalMemory = (performance as any).memory.totalJSHeapSize
      const memoryRatio = usedMemory / totalMemory
      
      console.log(`内存使用情况: ${Math.round(usedMemory / 1024 / 1024)}MB / ${Math.round(totalMemory / 1024 / 1024)}MB (${Math.round(memoryRatio * 100)}%)`)
      
      return memoryRatio < 0.8 // 如果内存使用超过80%，返回false
    }
    
    return true
  }

  /**
   * 检查图片大小是否安全
   */
  static isImageSizeSafe(size: number): boolean {
    return size <= this.MAX_IMAGE_SIZE
  }

  /**
   * 获取建议的图片质量
   */
  static getSuggestedQuality(originalSize: number): number {
    if (originalSize <= 1024 * 1024) { // 1MB以下
      return 0.9
    } else if (originalSize <= 2 * 1024 * 1024) { // 2MB以下
      return 0.8
    } else if (originalSize <= 5 * 1024 * 1024) { // 5MB以下
      return 0.7
    } else {
      return 0.6 // 超过5MB，使用较低质量
    }
  }

  /**
   * 获取建议的图片尺寸
   */
  static getSuggestedDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
    const maxWidth = 1920
    const maxHeight = 1080
    
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight }
    }
    
    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    }
  }

  /**
   * 清理内存
   */
  static cleanup(): void {
    // 强制垃圾回收（如果可用）
    if ((window as any).gc) {
      (window as any).gc()
    }
    
    // 清理URL对象
    if (window.URL) {
      // 这里可以维护一个URL列表进行清理
    }
    
    console.log('🧹 内存清理完成')
  }

  /**
   * 积极清理内存 - 用于大文件处理
   */
  static aggressiveCleanup(): void {
    // 多次尝试垃圾回收
    for (let i = 0; i < 3; i++) {
      if ((window as any).gc) {
        (window as any).gc()
      }
    }
    
    // 清理可能的缓存
    if (window.caches) {
      window.caches.keys().then(names => {
        names.forEach(name => {
          window.caches.delete(name)
        })
      })
    }
    
    console.log('🧹 积极内存清理完成')
  }

  /**
   * 检查是否可以安全处理图片
   */
  static canProcessImage(imageSize: number): boolean {
    return this.checkMemoryUsage() && this.isImageSizeSafe(imageSize)
  }

  /**
   * 获取内存警告信息
   */
  static getMemoryWarning(): string {
    if ((performance as any).memory) {
      const usedMemory = (performance as any).memory.usedJSHeapSize
      const totalMemory = (performance as any).memory.totalJSHeapSize
      const memoryRatio = usedMemory / totalMemory
      
      if (memoryRatio > 0.8) {
        return '⚠️ 内存使用率较高，建议减少图片数量或选择较小的图片'
      } else if (memoryRatio > 0.6) {
        return '💡 内存使用率中等，建议选择较小的图片以获得更好的性能'
      }
    }
    
    return ''
  }
}

// 扩展Window接口以支持内存管理
declare global {
  interface Window {
    gc?: () => void
  }
}
