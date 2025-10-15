/**
 * 移动端Web下载工具
 * 解决移动端浏览器下载限制问题
 */

export class MobileDownloadWeb {
  /**
   * 检查是否为移动端
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * 检查是否支持文件分享
   */
  static canShareFiles(): boolean {
    return !!(navigator.share)
  }

  /**
   * 移动端下载文件
   */
  static async downloadFile(blob: Blob, fileName: string): Promise<boolean> {
    try {
      // 方法1：尝试使用 Web Share API
      if (this.canShareFiles()) {
        const file = new File([blob], fileName, { type: blob.type })
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: '麻辣四格主题导出',
            text: `导出主题：${fileName}`,
            files: [file]
          })
          console.log('✅ 文件分享成功')
          return true
        }
      }

      // 方法2：尝试直接下载
      return await this.downloadFileDirect(blob, fileName)
    } catch (error) {
      console.error('❌ 移动端下载失败:', error)
      return false
    }
  }

  /**
   * 直接下载文件
   */
  private static async downloadFileDirect(blob: Blob, fileName: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        
        // 设置链接属性
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        
        // 添加到DOM
        document.body.appendChild(link)
        
        // 触发下载
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
        
        link.dispatchEvent(clickEvent)
        
        // 延迟清理
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 1000)
        
        resolve(true)
      } catch (error) {
        console.error('直接下载失败:', error)
        resolve(false)
      }
    })
  }

  /**
   * 显示下载提示和手动下载选项
   */
  static showDownloadModal(blob: Blob, fileName: string): void {
    const fileSize = Math.round(blob.size / 1024)
    
    // 创建模态框
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    `
    
    const content = document.createElement('div')
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `
    
    // 标题
    const title = document.createElement('h3')
    title.textContent = '📱 移动端下载'
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
    `
    
    // 说明文字
    const description = document.createElement('p')
    description.textContent = `文件已准备就绪：${fileName} (${fileSize}KB)`
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    `
    
    // 下载按钮
    const downloadBtn = document.createElement('a')
    downloadBtn.href = URL.createObjectURL(blob)
    downloadBtn.download = fileName
    downloadBtn.textContent = '📥 点击下载'
    downloadBtn.style.cssText = `
      display: block;
      padding: 12px 24px;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      margin: 0 0 16px 0;
      font-weight: bold;
      transition: background 0.2s;
    `
    
    // 悬停效果
    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.background = '#0056b3'
    })
    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.background = '#007bff'
    })
    
    // 提示文字
    const tip = document.createElement('p')
    tip.textContent = '💡 如果下载失败，请长按链接选择"下载"'
    tip.style.cssText = `
      margin: 0 0 20px 0;
      color: #888;
      font-size: 12px;
    `
    
    // 关闭按钮
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '关闭'
    closeBtn.style.cssText = `
      padding: 8px 16px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    `
    
    // 组装内容
    content.appendChild(title)
    content.appendChild(description)
    content.appendChild(downloadBtn)
    content.appendChild(tip)
    content.appendChild(closeBtn)
    modal.appendChild(content)
    
    // 添加到页面
    document.body.appendChild(modal)
    
    // 关闭事件
    const closeModal = () => {
      document.body.removeChild(modal)
      URL.revokeObjectURL(downloadBtn.href)
    }
    
    closeBtn.addEventListener('click', closeModal)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal()
      }
    })
    
    // 自动关闭（30秒后）
    setTimeout(() => {
      if (document.body.contains(modal)) {
        closeModal()
      }
    }, 30000)
  }

  /**
   * 显示下载说明
   */
  static showDownloadInstructions(fileName: string, fileSize: number): void {
    const instructions = [
      '📱 移动端下载说明',
      '',
      `✅ 文件：${fileName}`,
      `📊 大小：${fileSize}KB`,
      '',
      '📥 下载方法：',
      '1. 点击下载按钮',
      '2. 如果失败，长按链接选择"下载"',
      '3. 在浏览器菜单中选择"下载"',
      '',
      '💡 提示：',
      '• 某些浏览器需要手动确认',
      '• 文件会保存到"下载"文件夹',
      '• 如果仍有问题，请检查浏览器设置'
    ].join('\n')
    
    alert(instructions)
  }

  /**
   * 创建下载链接
   */
  static createDownloadLink(blob: Blob, fileName: string): HTMLAnchorElement {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.textContent = `下载 ${fileName}`
    link.style.cssText = `
      display: inline-block;
      padding: 8px 16px;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 4px;
    `
    
    return link
  }

  /**
   * 批量创建下载链接
   */
  static createDownloadLinks(files: Array<{ blob: Blob; fileName: string }>): HTMLDivElement {
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 90%;
      text-align: center;
    `
    
    const title = document.createElement('h3')
    title.textContent = '📥 下载文件'
    title.style.marginBottom = '16px'
    container.appendChild(title)
    
    files.forEach(({ blob, fileName }) => {
      const link = this.createDownloadLink(blob, fileName)
      container.appendChild(link)
    })
    
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '关闭'
    closeBtn.style.cssText = `
      margin-top: 16px;
      padding: 8px 16px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(container)
    })
    container.appendChild(closeBtn)
    
    return container
  }
}

export default MobileDownloadWeb
