import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/reader',
    name: 'Reader',
    component: () => import('../views/Reader.vue')
  },
  {
    path: '/step-editor',
    name: 'StepEditor',
    component: () => import('../views/StepEditor.vue'),
    meta: {
      title: '新建故事',
      requiresAuth: false
    }
  },
  {
    path: '/step-editor/:themeId',
    name: 'StepEditorWithTheme',
    component: () => import('../views/StepEditor.vue'),
    meta: {
      title: '编辑故事',
      requiresAuth: false
    },
    props: true
  },
  {
    path: '/step-editor/:themeId/:step',
    name: 'StepEditorWithStep',
    component: () => import('../views/StepEditor.vue'),
    meta: {
      title: '编辑故事',
      requiresAuth: false
    },
    props: true
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../views/Help.vue'),
    meta: {
      title: '使用帮助',
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 麻辣四格`
  } else {
    document.title = '麻辣四格'
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 这里可以添加认证逻辑
    // 暂时跳过认证检查
  }

  next()
})

// 路由后置守卫
router.afterEach((to, from) => {
  // 记录路由变化
  console.log(`Navigated from ${from.path} to ${to.path}`)
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
})

export default router
