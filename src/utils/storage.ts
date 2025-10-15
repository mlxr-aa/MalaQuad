import type { Theme, StorageOperations, AppState, FontScale } from '@/types'

// 存储键名常量
const STORAGE_KEYS = {
  APP_STATE: 'malaquad_app_state',
  THEME_ID: 'malaquad_theme_id',
  FONT_SCALE: 'malaquad_font_scale',
  UNLOCKED_MAX: 'malaquad_unlocked_max'
} as const

// IndexedDB配置
const DB_NAME = 'MalaQuadDB'
const DB_VERSION = 1
const STORES = {
  THEMES: 'themes',
  DRAFTS: 'drafts',
  IMAGES: 'images'
} as const

// IndexedDB实例
let db: IDBDatabase | null = null

// 初始化IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      
      // 创建主题存储
      if (!database.objectStoreNames.contains(STORES.THEMES)) {
        const themeStore = database.createObjectStore(STORES.THEMES, { keyPath: 'id' })
        themeStore.createIndex('title', 'title', { unique: false })
        themeStore.createIndex('createdAt', 'meta.createdAt', { unique: false })
      }

      // 创建草稿存储
      if (!database.objectStoreNames.contains(STORES.DRAFTS)) {
        database.createObjectStore(STORES.DRAFTS, { keyPath: 'id' })
      }

      // 创建图片存储
      if (!database.objectStoreNames.contains(STORES.IMAGES)) {
        const imageStore = database.createObjectStore(STORES.IMAGES, { keyPath: 'id' })
        imageStore.createIndex('themeId', 'themeId', { unique: false })
      }
    }
  })
}

// localStorage工具函数
export const localStorageUtils = {
  // 应用状态操作
  saveAppState: (state: AppState): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save app state:', error)
    }
  },

  loadAppState: (): AppState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_STATE)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load app state:', error)
      return null
    }
  },

  // 主题ID操作
  saveThemeId: (themeId: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_ID, themeId)
    } catch (error) {
      console.error('Failed to save theme ID:', error)
    }
  },

  loadThemeId: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME_ID) || ''
    } catch (error) {
      console.error('Failed to load theme ID:', error)
      return ''
    }
  },

  // 字体缩放操作
  saveFontScale: (scale: FontScale): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.FONT_SCALE, scale.toString())
    } catch (error) {
      console.error('Failed to save font scale:', error)
    }
  },

  loadFontScale: (): FontScale => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FONT_SCALE)
      return saved === '1.2' ? 1.2 : 1
    } catch (error) {
      console.error('Failed to load font scale:', error)
      return 1
    }
  },

  // 解锁进度操作
  saveUnlockedMax: (max: number): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_MAX, max.toString())
    } catch (error) {
      console.error('Failed to save unlocked max:', error)
    }
  },

  loadUnlockedMax: (): number => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNLOCKED_MAX)
      return saved ? parseInt(saved, 10) : 0
    } catch (error) {
      console.error('Failed to load unlocked max:', error)
      return 0
    }
  },

  // 清除所有数据
  clearAll: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// IndexedDB工具函数
export const indexedDBUtils = {
  // 主题操作
  saveTheme: async (theme: Theme): Promise<void> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.THEMES], 'readwrite')
      const store = transaction.objectStore(STORES.THEMES)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(theme)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to save theme to IndexedDB:', error)
      throw error
    }
  },

  loadTheme: async (themeId: string): Promise<Theme | null> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.THEMES], 'readonly')
      const store = transaction.objectStore(STORES.THEMES)
      
      return new Promise<Theme | null>((resolve, reject) => {
        const request = store.get(themeId)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to load theme from IndexedDB:', error)
      return null
    }
  },

  loadAllThemes: async (): Promise<Theme[]> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.THEMES], 'readonly')
      const store = transaction.objectStore(STORES.THEMES)
      
      return new Promise<Theme[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to load all themes from IndexedDB:', error)
      return []
    }
  },

  deleteTheme: async (themeId: string): Promise<void> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.THEMES], 'readwrite')
      const store = transaction.objectStore(STORES.THEMES)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(themeId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to delete theme from IndexedDB:', error)
      throw error
    }
  },

  // 草稿操作
  saveDraft: async (theme: Theme): Promise<void> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.DRAFTS], 'readwrite')
      const store = transaction.objectStore(STORES.DRAFTS)
      
      const draftData = {
        id: 'current_draft',
        theme,
        updatedAt: new Date().toISOString()
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(draftData)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to save draft to IndexedDB:', error)
      throw error
    }
  },

  loadDraft: async (): Promise<Theme | null> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.DRAFTS], 'readonly')
      const store = transaction.objectStore(STORES.DRAFTS)
      
      return new Promise<Theme | null>((resolve, reject) => {
        const request = store.get('current_draft')
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.theme : null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to load draft from IndexedDB:', error)
      return null
    }
  },

  clearDraft: async (): Promise<void> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.DRAFTS], 'readwrite')
      const store = transaction.objectStore(STORES.DRAFTS)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete('current_draft')
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to clear draft from IndexedDB:', error)
      throw error
    }
  },

  // 图片操作
  saveImage: async (imageId: string, imageData: Blob, themeId: string): Promise<void> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.IMAGES], 'readwrite')
      const store = transaction.objectStore(STORES.IMAGES)
      
      const imageRecord = {
        id: imageId,
        data: imageData,
        themeId,
        createdAt: new Date().toISOString()
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(imageRecord)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to save image to IndexedDB:', error)
      throw error
    }
  },

  loadImage: async (imageId: string): Promise<Blob | null> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.IMAGES], 'readonly')
      const store = transaction.objectStore(STORES.IMAGES)
      
      return new Promise<Blob | null>((resolve, reject) => {
        const request = store.get(imageId)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.data : null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to load image from IndexedDB:', error)
      return null
    }
  },

  deleteImage: async (imageId: string): Promise<void> => {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.IMAGES], 'readwrite')
      const store = transaction.objectStore(STORES.IMAGES)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(imageId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to delete image from IndexedDB:', error)
      throw error
    }
  }
}

// 存储操作接口实现
export const storage: StorageOperations = {
  saveTheme: indexedDBUtils.saveTheme,
  loadTheme: indexedDBUtils.loadTheme,
  deleteTheme: indexedDBUtils.deleteTheme,
  listThemes: indexedDBUtils.loadAllThemes,
  saveDraft: indexedDBUtils.saveDraft,
  loadDraft: indexedDBUtils.loadDraft,
  clearDraft: indexedDBUtils.clearDraft
}

// 导出所有工具
export default {
  localStorage: localStorageUtils,
  indexedDB: indexedDBUtils,
  storage
}
