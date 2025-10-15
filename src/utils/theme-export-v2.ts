// 主题导出工具 v2 - 支持场景对象数组

import type { ThemeV2 } from '@/types/v2'
import type { ExportedThemeV2, ExportedScene } from '@/types/v2'
import type { ExportOptions, ExportResult, ExportProgress } from '@/types/export'
import { MobileDownloadWeb } from './mobile-download-web'
import { MemoryManager } from './memory-manager'
import JSZip from 'jszip'
// import { ThemeV2Manager } from './theme-v2'

/**
 * 主题导出工具 v2
 * 支持新的场景对象数组结构
 */
export class ThemeExporterV2 {
  private static readonly APP_VERSION = '2.0.0'
  private static readonly EXPORT_VERSION = '2.0'

  /**
   * 将图片URL转换为Blob数据（用于ZIP打包）
   */
  private static async convertImageToBlob(url: string, name: string): Promise<{
    name: string
    blob: Blob
    type: string
    size: number
  } | null> {
    console.log(`🖼️ 开始处理图片: ${name}, URL: ${url.substring(0, 50)}...`)
    
    try {
      // 如果已经是base64数据，转换为Blob
      if (url.startsWith('data:')) {
        console.log(`✅ 图片 ${name} 是base64格式，正在转换...`)
        const response = await fetch(url)
        const blob = await response.blob()
        
        return {
          name,
          blob,
          type: blob.type,
          size: blob.size
        }
      }
      
      console.log(`📥 正在获取图片: ${name}`)
      // 如果是普通URL，尝试获取并压缩
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      console.log(`📊 图片 ${name} 大小: ${Math.round(blob.size / 1024)}KB, 类型: ${blob.type}`)
      
      // 检查内存使用情况和图片大小
      if (!MemoryManager.canProcessImage(blob.size)) {
        console.warn(`⚠️ 图片 ${name} 太大或内存不足，跳过处理`)
        return null
      }
      
      // 检查文件大小，如果太大则压缩
      const maxSize = 2 * 1024 * 1024 // 2MB限制
      let processedBlob = blob
      
      if (blob.size > maxSize) {
        console.warn(`🗜️ 图片 ${name} 太大 (${Math.round(blob.size / 1024 / 1024)}MB)，正在压缩...`)
        const suggestedQuality = MemoryManager.getSuggestedQuality(blob.size)
        processedBlob = await ThemeExporterV2.compressImage(blob, suggestedQuality)
        console.log(`✅ 图片 ${name} 压缩完成，新大小: ${Math.round(processedBlob.size / 1024)}KB`)
      }
      
      return {
        name,
        blob: processedBlob,
        type: processedBlob.type,
        size: processedBlob.size
      }
    } catch (error) {
      console.error(`❌ 图片 ${name} 处理失败:`, error)
      return null
    }
  }

  /**
   * 压缩图片
   */
  private static async compressImage(blob: Blob, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // 使用内存管理器建议的尺寸
        const { width, height } = MemoryManager.getSuggestedDimensions(img.width, img.height)
        
        canvas.width = width
        canvas.height = height
        
        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              // 清理内存
              MemoryManager.cleanup()
              resolve(compressedBlob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(blob)
    })
  }

  /**
   * 转换主题数据为导出格式（ZIP模式）
   */
  private static async convertThemeToExported(
    theme: ThemeV2, 
    includeImages: boolean = true,
    exportFormat: 'json' | 'html' | 'pdf' = 'json'
  ): Promise<{
    exportedTheme: ExportedThemeV2
    imageFiles: Array<{ name: string; blob: Blob; type: string; size: number }>
  }> {
    const exportedTheme: ExportedThemeV2 = {
      id: theme.id,
      title: theme.title,
      version: ThemeExporterV2.EXPORT_VERSION,
      prelude: {
        title: theme.prelude.title,
        subtitle: theme.prelude.subtitle,
        background: theme.prelude.background,
        author: theme.prelude.author,
        tags: theme.prelude.tags || []
      },
      scenes: [],
      meta: {
        createdAt: theme.meta?.createdAt || new Date().toISOString(),
        updatedAt: theme.meta?.updatedAt || new Date().toISOString(),
        exportedAt: new Date().toISOString(),
        exportedBy: 'MalaQuad App v2',
        appVersion: ThemeExporterV2.APP_VERSION
      }
    }

    const imageFiles: Array<{ name: string; blob: Blob; type: string; size: number }> = []

    // 处理场景 - 逐个处理避免内存峰值
    if (includeImages) {
      const exportedScenes: ExportedScene[] = []
      
      for (let index = 0; index < theme.scenes.length; index++) {
        const scene = theme.scenes[index]
        const exportedScene: ExportedScene = {
          id: scene.id,
          type: scene.type,
          order: scene.order,
          title: scene.title,
          content: scene.content,
          chapterTitle: scene.chapterTitle
        }

        // 处理场景图片 - 逐个处理
        if (scene.image) {
          try {
            const imageFileName = `scene_${scene.order}_${scene.type}.jpg`
            console.log(`🖼️ 处理场景 ${index + 1}/${theme.scenes.length} 图片...`)
            
            if (exportFormat === 'html') {
              // HTML导出：保留原始图片数据
              exportedScene.image = {
                name: imageFileName,
                data: scene.image, // 保留原始图片数据
                type: 'image/jpeg',
                size: 0
              }
              console.log(`✅ 场景 ${index + 1} 图片数据保留完成`)
            } else {
              // ZIP/PDF导出：转换为Blob
              const imageData = await ThemeExporterV2.convertImageToBlob(
                scene.image, 
                imageFileName
              )
              
              if (imageData) {
                // 只保存文件名，不保存图片数据
                exportedScene.image = {
                  name: imageFileName,
                  data: '', // 不保存base64数据
                  type: imageData.type,
                  size: imageData.size
                }
                imageFiles.push(imageData)
                console.log(`✅ 场景 ${index + 1} 图片处理完成 (${Math.round(imageData.size / 1024)}KB)`)
              } else {
                console.warn(`⚠️ 场景 ${index + 1} 图片处理失败，跳过图片`)
              }
            }
          } catch (error) {
            console.error(`❌ 场景 ${index + 1} 图片处理出错:`, error)
            // 继续处理，不中断整个导出过程
          }
        }

        exportedScenes.push(exportedScene)
        
        // 强制垃圾回收，释放内存
        if (index % 2 === 0) {
          MemoryManager.cleanup()
        }
      }

      exportedTheme.scenes = exportedScenes
    } else {
      // 不包含图片，直接转换
      exportedTheme.scenes = theme.scenes.map(scene => ({
        id: scene.id,
        type: scene.type,
        order: scene.order,
        title: scene.title,
        content: scene.content,
        chapterTitle: scene.chapterTitle
      }))
    }

    // 处理封面图片
    if (includeImages && theme.prelude.coverImage) {
      if (exportFormat === 'html') {
        // HTML导出：保留原始图片数据
        exportedTheme.prelude.coverImage = {
          name: 'cover.jpg',
          data: theme.prelude.coverImage, // 保留原始图片数据
          type: 'image/jpeg',
          size: 0
        }
      } else {
        // ZIP/PDF导出：转换为Blob
        const coverImageData = await ThemeExporterV2.convertImageToBlob(
          theme.prelude.coverImage,
          'cover.jpg'
        )
        if (coverImageData) {
          // 只保存文件名，不保存图片数据
          exportedTheme.prelude.coverImage = {
            name: 'cover.jpg',
            data: '', // 不保存base64数据
            type: coverImageData.type,
            size: coverImageData.size
          }
          imageFiles.push(coverImageData)
        }
      }
    }

    return { exportedTheme, imageFiles }
  }

  /**
   * 导出为ZIP格式（包含JSON元数据和图片文件）
   */
  static async exportToJSON(
    theme: ThemeV2, 
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    try {
      onProgress?.({
        stage: 'preparing',
        progress: 10,
        message: '准备导出数据...'
      })

      const { exportedTheme, imageFiles } = await ThemeExporterV2.convertThemeToExported(
        theme, 
        options.includeImages,
        'json'
      )

      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: '处理主题数据...'
      })

      const packageData = {
        package: {
          name: theme.title,
          version: ThemeExporterV2.EXPORT_VERSION,
          description: `麻辣四格主题：${theme.title}`,
          author: theme.prelude.author || '未知作者',
          createdAt: theme.meta?.createdAt || new Date().toISOString(),
          exportedAt: new Date().toISOString()
        },
        themes: [exportedTheme],
        export: {
          format: 'zip',
          version: ThemeExporterV2.EXPORT_VERSION,
          appVersion: ThemeExporterV2.APP_VERSION,
          exportedAt: new Date().toISOString(),
          exportedBy: 'MalaQuad App v2'
        }
      }

      onProgress?.({
        stage: 'packaging',
        progress: 50,
        message: '创建ZIP文件...'
      })

      // 创建ZIP文件
      const zip = new JSZip()
      
      // 添加JSON元数据文件
      const jsonString = JSON.stringify(packageData, null, 2)
      zip.file('theme.json', jsonString)
      
      // 添加README文件
      const readmeContent = `# ${theme.title}

## 主题信息
- **作者**: ${theme.prelude.author || '未知'}
- **创建时间**: ${theme.meta?.createdAt ? new Date(theme.meta.createdAt).toLocaleDateString('zh-CN') : '未知'}
- **导出时间**: ${new Date().toLocaleString('zh-CN')}

## 文件结构
- \`theme.json\` - 主题元数据文件
- \`images/\` - 图片文件夹
  ${imageFiles.map(img => `- \`${img.name}\` - ${Math.round(img.size / 1024)}KB`).join('\n  ')}

## 使用说明
这是一个由麻辣四格应用导出的主题包，包含了完整的主题数据和图片资源。
您可以使用麻辣四格应用导入此ZIP文件来恢复主题内容。

## 导出信息
- **导出时间**: ${new Date().toLocaleString('zh-CN')}
- **导出工具**: 麻辣四格 v${ThemeExporterV2.APP_VERSION}
- **导出格式**: ZIP包
`
      zip.file('README.md', readmeContent)

      // 分块添加图片文件到images文件夹
      if (imageFiles.length > 0) {
        const imagesFolder = zip.folder('images')
        if (imagesFolder) {
          console.log(`📦 开始添加 ${imageFiles.length} 个图片文件到ZIP...`)
          
          for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i]
            console.log(`📁 添加图片 ${i + 1}/${imageFiles.length}: ${imageFile.name}`)
            
            try {
              imagesFolder.file(imageFile.name, imageFile.blob)
              
              // 更新进度
              const progress = 50 + Math.round((i + 1) / imageFiles.length * 20)
              onProgress?.({
                stage: 'packaging',
                progress,
                message: `添加图片 ${i + 1}/${imageFiles.length}...`
              })
              
              // 每处理几个图片就清理内存
              if (i % 3 === 0) {
                MemoryManager.cleanup()
              }
            } catch (error) {
              console.error(`❌ 添加图片 ${imageFile.name} 失败:`, error)
              // 继续处理其他图片
            }
          }
        }
      }

      onProgress?.({
        stage: 'packaging',
        progress: 80,
        message: '生成ZIP文件...'
      })

      // 分块生成ZIP文件，避免内存峰值
      console.log('🗜️ 开始生成ZIP文件...')
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // 中等压缩级别，平衡文件大小和处理速度
        }
      })
      
      console.log(`✅ ZIP文件生成完成，大小: ${Math.round(zipBlob.size / 1024)}KB`)
      const fileName = options.fileName || `${theme.title}_v2_${Date.now()}.zip`

      // 积极清理内存
      MemoryManager.aggressiveCleanup()

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: '导出完成！'
      })

      // 使用移动端兼容的下载方式
      if (MobileDownloadWeb.isMobile()) {
        const success = await MobileDownloadWeb.downloadFile(zipBlob, fileName)
        if (!success) {
          MobileDownloadWeb.showDownloadModal(zipBlob, fileName)
        }
      } else {
        this.downloadFile(zipBlob, fileName)
      }

      return {
        success: true,
        data: zipBlob,
        fileName,
        size: zipBlob.size
      }
    } catch (error) {
      return {
        success: false,
        fileName: '',
        size: 0,
        error: `导出失败: ${error}`
      }
    }
  }

  /**
   * 导出为HTML格式
   */
  static async exportToHTML(
    theme: ThemeV2, 
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    try {
      onProgress?.({
        stage: 'preparing',
        progress: 10,
        message: '准备HTML模板...'
      })

      const { exportedTheme } = await ThemeExporterV2.convertThemeToExported(
        theme, 
        options.includeImages,
        'html'
      )

      onProgress?.({
        stage: 'processing',
        progress: 50,
        message: '生成HTML内容...'
      })

      const htmlContent = ThemeExporterV2.generateHTML(exportedTheme)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const fileName = options.fileName || `${theme.title}_v2_${Date.now()}.html`

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'HTML导出完成！'
      })

      // 使用移动端兼容的下载方式
      if (MobileDownloadWeb.isMobile()) {
        const success = await MobileDownloadWeb.downloadFile(blob, fileName)
        if (!success) {
          MobileDownloadWeb.showDownloadModal(blob, fileName)
        }
      } else {
        this.downloadFile(blob, fileName)
      }

      return {
        success: true,
        data: blob,
        fileName,
        size: blob.size
      }
    } catch (error) {
      return {
        success: false,
        fileName: '',
        size: 0,
        error: `导出失败: ${error}`
      }
    }
  }

  /**
   * 生成HTML内容
   */
  private static generateHTML(theme: ExportedThemeV2): string {
    // 按顺序排序场景
    const sortedScenes = theme.scenes.sort((a, b) => a.order - b.order)
    
    const scenesHTML = sortedScenes.map(scene => {
      const sceneTitle = scene.chapterTitle || scene.title
      const sceneImage = scene.image ? `<img src="${scene.image.data}" alt="${sceneTitle}" class="scene-image">` : ''
      
      return `
    <div class="scene">
        <h2 class="scene-title">${sceneTitle}</h2>
        <div class="scene-content">${scene.content}</div>
        ${sceneImage}
    </div>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${theme.title} - 麻辣四格 v2</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .theme-header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            text-align: center;
        }
        .theme-title {
            color: #E53935;
            font-size: 2.5em;
            margin: 0 0 10px 0;
        }
        .theme-meta {
            color: #666;
            font-size: 0.9em;
        }
        .scene {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .scene-title {
            color: #E53935;
            font-size: 1.3em;
            margin: 0 0 15px 0;
            border-bottom: 2px solid #E53935;
            padding-bottom: 5px;
        }
        .scene-content {
            white-space: pre-wrap;
            line-height: 1.8;
        }
        .scene-image {
            max-width: 100%;
            height: auto;
            border-radius: 5px;
            margin: 10px 0;
        }
        .export-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            font-size: 0.8em;
            color: #666;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="theme-header">
        <h1 class="theme-title">${theme.title}</h1>
        <div class="theme-meta">
            <p>作者: ${theme.prelude.author || '未知'}</p>
            <p>导出时间: ${new Date(theme.meta.exportedAt).toLocaleString('zh-CN')}</p>
        </div>
    </div>
${scenesHTML}
    <div class="export-info">
        <p>此文件由麻辣四格 v2 应用导出</p>
        <p>导出时间: ${new Date(theme.meta.exportedAt).toLocaleString('zh-CN')}</p>
        <p>应用版本: ${theme.meta.appVersion}</p>
    </div>
</body>
</html>`
  }

  /**
   * 下载文件（桌面端）
   */
  static downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 导出为PDF格式
   */
  static async exportToPDF(
    theme: ThemeV2, 
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    try {
      onProgress?.({
        stage: 'preparing',
        progress: 10,
        message: '准备PDF模板...'
      })

      const { exportedTheme } = await ThemeExporterV2.convertThemeToExported(
        theme, 
        options.includeImages,
        'pdf'
      )

      onProgress?.({
        stage: 'processing',
        progress: 30,
        message: '生成PDF内容...'
      })

      // 直接使用HTML导出内容，添加PDF打印样式
      const htmlContent = ThemeExporterV2.generateHTML(exportedTheme)
      const pdfHTML = ThemeExporterV2.addPDFStyles(htmlContent)

      onProgress?.({
        stage: 'packaging',
        progress: 80,
        message: '生成PDF文件...'
      })
      
      // 直接打开打印预览
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(pdfHTML)
        printWindow.document.close()
        // 延迟执行打印，确保内容加载完成
        setTimeout(() => {
          printWindow.print()
        }, 1000)
      }
      
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'PDF导出完成！'
      })
      
      return {
        success: true,
        data: null,
        fileName: `${theme.title}_阅读版.pdf`,
        size: 0
      }
    } catch (error) {
      return {
        success: false,
        fileName: '',
        size: 0,
        error: `PDF导出失败: ${error}`
      }
    }
  }

  /**
   * 为HTML内容添加PDF打印样式
   */
  private static addPDFStyles(htmlContent: string): string {
    // 在现有样式基础上添加PDF打印样式
    const pdfStyles = `
        @page {
            size: A4;
            margin: 2cm;
        }
        
        @media print {
            body {
                font-family: 'Microsoft YaHei', 'SimSun', serif;
                line-height: 1.6;
                color: #333;
            }
            
            .scene {
                page-break-before: always;
                page-break-inside: avoid;
            }
            
            .scene:first-child {
                page-break-before: auto;
            }
            
            .scene-image {
                max-width: 100%;
                height: auto;
                page-break-inside: avoid;
            }
            
            .no-print {
                display: none !important;
            }
        }
    `
    
    // 在</style>标签前插入PDF样式
    return htmlContent.replace('</style>', `${pdfStyles}\n    </style>`)
  }
}
