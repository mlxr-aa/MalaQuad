/**
 * 返回键处理工具
 * 提供统一的返回键处理逻辑（Web环境）
 */
export class BackButtonHandler {
  private static isInitialized = false

  /**
   * 初始化返回键处理
   * @param _router Vue Router实例（Web环境下未使用）
   */
  static initialize(_router: any) {
    if (this.isInitialized) {
      return
    }

    this.isInitialized = true

    // Web环境下不需要特殊处理
    console.log('Back button handler initialized for web environment')
  }

  /**
   * 清理返回键处理器
   */
  static cleanup() {
    if (this.isInitialized) {
      this.isInitialized = false
    }
  }
}

export default BackButtonHandler
