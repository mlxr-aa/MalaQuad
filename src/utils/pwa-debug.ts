// PWA调试工具
export class PWADebugger {
  // 检查PWA支持情况
  static checkPWASupport() {
    const results = {
      serviceWorker: 'serviceWorker' in navigator,
      manifest: 'onbeforeinstallprompt' in window,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      iosStandalone: (window.navigator as any).standalone === true,
      userAgent: navigator.userAgent,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/.test(navigator.userAgent),
      isChrome: /Chrome/.test(navigator.userAgent),
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    }
    
    console.log('🔍 PWA支持检查:', results)
    return results
  }

  // 检查安装状态
  static checkInstallationStatus() {
    const status = {
      isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true,
      localStorage: localStorage.getItem('pwa-installed') === 'true',
      dismissed: localStorage.getItem('pwa-install-dismissed'),
      manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href')
    }
    
    console.log('📱 安装状态检查:', status)
    return status
  }

  // 检查Service Worker状态
  static async checkServiceWorkerStatus() {
    if (!('serviceWorker' in navigator)) {
      console.log('❌ Service Worker不支持')
      return null
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const status = {
        registrations: registrations.length,
        swFiles: registrations.map(reg => reg.active?.scriptURL),
        scope: registrations.map(reg => reg.scope)
      }
      
      console.log('⚙️ Service Worker状态:', status)
      return status
    } catch (error) {
      console.error('❌ Service Worker检查失败:', error)
      return null
    }
  }

  // 检查缓存状态
  static async checkCacheStatus() {
    if (!('caches' in window)) {
      console.log('❌ Cache API不支持')
      return null
    }

    try {
      const cacheNames = await caches.keys()
      const cacheInfo = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name)
          const keys = await cache.keys()
          return {
            name,
            size: keys.length,
            urls: keys.map(req => req.url)
          }
        })
      )
      
      console.log('💾 缓存状态:', cacheInfo)
      return cacheInfo
    } catch (error) {
      console.error('❌ 缓存检查失败:', error)
      return null
    }
  }

  // 清除所有PWA数据
  static async clearAllPWAData() {
    console.log('🧹 清除PWA数据...')
    
    // 清除localStorage
    localStorage.removeItem('pwa-installed')
    localStorage.removeItem('pwa-install-dismissed')
    
    // 清除Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(reg => reg.unregister()))
      console.log('✅ Service Worker已清除')
    }
    
    // 清除缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('✅ 缓存已清除')
    }
    
    console.log('🎉 PWA数据清除完成')
  }

  // 模拟安装事件
  static simulateInstallEvent() {
    console.log('🎭 模拟安装事件...')
    
    // 模拟beforeinstallprompt事件
    const event = new Event('beforeinstallprompt')
    ;(event as any).preventDefault = () => {}
    ;(event as any).prompt = () => Promise.resolve({ userChoice: Promise.resolve({ outcome: 'accepted' }) })
    
    window.dispatchEvent(event)
    console.log('✅ beforeinstallprompt事件已触发')
  }

  // 完整诊断
  static async fullDiagnosis() {
    console.log('🔬 开始PWA完整诊断...')
    
    const support = this.checkPWASupport()
    const installation = this.checkInstallationStatus()
    const swStatus = await this.checkServiceWorkerStatus()
    const cacheStatus = await this.checkCacheStatus()
    
    const diagnosis = {
      support,
      installation,
      serviceWorker: swStatus,
      cache: cacheStatus,
      timestamp: new Date().toISOString()
    }
    
    console.log('📊 PWA诊断报告:', diagnosis)
    return diagnosis
  }

  // 测试安装提示
  static testInstallPrompt() {
    console.log('🧪 测试安装提示...')
    
    // 清除之前的拒绝记录
    localStorage.removeItem('pwa-install-dismissed')
    localStorage.removeItem('pwa-installed')
    
    // 模拟设备检测
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    console.log('📱 移动设备检测:', isMobile)
    
    if (isMobile) {
      console.log('✅ 移动设备，应该显示安装提示')
    } else {
      console.log('💻 桌面设备，可能不会显示安装提示')
    }
  }
}

// 全局调试函数
declare global {
  interface Window {
    pwaDebug: typeof PWADebugger
  }
}

// 将调试工具挂载到window对象
if (typeof window !== 'undefined') {
  window.pwaDebug = PWADebugger
  console.log('🛠️ PWA调试工具已加载，使用 window.pwaDebug 访问')
}
