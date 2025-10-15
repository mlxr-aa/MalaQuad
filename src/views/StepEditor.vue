<template>
  <div class="step-editor-page">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回主页</button>
      <h1>{{ isEditMode ? '编辑故事' : '新建故事' }}</h1>
    </div>
    <p>
      {{
        isEditMode
          ? '编辑现有故事的内容'
          : '创建新的麻辣四格故事，按步骤完成序幕和四幕创作。'
      }}
    </p>

    <div class="editor-content">
      <div class="step-info">
        <h2>当前步骤：{{ currentStep + 1 }} / {{ totalSteps }}</h2>
        <p>步骤名称：{{ stepNames[currentStep] }}</p>
        <div class="step-status">
          <span
            class="status-item"
            :class="{ completed: getStepStatus(currentStep).hasText }"
          >
            📝 文本：{{
              getStepStatus(currentStep).hasText ? '已完成' : '未完成'
            }}
          </span>
          <span
            class="status-item"
            :class="{ completed: getStepStatus(currentStep).hasImage }"
          >
            🖼️ 图片：{{
              getStepStatus(currentStep).hasImage ? '已完成' : '未完成'
            }}
          </span>
        </div>
      </div>

      <div class="step-content">
        <h3>{{ stepNames[currentStep] }}</h3>

        <!-- 标题输入区域（仅序幕显示） -->
        <div v-if="currentStep === 0" class="title-input-section">
          <label class="input-label">故事标题：</label>
          <input
            v-model="themeTitle"
            type="text"
            placeholder="请输入故事标题"
            class="title-input"
          />
        </div>

        <!-- 简介和身份输入区域（仅序幕显示） -->
        <div v-if="currentStep === 0" class="prelude-extra-section">
          <div class="input-group">
            <label class="input-label">简介（可选）：</label>
            <textarea
              v-model="themeDescription"
              placeholder="请输入主题简介"
              class="description-input"
              rows="3"
            ></textarea>
          </div>
          <div class="input-group">
            <label class="input-label">作者：</label>
            <input
              v-model="authorName"
              type="text"
              placeholder="请输入作者姓名"
              class="author-input"
            />
          </div>
          <div class="input-group">
            <label class="input-label">用户身份（可选）：</label>
            <input
              v-model="userIdentity"
              type="text"
              placeholder="例如：你是一名学生/医生/侦探等"
              class="identity-input"
            />
          </div>
        </div>

        <!-- 章节名输入区域（除序幕外） -->
        <div v-if="currentStep > 0" class="chapter-input-section">
          <label class="input-label">章节名：</label>
          <input
            v-model="chapterTitles[currentStep - 1]"
            type="text"
            :placeholder="`请输入${stepNames[currentStep]}的章节名`"
            class="chapter-input"
          />
        </div>

        <!-- 图片上传区域 -->
        <div class="image-upload-section">
          <div class="upload-area" @click="triggerImageUpload">
            <div v-if="!stepImages[currentStep]" class="upload-placeholder">
              <span class="upload-icon">📷</span>
              <p>点击上传图片</p>
              <small>支持 JPG、PNG、GIF 格式</small>
            </div>
            <div v-else class="image-preview">
              <img
                :src="stepImages[currentStep]"
                :alt="`${stepNames[currentStep]}图片`"
              />
              <button class="remove-image" @click.stop="removeImage">
                删除
              </button>
            </div>
          </div>
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            style="display: none"
          />
        </div>

        <!-- 文本输入区域 -->
        <div class="text-input-section">
          <label class="input-label">内容描述：</label>
          <textarea
            v-model="stepData[currentStep]"
            :placeholder="`请输入${stepNames[currentStep]}的内容...`"
            rows="5"
          ></textarea>
        </div>

        <!-- 步骤导航按钮 -->
        <div class="step-navigation">
          <button @click="previousStep" :disabled="currentStep === 0">
            上一步
          </button>
          <button @click="nextStep" :disabled="currentStep === totalSteps - 1">
            下一步
          </button>
        </div>
      </div>
    </div>

    <!-- 整体进度显示 -->
    <div class="overall-progress">
      <h3>整体进度</h3>
      <div class="progress-steps">
        <div
          v-for="(stepName, index) in stepNames"
          :key="index"
          class="progress-step"
          :class="{
            completed: getStepStatus(index).isComplete,
            current: index === currentStep,
          }"
        >
          <span class="step-number">{{ index + 1 }}</span>
          <span class="step-name">{{ stepName }}</span>
          <div class="step-indicators">
            <span
              class="indicator"
              :class="{ done: getStepStatus(index).hasText }"
              >📝</span
            >
            <span
              class="indicator"
              :class="{ done: getStepStatus(index).hasImage }"
              >🖼️</span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="saveDraft">保存草稿</button>
      <button
        @click="saveTheme"
        :disabled="!canSaveTheme"
        :class="{ disabled: !canSaveTheme }"
      >
        {{ isEditMode ? '更新主题' : '保存主题' }}
      </button>
      <button @click="goBack">返回首页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import AppExit from '@/utils/app-exit'
import type { ThemeV2 } from '@/types/v2'

const router = useRouter()
const appStore = useAppStore()
const themeStore = useThemeStore()

// 状态
const currentStep = ref(0)
const totalSteps = 5
const stepNames = ['序幕', '第一幕', '第二幕', '第三幕', '尾声']
const stepData = ref(['', '', '', '', ''])
const stepImages = ref(['', '', '', '', ''])
const imageInput = ref<HTMLInputElement | null>(null)
const isEditMode = ref(false)
const editingThemeId = ref<string | null>(null)
const themeTitle = ref('')
const themeDescription = ref('')
const authorName = ref('')
const userIdentity = ref('')
const chapterTitles = ref(['', '', '', '']) // 对应第一幕、第二幕、第三幕、尾声的章节名

// 检查主题是否完整
const isThemeComplete = (texts: string[], images: string[]): boolean => {
  // 检查所有步骤的文本内容
  const allTextsFilled = texts.every((text) => text.trim() !== '')

  // 检查所有步骤的图片
  const allImagesFilled = images.every((image) => image.trim() !== '')

  return allTextsFilled && allImagesFilled
}

// 验证所有步骤是否完成
const canSaveTheme = computed(() => {
  // 检查所有步骤的文本内容
  const allTextsFilled = stepData.value.every((text) => text.trim() !== '')

  // 检查所有步骤的图片
  const allImagesFilled = stepImages.value.every((image) => image !== '')

  return allTextsFilled && allImagesFilled
})

// 获取当前步骤的完成状态
const getStepStatus = (stepIndex: number) => {
  const hasText = stepData.value[stepIndex]?.trim() !== ''
  const hasImage = stepImages.value[stepIndex] !== ''
  return { hasText, hasImage, isComplete: hasText && hasImage }
}

// 方法
const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < totalSteps - 1) {
    currentStep.value++
  }
}

// 图片上传相关方法
const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小 (限制为5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件不能超过5MB')
      return
    }

    // 创建图片URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      stepImages.value[currentStep.value] = result
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  stepImages.value[currentStep.value] = ''
}

const saveDraft = () => {
  localStorage.setItem(
    'step_editor_draft',
    JSON.stringify({
      currentStep: currentStep.value,
      stepData: stepData.value,
      stepImages: stepImages.value,
      lastSaved: new Date().toISOString(),
    })
  )
  alert('草稿已保存')
}

const saveTheme = async () => {
  // 验证所有步骤是否完成
  if (!canSaveTheme.value) {
    alert('请完成所有步骤（包括图片和文本）才能保存主题！')
    return
  }

  // 导入v2工具
  const { SCENE_TYPES, SCENE_ORDERS } = await import('@/types/v2')

  if (isEditMode.value && editingThemeId.value) {
    // 编辑模式：更新现有主题
    try {
      const originalTheme = await themeStore.loadTheme(editingThemeId.value)
      if (originalTheme) {
        // 检查是否为v2主题
        if (Array.isArray(originalTheme.scenes)) {
          // 已经是v2格式，直接更新
          const updatedTheme = {
            ...originalTheme,
            title: themeTitle.value || stepData.value[0] || '未命名主题',
            prelude: {
              ...originalTheme.prelude,
              title: themeTitle.value || stepData.value[0] || '',
              subtitle: themeDescription.value || '',
              background: userIdentity.value || '',
              author: authorName.value || originalTheme.prelude.author || '',
              coverImage: stepImages.value[0] || '',
            },
            scenes: originalTheme.scenes.map((scene: any, index: number) => {
              if (index === 0) {
                // 序幕
                return {
                  ...scene,
                  title: themeTitle.value || stepData.value[0] || '',
                  content: stepData.value[0] || '',
                  image: stepImages.value[0] || '',
                }
              } else {
                // 其他场景
                return {
                  ...scene,
                  title: chapterTitles.value[index - 1] || scene.title,
                  content: stepData.value[index] || '',
                  image: stepImages.value[index] || '',
                }
              }
            }),
            meta: {
              ...originalTheme.meta,
              updatedAt: new Date().toISOString(),
              isDraft: !isThemeComplete(stepData.value, stepImages.value),
            },
          }

          await themeStore.saveTheme(updatedTheme)
          alert('主题已更新')
        } else {
          // v1格式，需要迁移到v2
          const v2Theme: ThemeV2 = {
            id: originalTheme.id,
            title: themeTitle.value || stepData.value[0] || '未命名主题',
            prelude: {
              title: themeTitle.value || stepData.value[0] || '',
              subtitle: themeDescription.value || '',
              background: userIdentity.value || '',
              author: authorName.value || originalTheme.prelude.author || '',
              coverImage: stepImages.value[0] || '',
              tags: originalTheme.prelude.tags || [],
            },
            scenes: [
              {
                id: `${originalTheme.id}_prelude`,
                type: SCENE_TYPES.PRELUDE,
                title: themeTitle.value || stepData.value[0] || '',
                content: stepData.value[0] || '',
                image: stepImages.value[0] || '',
                order: SCENE_ORDERS.PRELUDE,
              },
              {
                id: `${originalTheme.id}_scene1`,
                type: SCENE_TYPES.SCENE,
                title: chapterTitles.value[0] || '第一幕',
                content: stepData.value[1] || '',
                image: stepImages.value[1] || '',
                order: SCENE_ORDERS.SCENE1,
              },
              {
                id: `${originalTheme.id}_scene2`,
                type: SCENE_TYPES.SCENE,
                title: chapterTitles.value[1] || '第二幕',
                content: stepData.value[2] || '',
                image: stepImages.value[2] || '',
                order: SCENE_ORDERS.SCENE2,
              },
              {
                id: `${originalTheme.id}_scene3`,
                type: SCENE_TYPES.SCENE,
                title: chapterTitles.value[2] || '第三幕',
                content: stepData.value[3] || '',
                image: stepImages.value[3] || '',
                order: SCENE_ORDERS.SCENE3,
              },
              {
                id: `${originalTheme.id}_epilogue`,
                type: SCENE_TYPES.EPILOGUE,
                title: chapterTitles.value[3] || '尾声',
                content: stepData.value[4] || '',
                image: stepImages.value[4] || '',
                order: SCENE_ORDERS.EPILOGUE,
              },
            ],
            meta: {
              ...originalTheme.meta,
              updatedAt: new Date().toISOString(),
              isDraft: !isThemeComplete(stepData.value, stepImages.value),
            },
          }

          await themeStore.saveTheme(v2Theme)
          alert('主题已更新并迁移到新格式')
        }
      }
    } catch (error) {
      alert('更新主题失败')
      console.error('Update theme error:', error)
    }
  } else {
    // 新建模式：创建新主题（使用v2格式）
    const themeId = `theme_${Date.now()}`
    const v2Theme: ThemeV2 = {
      id: themeId,
      title: themeTitle.value || stepData.value[0] || '未命名主题',
      prelude: {
        title: themeTitle.value || stepData.value[0] || '',
        subtitle: themeDescription.value || '',
        background: userIdentity.value || '',
        author: authorName.value || '',
        coverImage: stepImages.value[0] || '',
        tags: [],
      },
      scenes: [
        {
          id: `${themeId}_prelude`,
          type: SCENE_TYPES.PRELUDE,
          title: themeTitle.value || stepData.value[0] || '',
          content: stepData.value[0] || '',
          image: stepImages.value[0] || '',
          order: SCENE_ORDERS.PRELUDE,
        },
        {
          id: `${themeId}_scene1`,
          type: SCENE_TYPES.SCENE,
          title: chapterTitles.value[0] || '第一幕',
          content: stepData.value[1] || '',
          image: stepImages.value[1] || '',
          order: SCENE_ORDERS.SCENE1,
        },
        {
          id: `${themeId}_scene2`,
          type: SCENE_TYPES.SCENE,
          title: chapterTitles.value[1] || '第二幕',
          content: stepData.value[2] || '',
          image: stepImages.value[2] || '',
          order: SCENE_ORDERS.SCENE2,
        },
        {
          id: `${themeId}_scene3`,
          type: SCENE_TYPES.SCENE,
          title: chapterTitles.value[2] || '第三幕',
          content: stepData.value[3] || '',
          image: stepImages.value[3] || '',
          order: SCENE_ORDERS.SCENE3,
        },
        {
          id: `${themeId}_epilogue`,
          type: SCENE_TYPES.EPILOGUE,
          title: chapterTitles.value[3] || '尾声',
          content: stepData.value[4] || '',
          image: stepImages.value[4] || '',
          order: SCENE_ORDERS.EPILOGUE,
        },
      ],
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDraft: !isThemeComplete(stepData.value, stepImages.value),
      },
    }

    try {
      await themeStore.saveTheme(v2Theme)
      alert('主题已保存到主题列表')
    } catch (error) {
      alert('保存主题失败')
      console.error('Save theme error:', error)
    }
  }

  // 清除草稿
  localStorage.removeItem('step_editor_draft')
  router.push('/')
}

const goBack = async () => {
  // 检查是否在移动端环境
  if (AppExit.shouldShowExit()) {
    // 在移动端，退出应用
    await AppExit.exit()
  } else {
    // 在Web环境，返回主页
    router.push('/')
  }
}

// 加载草稿
const loadDraft = () => {
  const draft = localStorage.getItem('step_editor_draft')
  if (draft) {
    const parsed = JSON.parse(draft)
    currentStep.value = parsed.currentStep || 0
    stepData.value = parsed.stepData || ['', '', '', '', '']
    stepImages.value = parsed.stepImages || ['', '', '', '', '']
  }
}

// 加载现有主题数据
const loadExistingTheme = async () => {
  const currentThemeId = appStore.currentThemeId
  if (currentThemeId) {
    try {
      const theme = await themeStore.loadTheme(currentThemeId)

      if (theme) {
        isEditMode.value = true
        editingThemeId.value = currentThemeId

        // 加载主题数据
        themeTitle.value = theme.title || theme.prelude.title || ''
        themeDescription.value = theme.prelude.subtitle || ''
        authorName.value = theme.prelude.author || ''
        userIdentity.value = theme.prelude.background || ''

        // 检查是否为v2格式
        if (Array.isArray(theme.scenes)) {
          // v2格式：从scenes数组获取数据
          chapterTitles.value = theme.scenes
            .slice(1)
            .map((scene) => scene.title)
          stepData.value = theme.scenes.map((scene) => scene.content)
          stepImages.value = theme.scenes.map((scene) => scene.image || '')
        } else {
          // v1格式：使用原有逻辑
          chapterTitles.value = (theme as any).chapterTitles || ['', '', '', '']
          stepData.value = [
            theme.prelude.title || '',
            (theme as any).scenes.scene1 || '',
            (theme as any).scenes.scene2 || '',
            (theme as any).scenes.scene3 || '',
            (theme as any).scenes.epilogue || '',
          ]

          stepImages.value = [
            theme.prelude.coverImage || '',
            (theme as any).images[0] || '',
            (theme as any).images[1] || '',
            (theme as any).images[2] || '',
            (theme as any).images[3] || '',
          ]
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
  } else {
    // 没有选中主题，确保是新建模式
    isEditMode.value = false
    editingThemeId.value = null
  }
}

// 初始化
onMounted(() => {
  loadExistingTheme()
  loadDraft()
})
</script>

<style scoped>
.step-editor-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.back-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

.editor-content {
  margin: 20px 0;
}

.step-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.step-navigation {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
  justify-content: center;
}

.step-navigation button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 5px;
  cursor: pointer;
}

.step-navigation button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-content textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-family: inherit;
}

.image-upload-section {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.6;
}

.upload-placeholder p {
  margin: 0;
  font-weight: 500;
  color: #666;
}

.upload-placeholder small {
  color: #999;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
}

.text-input-section {
  margin-top: 20px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.title-input-section,
.chapter-input-section,
.prelude-extra-section {
  margin-bottom: 20px;
}

.prelude-extra-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-input,
.chapter-input,
.author-input,
.identity-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-family: inherit;
  font-size: 16px;
}

.description-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-family: inherit;
  font-size: 16px;
  resize: vertical;
}

.title-input {
  font-weight: 600;
  font-size: 18px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.actions button:first-child {
  background: #f0f0f0;
}

.actions button:nth-child(2) {
  background: #3b82f6;
  color: white;
}

.actions button:last-child {
  background: #6b7280;
  color: white;
}

.actions button.disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.step-status {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.status-item {
  padding: 4px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 14px;
  transition: all 0.3s ease;
}

.status-item.completed {
  background: #d1fae5;
  color: #059669;
}

.overall-progress {
  margin: 20px 0;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.overall-progress h3 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 16px;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-step {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  background: white;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.progress-step.current {
  border-color: #3b82f6;
  background: #eff6ff;
}

.progress-step.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.progress-step.completed .step-number {
  background: #10b981;
  color: white;
}

.step-name {
  flex: 1;
  font-weight: 500;
  color: #374151;
}

.step-indicators {
  display: flex;
  gap: 5px;
}

.indicator {
  font-size: 16px;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.indicator.done {
  opacity: 1;
}
</style>
