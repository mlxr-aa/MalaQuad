import { Workbox } from 'workbox-window'

// PWA 相关工具类
export class PWAManager {
  private static instance: PWAManager
  private workbox: Workbox | null = null
  private isInstalled = false

  private constructor() {
    this.checkInstallation()
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  // 初始化 PWA
  public async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // 注册 Service Worker
        this.workbox = new Workbox('/sw.js')
        
        // 监听更新事件
        this.workbox.addEventListener('waiting', () => {
          this.showUpdatePrompt()
        })

        // 监听控制事件
        this.workbox.addEventListener('controlling', () => {
          window.location.reload()
        })

        // 注册 Service Worker
        await this.workbox.register()
        
        console.log('Service Worker 注册成功')
      } catch (error) {
        console.error('Service Worker 注册失败:', error)
      }
    }
  }

  // 检查是否已安装
  private checkInstallation(): void {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true
    }
  }

  // 显示更新提示
  private showUpdatePrompt(): void {
    if (confirm('发现新版本，是否立即更新？')) {
      this.updateApp()
    }
  }

  // 更新应用
  public async updateApp(): Promise<void> {
    if (this.workbox) {
      // 发送消息给Service Worker跳过等待
      this.workbox.messageSW({ type: 'SKIP_WAITING' })
    }
  }

  // 检查是否支持安装
  public canInstall(): boolean {
    return 'serviceWorker' in navigator && !this.isInstalled
  }

  // 获取安装状态
  public getInstallationStatus(): boolean {
    return this.isInstalled
  }

  // 清除缓存
  public async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('缓存已清除')
    }
  }

  // 获取缓存大小
  public async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0

    let totalSize = 0
    const cacheNames = await caches.keys()
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }
    
    return totalSize
  }

  // 格式化缓存大小
  public formatCacheSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// 导出单例实例
export const pwaManager = PWAManager.getInstance()
