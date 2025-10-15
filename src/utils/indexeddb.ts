/**
 * IndexedDB 存储工具
 * 用于主题数据的持久化存储
 */

const DB_NAME = 'MalaQuadDB'
const DB_VERSION = 2 // 升级版本以支持v2数据结构
const STORE_NAME = 'themes'
const STORE_NAME_V2 = 'themes_v2' // 新的v2存储

class IndexedDBUtils {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 设置超时机制，防止初始化卡住
      const timeout = setTimeout(() => {
        reject(new Error('IndexedDB initialization timeout'))
      }, 10000) // 10秒超时
      
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        clearTimeout(timeout)
        console.error('IndexedDB open error:', request.error)
        reject(request.error)
      }
      request.onsuccess = () => {
        clearTimeout(timeout)
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion
        
        // 创建v1存储（向后兼容）
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          console.log('IndexedDB store created:', STORE_NAME)
        }
        
        // 创建v2存储
        if (!db.objectStoreNames.contains(STORE_NAME_V2)) {
          db.createObjectStore(STORE_NAME_V2, { keyPath: 'id' })
          console.log('IndexedDB store created:', STORE_NAME_V2)
        }
        
        // 如果是从v1升级，迁移现有数据（异步执行，不阻塞）
        if (oldVersion < 2) {
          // 异步执行迁移，不阻塞数据库初始化
          setTimeout(() => {
            this.migrateV1ToV2(db).catch(error => {
              console.error('数据迁移失败:', error)
            })
          }, 0)
        }
      }
    })
  }

  async saveTheme(theme: any): Promise<void> {
    if (!this.db) await this.init()
    
    // 深拷贝主题数据，移除可能的循环引用和特殊对象
    const cleanTheme = this.cleanThemeData(theme)
    console.log('Saving theme to IndexedDB:', cleanTheme)
    
    // 检测主题版本并保存到相应的存储
    const isV2Theme = this.isV2Theme(cleanTheme)
    const storeName = isV2Theme ? STORE_NAME_V2 : STORE_NAME
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(cleanTheme)
      
      request.onsuccess = () => {
        console.log(`Theme saved successfully to ${storeName}`)
        resolve()
      }
      request.onerror = () => {
        console.error('Failed to save theme:', request.error)
        reject(request.error)
      }
    })
  }

  private isV2Theme(theme: any): boolean {
    // 检测是否为v2主题：scenes是数组而不是对象
    return Array.isArray(theme.scenes)
  }

  private async migrateV1ToV2(db: IDBDatabase): Promise<void> {
    console.log('开始迁移v1数据到v2...')
    
    try {
      // 获取所有v1主题
      const v1Store = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME)
      const v1Request = v1Store.getAll()
      
      v1Request.onsuccess = async () => {
        const v1Themes = v1Request.result || []
        console.log(`找到 ${v1Themes.length} 个v1主题需要迁移`)
        
        try {
          // 导入迁移工具
          const { DataMigration } = await import('./migration')
          
          // 迁移每个主题
          for (const v1Theme of v1Themes) {
            try {
              const v2Theme = DataMigration.migrateThemeV1ToV2(v1Theme)
              
              // 保存到v2存储
              const v2Store = db.transaction([STORE_NAME_V2], 'readwrite').objectStore(STORE_NAME_V2)
              v2Store.put(v2Theme)
              
              console.log(`已迁移主题: ${v1Theme.title}`)
            } catch (error) {
              console.error(`迁移主题失败 ${v1Theme.title}:`, error)
            }
          }
        } catch (importError) {
          console.error('导入迁移工具失败:', importError)
          // 如果导入失败，跳过迁移，不影响应用启动
        }
        
        console.log('v1到v2数据迁移完成')
      }
      
      v1Request.onerror = () => {
        console.error('获取v1主题失败:', v1Request.error)
      }
    } catch (error) {
      console.error('迁移过程中出错:', error)
    }
  }

  private cleanThemeData(theme: any): any {
    // 深拷贝并清理数据，确保可以被IndexedDB存储
    const cleaned = JSON.parse(JSON.stringify(theme))
    
    // 确保所有数组都是普通数组
    if (cleaned.images && Array.isArray(cleaned.images)) {
      cleaned.images = cleaned.images.map((img: any) => {
        if (typeof img === 'string') return img
        if (img && typeof img === 'object' && img.src) return img.src
        return ''
      })
    }
    
    if (cleaned.prelude && cleaned.prelude.tags && Array.isArray(cleaned.prelude.tags)) {
      cleaned.prelude.tags = cleaned.prelude.tags.filter((tag: any) => typeof tag === 'string')
    }
    
    return cleaned
  }

  async getTheme(themeId: string): Promise<any | null> {
    if (!this.db) await this.init()
    
    // 优先从v2存储查找
    return new Promise((resolve, reject) => {
      const v2Transaction = this.db!.transaction([STORE_NAME_V2], 'readonly')
      const v2Store = v2Transaction.objectStore(STORE_NAME_V2)
      const v2Request = v2Store.get(themeId)
      
      v2Request.onsuccess = () => {
        if (v2Request.result) {
          console.log('从v2存储加载主题:', themeId)
          resolve(v2Request.result)
        } else {
          // 如果v2中没有，尝试从v1存储查找
          const v1Transaction = this.db!.transaction([STORE_NAME], 'readonly')
          const v1Store = v1Transaction.objectStore(STORE_NAME)
          const v1Request = v1Store.get(themeId)
          
          v1Request.onsuccess = () => {
            if (v1Request.result) {
              console.log('从v1存储加载主题:', themeId)
              resolve(v1Request.result)
            } else {
              resolve(null)
            }
          }
          v1Request.onerror = () => reject(v1Request.error)
        }
      }
      v2Request.onerror = () => reject(v2Request.error)
    })
  }

  async getAllThemes(): Promise<any[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      // 获取v2主题
      const v2Transaction = this.db!.transaction([STORE_NAME_V2], 'readonly')
      const v2Store = v2Transaction.objectStore(STORE_NAME_V2)
      const v2Request = v2Store.getAll()
      
      v2Request.onsuccess = () => {
        const v2Themes = v2Request.result || []
        console.log('从v2存储加载主题:', v2Themes.length, '个')
        
        // 获取v1主题
        const v1Transaction = this.db!.transaction([STORE_NAME], 'readonly')
        const v1Store = v1Transaction.objectStore(STORE_NAME)
        const v1Request = v1Store.getAll()
        
        v1Request.onsuccess = () => {
          const v1Themes = v1Request.result || []
          console.log('从v1存储加载主题:', v1Themes.length, '个')
          
          // 合并主题，v2优先
          const allThemes = [...v2Themes, ...v1Themes.filter(v1Theme => 
            !v2Themes.some(v2Theme => v2Theme.id === v1Theme.id)
          )]
          
          console.log('总共加载主题:', allThemes.length, '个')
          resolve(allThemes)
        }
        
        v1Request.onerror = () => {
          console.error('Failed to load v1 themes:', v1Request.error)
          // 即使v1失败，也返回v2主题
          resolve(v2Themes)
        }
      }
      
      v2Request.onerror = () => {
        console.error('Failed to load v2 themes:', v2Request.error)
        // 如果v2失败，尝试只加载v1
        const v1Transaction = this.db!.transaction([STORE_NAME], 'readonly')
        const v1Store = v1Transaction.objectStore(STORE_NAME)
        const v1Request = v1Store.getAll()
        
        v1Request.onsuccess = () => {
          console.log('从v1存储加载主题（v2失败）:', v1Request.result?.length || 0, '个')
          resolve(v1Request.result || [])
        }
        v1Request.onerror = () => {
          console.error('Failed to load themes:', v1Request.error)
          reject(v1Request.error)
        }
      }
    })
  }

  async deleteTheme(themeId: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      // 尝试从两个存储中删除
      const v2Transaction = this.db!.transaction([STORE_NAME_V2], 'readwrite')
      const v2Store = v2Transaction.objectStore(STORE_NAME_V2)
      const v2Request = v2Store.delete(themeId)
      
      const v1Transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const v1Store = v1Transaction.objectStore(STORE_NAME)
      const v1Request = v1Store.delete(themeId)
      
      let completed = 0
      let hasError = false
      
      const checkComplete = () => {
        completed++
        if (completed === 2) {
          if (hasError) {
            reject(new Error('删除主题时发生错误'))
          } else {
            console.log('主题已从所有存储中删除:', themeId)
            resolve()
          }
        }
      }
      
      v2Request.onsuccess = () => {
        console.log('从v2存储删除主题:', themeId)
        checkComplete()
      }
      v2Request.onerror = () => {
        console.warn('从v2存储删除主题失败:', v2Request.error)
        hasError = true
        checkComplete()
      }
      
      v1Request.onsuccess = () => {
        console.log('从v1存储删除主题:', themeId)
        checkComplete()
      }
      v1Request.onerror = () => {
        console.warn('从v1存储删除主题失败:', v1Request.error)
        hasError = true
        checkComplete()
      }
    })
  }
}

export const indexedDBUtils = new IndexedDBUtils()
