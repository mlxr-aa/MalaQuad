/**
 * 性能优化工具
 * 提供图片预加载、内存管理、响应式优化等功能
 * 支持移动端性能优化
 */

// 移动端工具已移除，使用Web标准API

interface ImagePreloadOptions {
  timeout?: number
  priority?: 'high' | 'low'
  onLoad?: (url: string) => void
  onError?: (url: string, error: Error) => void
}

interface PerformanceMetrics {
  loadTime: number
  memoryUsage: number
  imageCount: number
  cacheHitRate: number
}

class ImagePreloader {
  private cache = new Map<string, HTMLImageElement>()
  private loading = new Set<string>()
  private failed = new Set<string>()
  
  /**
   * 预加载单张图片
   */
  async preloadImage(url: string, options: ImagePreloadOptions = {}): Promise<HTMLImageElement> {
    if (!url.trim()) {
      throw new Error('图片URL不能为空')
    }
    
    // 检查缓存
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }
    
    // 检查是否正在加载
    if (this.loading.has(url)) {
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (this.cache.has(url)) {
            resolve(this.cache.get(url)!)
          } else if (this.failed.has(url)) {
            reject(new Error(`图片加载失败: ${url}`))
          } else {
            setTimeout(checkLoading, 50)
          }
        }
        checkLoading()
      })
    }
    
    // 检查是否已失败
    if (this.failed.has(url)) {
      throw new Error(`图片加载失败: ${url}`)
    }
    
    this.loading.add(url)
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      const timeout = options.timeout || 10000
      
      const timer = setTimeout(() => {
        this.loading.delete(url)
        this.failed.add(url)
        reject(new Error(`图片加载超时: ${url}`))
      }, timeout)
      
      img.onload = () => {
        clearTimeout(timer)
        this.loading.delete(url)
        this.cache.set(url, img)
        options.onLoad?.(url)
        resolve(img)
      }
      
      img.onerror = () => {
        clearTimeout(timer)
        this.loading.delete(url)
        this.failed.add(url)
        const error = new Error(`图片加载失败: ${url}`)
        options.onError?.(url, error)
        reject(error)
      }
      
      // 设置优先级
      if (options.priority === 'high') {
        img.loading = 'eager'
      } else {
        img.loading = 'lazy'
      }
      
      img.src = url
    })
  }
  
  /**
   * 批量预加载图片
   */
  async preloadImages(urls: string[], options: ImagePreloadOptions = {}): Promise<HTMLImageElement[]> {
    const promises = urls.map(url => 
      this.preloadImage(url, options).catch(error => {
        console.warn(`预加载图片失败: ${url}`, error)
        return null
      })
    )
    
    const results = await Promise.all(promises)
    return results.filter((img): img is HTMLImageElement => img !== null)
  }
  
  /**
   * 预加载主题图片
   */
  async preloadThemeImages(images: string[], coverImage?: string): Promise<void> {
    // 优先加载封面图片
    if (coverImage) {
      try {
        await this.preloadImage(coverImage, { priority: 'high' })
      } catch (error) {
        console.warn('封面图片预加载失败:', error)
      }
    }
    
    // 预加载场景图片
    await this.preloadImages(images, { priority: 'low' })
  }
  
  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
    this.failed.clear()
  }
  
  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      loadingCount: this.loading.size,
      failedCount: this.failed.size
    }
  }
}

// 全局图片预加载器实例
export const imagePreloader = new ImagePreloader()

/**
 * 内存管理工具
 */
class MemoryManager {
  private static instance: MemoryManager
  private cleanupTasks: (() => void)[] = []
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }
  
  /**
   * 注册清理任务
   */
  registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task)
  }
  
  /**
   * 执行内存清理
   */
  cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.warn('清理任务执行失败:', error)
      }
    })
    this.cleanupTasks = []
  }
  
  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }
  
  /**
   * 检查内存压力
   */
  isMemoryPressure(): boolean {
    const usage = this.getMemoryUsage()
    return usage > 50 * 1024 * 1024 // 50MB
  }
}

export const memoryManager = MemoryManager.getInstance()

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 懒加载图片
 */
export function createLazyImage(
  src: string,
  placeholder?: string,
  options: {
    root?: Element | null
    rootMargin?: string
    threshold?: number
  } = {}
): HTMLImageElement {
  const img = new Image()
  
  if (placeholder) {
    img.src = placeholder
  }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src
          observer.unobserve(img)
        }
      })
    },
    {
      root: options.root,
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.1
    }
  )
  
  observer.observe(img)
  
  return img
}

/**
 * 图片压缩
 */
export function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'image/jpeg' | 'image/png' | 'image/webp'
  } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'image/jpeg' } = options
      
      // 计算压缩后的尺寸
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      canvas.width = width
      canvas.height = height
      
      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        format,
        quality
      )
    }
    
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 性能监控
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private startTime = 0
  
  /**
   * 开始性能监控
   */
  start(): void {
    this.startTime = performance.now()
  }
  
  /**
   * 结束性能监控
   */
  end(): PerformanceMetrics {
    const loadTime = performance.now() - this.startTime
    const memoryUsage = memoryManager.getMemoryUsage()
    const cacheStats = imagePreloader.getCacheStats()
    
    const metrics: PerformanceMetrics = {
      loadTime,
      memoryUsage,
      imageCount: cacheStats.cacheSize,
      cacheHitRate: cacheStats.cacheSize / (cacheStats.cacheSize + cacheStats.failedCount) || 0
    }
    
    this.metrics.push(metrics)
    return metrics
  }
  
  /**
   * 获取性能报告
   */
  getReport(): {
    average: PerformanceMetrics
    latest: PerformanceMetrics
    count: number
  } {
    if (this.metrics.length === 0) {
      return {
        average: { loadTime: 0, memoryUsage: 0, imageCount: 0, cacheHitRate: 0 },
        latest: { loadTime: 0, memoryUsage: 0, imageCount: 0, cacheHitRate: 0 },
        count: 0
      }
    }
    
    const latest = this.metrics[this.metrics.length - 1]
    const average = this.metrics.reduce(
      (acc, metric) => ({
        loadTime: acc.loadTime + metric.loadTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        imageCount: acc.imageCount + metric.imageCount,
        cacheHitRate: acc.cacheHitRate + metric.cacheHitRate
      }),
      { loadTime: 0, memoryUsage: 0, imageCount: 0, cacheHitRate: 0 }
    )
    
    const count = this.metrics.length
    return {
      average: {
        loadTime: average.loadTime / count,
        memoryUsage: average.memoryUsage / count,
        imageCount: average.imageCount / count,
        cacheHitRate: average.cacheHitRate / count
      },
      latest,
      count
    }
  }
  
  /**
   * 清理性能数据
   */
  clear(): void {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * 响应式图片加载
 */
export function createResponsiveImage(
  src: string,
  sizes: { width: number; height: number }[],
  options: {
    placeholder?: string
    lazy?: boolean
  } = {}
): HTMLImageElement {
  const img = new Image()
  
  if (options.placeholder) {
    img.src = options.placeholder
  }
  
  // 选择最合适的尺寸
  const screenWidth = window.innerWidth
  const bestSize = sizes.reduce((best, size) => {
    if (size.width <= screenWidth && size.width > best.width) {
      return size
    }
    return best
  }, sizes[0])
  
  // 使用最佳尺寸（如果需要的话）
  console.log('Selected best size:', bestSize)
  
  if (options.lazy) {
    return createLazyImage(src, options.placeholder)
  } else {
    img.src = src
  }
  
  return img
}

/**
 * 图片格式检测
 */
export function detectImageFormat(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'image/jpeg'
  }
}

/**
 * 图片尺寸检测
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    
    img.onerror = () => {
      reject(new Error(`无法获取图片尺寸: ${url}`))
    }
    
    img.src = url
  })
}

/**
 * 批量图片尺寸检测
 */
export async function getBatchImageDimensions(urls: string[]): Promise<Map<string, { width: number; height: number }>> {
  const results = new Map<string, { width: number; height: number }>()
  
  const promises = urls.map(async (url) => {
    try {
      const dimensions = await getImageDimensions(url)
      results.set(url, dimensions)
    } catch (error) {
      console.warn(`获取图片尺寸失败: ${url}`, error)
    }
  })
  
  await Promise.all(promises)
  return results
}

/**
 * 性能优化建议
 */
export function getPerformanceSuggestions(metrics: PerformanceMetrics): string[] {
  const suggestions: string[] = []
  
  if (metrics.loadTime > 3000) {
    suggestions.push('页面加载时间过长，建议优化图片大小和数量')
  }
  
  if (metrics.memoryUsage > 50 * 1024 * 1024) {
    suggestions.push('内存使用过高，建议清理缓存或减少同时加载的图片')
  }
  
  if (metrics.cacheHitRate < 0.8) {
    suggestions.push('缓存命中率较低，建议优化图片预加载策略')
  }
  
  if (metrics.imageCount > 20) {
    suggestions.push('图片数量过多，建议使用懒加载或分页加载')
  }
  
  return suggestions
}

/**
 * 移动端性能优化
 */
export class MobilePerformanceOptimizer {
  private static instance: MobilePerformanceOptimizer
  private isInitialized = false
  
  static getInstance(): MobilePerformanceOptimizer {
    if (!MobilePerformanceOptimizer.instance) {
      MobilePerformanceOptimizer.instance = new MobilePerformanceOptimizer()
    }
    return MobilePerformanceOptimizer.instance
  }
  
  /**
   * 初始化性能优化
   */
  initialize(): void {
    if (this.isInitialized) return
    
    this.setupWebOptimizations()
    this.setupPerformanceMonitoring()
    this.setupMemoryManagement()
    
    this.isInitialized = true
  }
  
  /**
   * 设置Web优化
   */
  private setupWebOptimizations(): void {
    // 优化图片加载
    this.optimizeImageLoading()
    
    // 预加载关键资源
    this.preloadCriticalResources()
    
    // 网络优化
    this.setupNetworkOptimization()
  }
  
  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 监控页面加载性能
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      console.log('Performance metrics:', {
        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      })
    })
  }
  
  /**
   * 设置内存管理
   */
  private setupMemoryManagement(): void {
    // 定期清理内存
    setInterval(() => {
      this.cleanupMemory()
    }, 30000) // 每30秒清理一次
  }
  
  /**
   * 优化图片加载
   */
  private optimizeImageLoading(): void {
    // 图片懒加载
    const images = document.querySelectorAll('img[data-src]')
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.classList.remove('lazy')
          imageObserver.unobserve(img)
        }
      })
    })

    images.forEach(img => imageObserver.observe(img))
  }
  
  /**
   * 预加载关键资源
   */
  private preloadCriticalResources(): void {
    const criticalImages = [
      '/assets/images/logo.png',
      '/assets/images/background.jpg'
    ]

    criticalImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }
  
  /**
   * 网络优化
   */
  private setupNetworkOptimization(): void {
    let isOnline = navigator.onLine

    const updateNetworkStatus = () => {
      const wasOnline = isOnline
      isOnline = navigator.onLine

      if (wasOnline !== isOnline) {
        this.handleNetworkChange(isOnline)
      }
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
  }
  
  /**
   * 处理网络状态变化
   */
  private handleNetworkChange(isOnline: boolean): void {
    if (isOnline) {
      // 网络恢复，重新加载关键资源
      this.preloadCriticalResources()
    } else {
      // 网络断开，显示离线提示
      console.log('Network offline')
    }
  }
  
  /**
   * 清理内存
   */
  private cleanupMemory(): void {
    // 清理未使用的图片
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        img.src = ''
      }
    })
  }
  
  /**
   * 获取性能指标
   */
  getMetrics() {
    return {
      deviceType: this.getDeviceType(),
      viewport: this.getViewportInfo(),
      capabilities: {
        touch: 'ontouchstart' in window,
        orientation: 'orientation' in screen,
        geolocation: 'geolocation' in navigator
      },
      isMobile: this.isMobile(),
      pixelRatio: window.devicePixelRatio || 1
    }
  }
  
  /**
   * 检查是否为移动设备
   */
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
  
  /**
   * 检测设备类型
   */
  private getDeviceType(): 'phone' | 'tablet' | 'desktop' {
    const viewport = this.getViewportInfo()
    const { width, height } = viewport
    
    if (!this.isMobile()) return 'desktop'
    
    const minDimension = Math.min(width, height)
    const maxDimension = Math.max(width, height)
    
    // 平板判断：最小尺寸大于600px或宽高比接近1:1
    if (minDimension > 600 || (maxDimension / minDimension) < 1.5) {
      return 'tablet'
    }
    
    return 'phone'
  }
  
  /**
   * 获取视口信息
   */
  private getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    }
  }
}

// 导出移动端性能优化器实例
export const mobilePerformanceOptimizer = MobilePerformanceOptimizer.getInstance()

/**
 * 初始化所有性能优化
 */
export function initializePerformanceOptimizations(): void {
  // 初始化移动端优化
  mobilePerformanceOptimizer.initialize()
  
  // 注册内存清理任务
  memoryManager.registerCleanup(() => {
    imagePreloader.clearCache()
  })
  
  console.log('Performance optimizations initialized')
}
