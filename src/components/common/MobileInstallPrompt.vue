<template>
  <div v-if="showPrompt" class="mobile-install-prompt">
    <div class="prompt-content">
      <div class="prompt-header">
        <div class="app-icon">
          <svg
            width="32"
            height="32"
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
        <div class="app-info">
          <h3>麻辣四格</h3>
          <p>安装到主屏幕，获得更好体验</p>
        </div>
        <button @click="closePrompt" class="close-btn">×</button>
      </div>

      <div class="install-steps">
        <div v-if="isIOS" class="ios-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-text">
              <p>点击底部分享按钮</p>
              <div class="share-button-demo">📤 分享</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-text">
              <p>选择"添加到主屏幕"</p>
              <div class="menu-demo">📱 添加到主屏幕</div>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-text">
              <p>点击"添加"完成安装</p>
            </div>
          </div>
        </div>

        <div v-else-if="isAndroid" class="android-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-text">
              <p>点击浏览器菜单（三个点）</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-text">
              <p>选择"添加到主屏幕"或"安装应用"</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-text">
              <p>确认安装</p>
            </div>
          </div>
        </div>

        <div v-else class="general-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-text">
              <p>点击浏览器菜单</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-text">
              <p>查找"安装"或"添加到主屏幕"选项</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-text">
              <p>按照提示完成安装</p>
            </div>
          </div>
        </div>
      </div>

      <div class="prompt-footer">
        <button @click="markAsInstalled" class="got-it-btn">知道了</button>
        <button @click="dismissPrompt" class="later-btn">稍后提醒</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const showPrompt = ref(false)
const isIOS = ref(false)
const isAndroid = ref(false)

// 检测设备类型
const checkDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  isIOS.value = /iphone|ipad|ipod/.test(userAgent)
  isAndroid.value = /android/.test(userAgent)
}

// 检测是否已安装
const isInstalled = computed(() => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    localStorage.getItem('pwa-installed') === 'true'
  )
})

// 检查是否应该显示提示
const shouldShow = () => {
  if (isInstalled.value) return false

  // 检查是否在24小时内被拒绝过
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  if (dismissed) {
    const dismissedTime = parseInt(dismissed)
    const now = Date.now()
    const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60)
    if (hoursSinceDismissed < 24) return false
  }

  return true
}

const closePrompt = () => {
  showPrompt.value = false
}

const markAsInstalled = () => {
  localStorage.setItem('pwa-installed', 'true')
  showPrompt.value = false
}

const dismissPrompt = () => {
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  showPrompt.value = false
}

onMounted(() => {
  checkDevice()

  // 延迟显示，给用户时间浏览应用
  setTimeout(() => {
    if (shouldShow()) {
      showPrompt.value = true
    }
  }, 5000) // 5秒后显示

  // 监听安装事件
  window.addEventListener('appinstalled', () => {
    localStorage.setItem('pwa-installed', 'true')
    showPrompt.value = false
  })
})
</script>

<style scoped>
.mobile-install-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.prompt-content {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.prompt-header {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  gap: 12px;
}

.app-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.app-info {
  flex: 1;
}

.app-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.app-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.install-steps {
  padding: 20px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.step:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
}

.step-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.share-button-demo,
.menu-demo {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #666;
  display: inline-block;
  margin-top: 4px;
}

.prompt-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
}

.got-it-btn,
.later-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.got-it-btn {
  background: #ff6b6b;
  color: white;
  border: none;
}

.got-it-btn:hover {
  background: #ff5252;
}

.later-btn {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.later-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

@media (max-width: 480px) {
  .mobile-install-prompt {
    padding: 16px;
  }

  .prompt-content {
    max-height: 85vh;
  }

  .prompt-header {
    padding: 16px;
  }

  .install-steps {
    padding: 16px;
  }

  .prompt-footer {
    padding: 16px;
    flex-direction: column;
  }

  .got-it-btn,
  .later-btn {
    width: 100%;
  }
}
</style>
