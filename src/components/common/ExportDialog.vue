<template>
  <div v-if="show" class="export-dialog-overlay" @click="handleOverlayClick">
    <div class="export-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">导出故事</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-content">
        <div class="export-options">
          <div class="option-group">
            <label class="option-label">导出格式</label>
            <div class="format-options">
              <label
                class="format-option"
                :class="{ active: selectedFormat === 'json' }"
              >
                <input
                  type="radio"
                  v-model="selectedFormat"
                  value="json"
                  class="format-radio"
                />
                <span class="format-info">
                  <span class="format-name">ZIP</span>
                  <span class="format-desc">包含完整数据和图片的压缩包</span>
                </span>
              </label>

              <label
                class="format-option"
                :class="{ active: selectedFormat === 'html' }"
              >
                <input
                  type="radio"
                  v-model="selectedFormat"
                  value="html"
                  class="format-radio"
                />
                <span class="format-info">
                  <span class="format-name">HTML</span>
                  <span class="format-desc">可读的网页格式</span>
                </span>
              </label>

              <label
                class="format-option"
                :class="{ active: selectedFormat === 'pdf' }"
              >
                <input
                  type="radio"
                  v-model="selectedFormat"
                  value="pdf"
                  class="format-radio"
                />
                <span class="format-info">
                  <span class="format-name">PDF</span>
                  <span class="format-desc">适合阅读的PDF格式</span>
                </span>
              </label>
            </div>
          </div>

          <div class="option-group">
            <label class="option-label">导出选项</label>
            <div class="checkbox-options">
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="includeImages"
                  class="option-checkbox"
                />
                <span>包含图片</span>
              </label>

              <label class="checkbox-option">
                <input
                  type="checkbox"
                  v-model="includeMetadata"
                  class="option-checkbox"
                />
                <span>包含元数据</span>
              </label>
            </div>
          </div>

          <div class="option-group">
            <label class="option-label">文件名</label>
            <input
              type="text"
              v-model="fileName"
              class="file-name-input"
              placeholder="自动生成文件名"
            />
          </div>

          <div class="option-group">
            <label class="option-label">导出信息</label>
            <div class="export-info">
              <div class="info-item">
                <span class="info-label">故事版本:</span>
                <span class="info-value">{{ getThemeVersion() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">导出格式:</span>
                <span class="info-value">{{
                  selectedFormat === 'json'
                    ? 'ZIP'
                    : selectedFormat.toUpperCase()
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">包含图片:</span>
                <span class="info-value">{{
                  includeImages ? '是' : '否'
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出进度 -->
        <div v-if="isExporting" class="export-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-text">{{ progressMessage }}</div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-outline" @click="close" :disabled="isExporting">
          取消
        </button>
        <button
          class="btn btn-primary"
          @click="startExport"
          :disabled="isExporting"
        >
          {{ isExporting ? '导出中...' : '开始导出' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Theme } from '@/types'
import type { ThemeV2 } from '@/types/v2'
import type { ExportOptions, ExportProgress } from '@/types/export'
import { ThemeExporterV2 } from '@/utils/theme-export-v2'
import { DataMigration } from '@/utils/migration'

interface Props {
  show: boolean
  theme: Theme | null
}

interface Emits {
  (e: 'close'): void
  (e: 'export-complete', result: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式状态
const selectedFormat = ref<'json' | 'html' | 'pdf'>('json')
const includeImages = ref(true)
const includeMetadata = ref(true)
const fileName = ref('')
const isExporting = ref(false)
const progress = ref(0)
const progressMessage = ref('')

// 计算属性
// const canExport = computed(() => {
//   return props.theme && !isExporting.value
// })

// 方法
const close = () => {
  if (!isExporting.value) {
    emit('close')
  }
}

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const startExport = async () => {
  if (!props.theme || isExporting.value) return

  isExporting.value = true
  progress.value = 0
  progressMessage.value = '准备导出...'

  try {
    const options: ExportOptions = {
      format: selectedFormat.value,
      includeImages: includeImages.value,
      compress: false,
      includeMetadata: includeMetadata.value,
      fileName: fileName.value || undefined,
    }

    // 检测主题版本并自动迁移到v2
    const themeVersion = DataMigration.getThemeVersion(props.theme)
    let result

    if (themeVersion === 'v1') {
      // 迁移到v2并使用v2导出器
      progressMessage.value = '迁移到新格式...'
      const themeV2 = DataMigration.migrateThemeV1ToV2(props.theme)

      if (selectedFormat.value === 'json') {
        result = await ThemeExporterV2.exportToJSON(
          themeV2,
          options,
          handleProgress
        )
      } else if (selectedFormat.value === 'html') {
        result = await ThemeExporterV2.exportToHTML(
          themeV2,
          options,
          handleProgress
        )
      } else if (selectedFormat.value === 'pdf') {
        result = await ThemeExporterV2.exportToPDF(
          themeV2,
          options,
          handleProgress
        )
      }
    } else {
      // 直接使用v2导出器
      if (selectedFormat.value === 'json') {
        result = await ThemeExporterV2.exportToJSON(
          props.theme as unknown as ThemeV2,
          options,
          handleProgress
        )
      } else if (selectedFormat.value === 'html') {
        result = await ThemeExporterV2.exportToHTML(
          props.theme as unknown as ThemeV2,
          options,
          handleProgress
        )
      } else if (selectedFormat.value === 'pdf') {
        result = await ThemeExporterV2.exportToPDF(
          props.theme as unknown as ThemeV2,
          options,
          handleProgress
        )
      }
    }

    if (result?.success && result.data) {
      // 使用v2导出器的下载方法
      ThemeExporterV2.downloadFile(result.data as Blob, result.fileName)
      emit('export-complete', result)
    } else {
      throw new Error(result?.error || '导出失败')
    }
  } catch (error) {
    console.error('Export failed:', error)
    alert(`导出失败: ${error}`)
  } finally {
    isExporting.value = false
    progress.value = 0
    progressMessage.value = ''
  }
}

const handleProgress = (progressData: ExportProgress) => {
  progress.value = progressData.progress
  progressMessage.value = progressData.message
}

const getThemeVersion = () => {
  if (!props.theme) return '未知'
  return DataMigration.getThemeVersion(props.theme)
}

// 监听主题变化，自动生成文件名
watch(
  () => props.theme,
  (theme) => {
    if (theme) {
      const dateStr = new Date().toISOString().split('T')[0]
      if (selectedFormat.value === 'json') {
        fileName.value = `${theme.title}_${dateStr}.zip`
      } else {
        fileName.value = `${theme.title}_${dateStr}`
      }
    }
  },
  { immediate: true }
)

// 监听格式变化，更新文件名扩展名
watch(
  () => selectedFormat.value,
  (newFormat) => {
    if (props.theme && fileName.value) {
      const baseName = fileName.value.replace(/\.(zip|html|pdf)$/, '')
      if (newFormat === 'json') {
        fileName.value = `${baseName}.zip`
      } else if (newFormat === 'html') {
        fileName.value = `${baseName}.html`
      } else if (newFormat === 'pdf') {
        fileName.value = `${baseName}.html` // PDF实际导出为HTML
      }
    }
  }
)
</script>

<style scoped>
.export-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
  backdrop-filter: blur(4px);
}

.export-dialog {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all var(--transition-base);
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.dialog-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

.option-group {
  margin-bottom: 24px;
}

.option-label {
  display: block;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 12px;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.format-option:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
}

.format-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-white);
}

.format-radio {
  margin-right: 12px;
}

.format-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.format-name {
  font-weight: var(--font-weight-medium);
}

.format-desc {
  font-size: var(--font-size-sm);
  opacity: 0.8;
}

.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.option-checkbox {
  margin: 0;
}

.file-name-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.file-name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.2);
}

.export-info {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.info-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.export-progress {
  margin-top: 20px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--transition-base);
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
  flex-shrink: 0;
  background: var(--bg-primary);
}

.btn {
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .export-dialog-overlay {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }

  .export-dialog {
    width: 100%;
    max-width: none;
    max-height: calc(100vh - 40px);
    margin: 0;
    border-radius: 12px 12px 0 0;
  }

  .dialog-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .dialog-title {
    font-size: 18px;
  }

  .dialog-content {
    padding: 16px 20px;
    max-height: calc(100vh - 140px);
  }

  .dialog-actions {
    flex-direction: column;
    padding: 16px 20px;
    gap: 12px;
    position: sticky;
    bottom: 0;
    background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }

  .btn {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
  }

  .format-options {
    flex-direction: column;
    gap: 8px;
  }

  .format-option {
    padding: 12px;
    border-radius: 8px;
  }

  .option-group {
    margin-bottom: 20px;
  }

  .checkbox-options {
    flex-direction: column;
    gap: 12px;
  }

  .checkbox-option {
    padding: 12px;
    border-radius: 8px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .export-dialog-overlay {
    padding: 5px;
    padding-top: 10px;
  }

  .export-dialog {
    max-height: calc(100vh - 20px);
  }

  .dialog-content {
    padding: 12px 16px;
  }

  .dialog-actions {
    padding: 12px 16px;
  }
}
</style>
