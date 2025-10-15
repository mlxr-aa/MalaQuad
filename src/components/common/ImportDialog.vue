<template>
  <div v-if="show" class="import-dialog-overlay" @click="handleOverlayClick">
    <div class="import-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">导入故事</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="dialog-content">
        <div class="import-options">
          <div class="option-group">
            <label class="option-label">选择文件</label>
            <div class="file-input-container">
              <input
                ref="fileInput"
                type="file"
                accept=".zip"
                @change="handleFileSelect"
                class="file-input"
                id="theme-file-input"
              />
              <label for="theme-file-input" class="file-input-label">
                <span class="file-input-icon">📁</span>
                <span class="file-input-text"
                  >点击选择ZIP文件或拖拽文件到此处</span
                >
                <span class="file-input-hint">仅支持 ZIP 格式</span>
              </label>
            </div>
          </div>

          <div v-if="selectedFile" class="selected-file">
            <div class="file-info">
              <span class="file-icon">📄</span>
              <div class="file-details">
                <div class="file-name">{{ selectedFile.name }}</div>
                <div class="file-size">
                  {{ formatFileSize(selectedFile.size) }}
                </div>
              </div>
              <button class="remove-file-btn" @click="removeFile">×</button>
            </div>
          </div>

          <div v-if="importProgress > 0" class="import-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${importProgress}%` }"
              ></div>
            </div>
            <div class="progress-text">{{ progressMessage }}</div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="close">取消</button>
        <button
          class="btn btn-primary"
          @click="startImport"
          :disabled="!selectedFile || isImporting"
        >
          <span v-if="isImporting">导入中...</span>
          <span v-else>开始导入</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Theme } from '@/types'
import type { ThemeV2 } from '@/types/v2'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (
    e: 'import-complete',
    result: { success: boolean; theme?: Theme | ThemeV2; error?: string }
  ): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式状态
const selectedFile = ref<File | null>(null)
const isImporting = ref(false)
const importProgress = ref(0)
const progressMessage = ref('')
const fileInput = ref<HTMLInputElement>()

// 方法
const close = () => {
  emit('close')
}

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // 检查文件扩展名
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('请选择ZIP格式的文件')
      target.value = ''
      return
    }
    selectedFile.value = file
  }
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const startImport = async () => {
  if (!selectedFile.value) return

  try {
    isImporting.value = true
    importProgress.value = 0
    progressMessage.value = '开始导入...'

    const result = await importThemeFile(selectedFile.value)
    emit('import-complete', result)

    if (result.success) {
      close()
    }
  } catch (error) {
    console.error('Import failed:', error)
    emit('import-complete', {
      success: false,
      error: `导入失败: ${error}`,
    })
  } finally {
    isImporting.value = false
    importProgress.value = 0
    progressMessage.value = ''
  }
}

const importThemeFile = async (
  file: File
): Promise<{ success: boolean; theme?: Theme | ThemeV2; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as ArrayBuffer
        const fileName = file.name.toLowerCase()
        // 只处理ZIP文件
        if (!fileName.endsWith('.zip')) {
          throw new Error('只支持ZIP格式的文件')
        }
        // 导入ZIP格式
        const theme = await importFromZIP(content)

        if (theme) {
          // 生成新的ID，避免冲突
          theme.id = `theme_${Date.now()}`
          theme.meta = {
            ...theme.meta,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          resolve({ success: true, theme })
        } else {
          resolve({ success: false, error: '无法解析主题文件' })
        }
      } catch (error) {
        resolve({ success: false, error: `解析文件失败: ${error}` })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: '文件读取失败' })
    }

    reader.readAsArrayBuffer(file)
  })
}

// 这些函数暂时未使用，但保留以备将来扩展
// const importFromJSON = async (content: string): Promise<Theme | ThemeV2 | null> => { ... }
// const importFromHTML = async (content: string): Promise<Theme | ThemeV2 | null> => { ... }

const importFromZIP = async (
  content: ArrayBuffer
): Promise<Theme | ThemeV2 | null> => {
  try {
    // 动态导入JSZip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // 加载ZIP文件
    const zipFile = await zip.loadAsync(content)

    // 查找theme.json文件（根据导出格式）
    const themeFile = zipFile.file('theme.json')

    if (!themeFile) {
      throw new Error('ZIP文件中未找到theme.json文件')
    }

    // 读取主题数据
    const fileContent = await themeFile.async('text')
    const packageData = JSON.parse(fileContent)

    // 验证包数据格式
    if (!packageData || typeof packageData !== 'object') {
      throw new Error('主题数据格式无效')
    }

    // 从包结构中提取主题数据
    if (
      !packageData.themes ||
      !Array.isArray(packageData.themes) ||
      packageData.themes.length === 0
    ) {
      throw new Error('ZIP文件中未找到主题数据')
    }

    const themeData = packageData.themes[0] // 取第一个主题

    // 处理图片资源 - 查找images文件夹
    if (themeData.scenes && Array.isArray(themeData.scenes)) {
      for (const scene of themeData.scenes) {
        // 处理场景图片
        if (
          scene.image &&
          typeof scene.image === 'object' &&
          scene.image.name
        ) {
          const imageName = scene.image.name

          // 查找images文件夹中的图片
          const imagePath = `images/${imageName}`
          let imageFile = zipFile.file(imagePath)

          // 如果没找到，尝试其他可能的路径
          if (!imageFile) {
            // 尝试不同的路径格式
            const alternativePaths = [
              `images\\${imageName}`, // Windows路径
              `./images/${imageName}`, // 相对路径
              imageName, // 直接文件名
              `/${imageName}`, // 根目录
            ]

            for (const altPath of alternativePaths) {
              imageFile = zipFile.file(altPath)
              if (imageFile) {
                break
              }
            }
          }

          if (imageFile) {
            try {
              // 将图片转换为base64
              const imageData = await imageFile.async('base64')
              const mimeType = imageFile.name.endsWith('.png')
                ? 'image/png'
                : imageFile.name.endsWith('.jpg') ||
                  imageFile.name.endsWith('.jpeg')
                ? 'image/jpeg'
                : 'image/png'
              // 将图片对象转换为base64字符串URL
              scene.image = `data:${mimeType};base64,${imageData}`
            } catch (error) {
              console.warn(`处理图片 ${imageName} 失败:`, error)
              // 如果图片处理失败，设为空字符串
              scene.image = ''
            }
          } else {
            console.warn(`未找到图片文件: images/${imageName}`)
            // 如果找不到图片文件，设为空字符串
            scene.image = ''
          }
        }
      }
    }

    // 处理封面图片
    if (
      themeData.prelude &&
      themeData.prelude.coverImage &&
      themeData.prelude.coverImage.name
    ) {
      const coverImageName = themeData.prelude.coverImage.name
      const coverImagePath = `images/${coverImageName}`
      const coverImageFile = zipFile.file(coverImagePath)

      if (coverImageFile) {
        try {
          const imageData = await coverImageFile.async('base64')
          const mimeType = coverImageFile.name.endsWith('.png')
            ? 'image/png'
            : coverImageFile.name.endsWith('.jpg') ||
              coverImageFile.name.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png'
          themeData.prelude.coverImage = `data:${mimeType};base64,${imageData}`
        } catch (error) {
          console.warn(`处理封面图片 ${coverImageName} 失败:`, error)
          themeData.prelude.coverImage = ''
        }
      } else {
        console.warn(`未找到封面图片文件: images/${coverImageName}`)
        themeData.prelude.coverImage = ''
      }
    }

    return themeData
  } catch (error) {
    console.error('ZIP解析失败:', error)
    throw new Error(`ZIP文件解析失败: ${error}`)
  }
}

// 监听show变化，重置状态
watch(
  () => props.show,
  (newShow) => {
    if (!newShow) {
      selectedFile.value = null
      isImporting.value = false
      importProgress.value = 0
      progressMessage.value = ''
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
  }
)
</script>

<style scoped>
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.import-dialog {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--spacing-2);
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.dialog-content {
  padding: var(--spacing-6);
}

.option-group {
  margin-bottom: var(--spacing-6);
}

.option-label {
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.file-input-container {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-input-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--bg-secondary);
}

.file-input-label:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.file-input-icon {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--spacing-3);
}

.file-input-text {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.file-input-hint {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.selected-file {
  margin-top: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.file-icon {
  font-size: var(--font-size-xl);
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.file-size {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.remove-file-btn {
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
}

.import-progress {
  margin-top: var(--spacing-4);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--spacing-2);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  text-align: center;
}

.dialog-footer {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.btn {
  padding: var(--spacing-3) var(--spacing-6);
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

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-dialog {
    width: 95%;
    margin: var(--spacing-4);
  }

  .dialog-content {
    padding: var(--spacing-4);
  }

  .file-input-label {
    padding: var(--spacing-6);
  }
}
</style>
