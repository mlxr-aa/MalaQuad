<template>
  <div class="pwa-settings">
    <div class="settings-header">
      <h3>PWA 设置</h3>
      <button @click="closeSettings" class="close-btn">×</button>
    </div>

    <div class="settings-content">
      <!-- 安装状态 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-icon">📱</span>
          <span>应用状态</span>
        </div>
        <div class="setting-value">
          <span
            :class="[
              'status-badge',
              isInstalled ? 'installed' : 'not-installed',
            ]"
          >
            {{ isInstalled ? '已安装' : '未安装' }}
          </span>
        </div>
      </div>

      <!-- 缓存信息 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-icon">💾</span>
          <span>缓存大小</span>
        </div>
        <div class="setting-value">
          <span class="cache-size">{{ formattedCacheSize }}</span>
          <button
            @click="refreshCacheSize"
            class="refresh-btn"
            :disabled="loading"
          >
            {{ loading ? '...' : '刷新' }}
          </button>
        </div>
      </div>

      <!-- 缓存管理 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-icon">🗑️</span>
          <span>清除缓存</span>
        </div>
        <div class="setting-value">
          <button @click="clearCache" class="clear-btn" :disabled="loading">
            {{ loading ? '清除中...' : '清除缓存' }}
          </button>
        </div>
      </div>

      <!-- 更新检查 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-icon">🔄</span>
          <span>检查更新</span>
        </div>
        <div class="setting-value">
          <button
            @click="checkForUpdates"
            class="update-btn"
            :disabled="loading"
          >
            {{ loading ? '检查中...' : '检查更新' }}
          </button>
        </div>
      </div>

      <!-- 离线状态 -->
      <div class="setting-item">
        <div class="setting-label">
          <span class="setting-icon">🌐</span>
          <span>网络状态</span>
        </div>
        <div class="setting-value">
          <span :class="['network-status', isOnline ? 'online' : 'offline']">
            {{ isOnline ? '在线' : '离线' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="settings-tips">
      <p>💡 PWA 功能让您可以：</p>
      <ul>
        <li>将应用安装到主屏幕</li>
        <li>离线使用应用</li>
        <li>获得原生应用般的体验</li>
        <li>自动更新到最新版本</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { pwaManager } from '@/utils/pwa'

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const cacheSize = ref(0)
const isOnline = ref(navigator.onLine)

const isInstalled = computed(() => pwaManager.getInstallationStatus())
const formattedCacheSize = computed(() =>
  pwaManager.formatCacheSize(cacheSize.value)
)

const closeSettings = () => {
  emit('close')
}

const refreshCacheSize = async () => {
  loading.value = true
  try {
    cacheSize.value = await pwaManager.getCacheSize()
  } catch (error) {
    console.error('获取缓存大小失败:', error)
  } finally {
    loading.value = false
  }
}

const clearCache = async () => {
  if (!confirm('确定要清除所有缓存吗？这将删除离线数据。')) {
    return
  }

  loading.value = true
  try {
    await pwaManager.clearCache()
    await refreshCacheSize()
    alert('缓存已清除')
  } catch (error) {
    console.error('清除缓存失败:', error)
    alert('清除缓存失败')
  } finally {
    loading.value = false
  }
}

const checkForUpdates = async () => {
  loading.value = true
  try {
    await pwaManager.updateApp()
    alert('正在检查更新...')
  } catch (error) {
    console.error('检查更新失败:', error)
    alert('检查更新失败')
  } finally {
    loading.value = false
  }
}

const handleOnlineStatusChange = () => {
  isOnline.value = navigator.onLine
}

onMounted(async () => {
  await refreshCacheSize()
  window.addEventListener('online', handleOnlineStatusChange)
  window.addEventListener('offline', handleOnlineStatusChange)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineStatusChange)
  window.removeEventListener('offline', handleOnlineStatusChange)
})
</script>

<style scoped>
.pwa-settings {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.settings-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.settings-content {
  margin-bottom: 24px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  color: #333;
}

.setting-icon {
  font-size: 18px;
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.installed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.not-installed {
  background: #fff3e0;
  color: #f57c00;
}

.cache-size {
  font-family: monospace;
  color: #666;
}

.refresh-btn,
.clear-btn,
.update-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.refresh-btn:hover,
.clear-btn:hover,
.update-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.clear-btn {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.clear-btn:hover {
  background: #ff6b6b;
  color: white;
}

.update-btn {
  border-color: #4caf50;
  color: #4caf50;
}

.update-btn:hover {
  background: #4caf50;
  color: white;
}

.network-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.network-status.online {
  background: #e8f5e8;
  color: #2e7d32;
}

.network-status.offline {
  background: #ffebee;
  color: #c62828;
}

.settings-tips {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 16px;
}

.settings-tips p {
  margin: 0 0 12px 0;
  font-weight: 500;
  color: #333;
}

.settings-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  line-height: 1.6;
}

.settings-tips li {
  margin-bottom: 4px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .pwa-settings {
    margin: 16px;
    padding: 20px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .setting-value {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
