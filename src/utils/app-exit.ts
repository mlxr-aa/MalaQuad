/**
 * 应用退出工具
 * 提供统一的退出应用逻辑
 */
export class AppExit {
  /**
   * 退出应用
   * 在Web环境下显示提示
   */
  static async exit() {
    // 在Web环境，显示提示
    if (confirm('确定要离开应用吗？')) {
      if (window.close) {
        window.close()
      } else {
        alert('请手动关闭浏览器标签页')
      }
    }
  }

  /**
   * 检查是否应该显示退出选项
   * Web环境下不显示退出选项
   */
  static shouldShowExit(): boolean {
    return false
  }
}

export default AppExit
