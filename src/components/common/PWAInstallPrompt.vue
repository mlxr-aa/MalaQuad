<template>
  <div v-if="showInstallPrompt" class="pwa-install-prompt">
    <div class="install-prompt-content">
      <div class="install-prompt-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div class="install-prompt-text">
        <h3>安装麻辣四格</h3>
        <p v-if="!isIOS && deferredPrompt">
          将应用添加到主屏幕，获得更好的体验
        </p>
        <div v-else-if="isIOS" class="ios-instructions">
          <p>将应用添加到主屏幕：</p>
          <ol>
            <li>点击底部分享按钮 <span class="share-icon">📤</span></li>
            <li>选择"添加到主屏幕"</li>
            <li>点击"添加"</li>
          </ol>
        </div>
        <p v-else>将应用添加到主屏幕，获得更好的体验</p>
      </div>
      <div class="install-prompt-actions">
        <button
          v-if="!isIOS && deferredPrompt"
          @click="installApp"
          class="install-btn"
        >
          安装
        </button>
        <button v-else-if="isIOS" @click="dismissPrompt" class="install-btn">
          知道了
        </button>
        <button v-else @click="dismissPrompt" class="install-btn">
          知道了
        </button>
        <button @click="dismissPrompt" class="dismiss-btn">稍后</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const showInstallPrompt = ref(false)
const isIOS = ref(false)
const isInStandaloneMode = ref(false)
let deferredPrompt: any = null

// 检测是否为iOS设备
const checkIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  )
}

// 检测是否已安装（独立模式）
const checkStandaloneMode = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

// 验证PWA是否真正安装
const verifyPWAInstallation = () => {
  // 检查是否在独立模式下运行
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true

  // 如果不在独立模式，清除安装记录
  if (!isStandalone) {
    localStorage.removeItem('pwa-installed')
    console.log('PWA未真正安装，清除安装记录')
  }

  return isStandalone
}

// 检测是否已安装过
const isAlreadyInstalled = computed(() => {
  // 首先验证PWA是否真正安装
  const isReallyInstalled = verifyPWAInstallation()
  return isReallyInstalled
})

// 检查是否应该显示安装提示
const shouldShowPrompt = computed(() => {
  // 如果已经安装，不显示
  if (isAlreadyInstalled.value) return false

  // 检查是否在24小时内被拒绝过
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed) {
    const dismissedTime = parseInt(dismissed)
    const now = Date.now()
    const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60)
    if (hoursSinceDismissed < 24) return false
  }

  return true
})

onMounted(() => {
  // 检测设备类型
  isIOS.value = checkIOS()
  isInStandaloneMode.value = checkStandaloneMode()

  // 验证PWA安装状态
  verifyPWAInstallation()

  // 监听 beforeinstallprompt 事件（主要针对Android Chrome）
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt 事件触发')
    // 阻止默认的安装提示
    e.preventDefault()
    // 保存事件，以便稍后触发
    deferredPrompt = e
    // 显示自定义安装提示
    if (shouldShowPrompt.value) {
      showInstallPrompt.value = true
    }
  })

  // 监听 appinstalled 事件
  window.addEventListener('appinstalled', () => {
    console.log('PWA 已安装')
    showInstallPrompt.value = false
    deferredPrompt = null
    localStorage.setItem('pwa-installed', 'true')
  })

  // 检测显示模式变化
  window
    .matchMedia('(display-mode: standalone)')
    .addEventListener('change', (e) => {
      isInStandaloneMode.value = e.matches
    })

  // 延迟显示提示（给用户一些时间浏览应用）
  setTimeout(() => {
    if (shouldShowPrompt.value && !deferredPrompt) {
      // 对于iOS或没有beforeinstallprompt事件的情况，显示手动安装提示
      showInstallPrompt.value = true
    }
  }, 3000) // 3秒后显示
})

const installApp = async () => {
  if (deferredPrompt) {
    // 显示安装提示
    deferredPrompt.prompt()
    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice
    console.log(`用户选择: ${outcome}`)
    // 清除保存的事件
    deferredPrompt = null
    showInstallPrompt.value = false
  }
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  // 可以设置一个时间间隔，避免频繁显示
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  margin: 0 auto;
}

.install-prompt-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 16px;
}

.install-prompt-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.install-prompt-text {
  flex: 1;
}

.install-prompt-text h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.install-prompt-text p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.ios-instructions {
  margin: 0;
}

.ios-instructions p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.ios-instructions ol {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.ios-instructions li {
  margin-bottom: 4px;
}

.share-icon {
  font-size: 16px;
  margin-left: 4px;
}

.install-prompt-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.install-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.install-btn:hover {
  background: #ff5252;
}

.dismiss-btn {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dismiss-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

@media (max-width: 480px) {
  .pwa-install-prompt {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }

  .install-prompt-content {
    padding: 16px;
    gap: 12px;
  }

  .install-prompt-icon {
    width: 40px;
    height: 40px;
  }

  .install-prompt-text h3 {
    font-size: 15px;
  }

  .install-prompt-text p {
    font-size: 13px;
  }

  .install-prompt-actions {
    flex-direction: column;
    gap: 6px;
  }

  .install-btn,
  .dismiss-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
