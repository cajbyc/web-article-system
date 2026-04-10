import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('../views/RegisterView.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/ProfileView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'articles',
        name: 'ArticleList',
        component: () => import('../views/ArticleListView.vue'),
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('../views/AboutView.vue'),
      },
      // 文章相关路由（具体路径必须在 :id 之前）
      {
        path: 'article/create',
        name: 'ArticleCreate',
        component: () => import('../views/ArticleEditorView.vue'),
        meta: { requiresAuth: true, roles: ['editor', 'author', 'admin'] },
      },
      {
        path: 'article/edit/:id',
        name: 'ArticleEdit',
        component: () => import('../views/ArticleEditorView.vue'),
        meta: { requiresAuth: true, roles: ['editor', 'author', 'admin'] },
      },
      {
        path: 'article/:id',
        name: 'ArticleDetail',
        component: () => import('../views/ArticleDetailView.vue'),
      },
      {
        path: 'my/articles',
        name: 'MyArticles',
        component: () => import('../views/MyArticlesView.vue'),
        meta: { requiresAuth: true, roles: ['editor', 'author', 'admin'] },
      },
      {
        path: 'my/recycle',
        name: 'RecycleBin',
        component: () => import('../views/RecycleBinView.vue'),
        meta: { requiresAuth: true, roles: ['editor', 'author', 'admin'] },
      },
      {
        path: 'my/collects',
        name: 'MyCollects',
        component: () => import('../views/MyCollectsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'my/comments',
        name: 'MyComments',
        component: () => import('../views/MyCommentsView.vue'),
        meta: { requiresAuth: true },
      },
      // ===== 管理员专属路由（需 admin 角色）=====
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('../views/UsersView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/articles',
        name: 'AdminArticles',
        component: () => import('../views/AdminArticlesView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/comments',
        name: 'AdminComments',
        component: () => import('../views/CommentsManageView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
      {
        path: 'admin/logs',
        name: 'AdminLogs',
        component: () => import('../views/LogsView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userInfoStr = localStorage.getItem('userInfo')

  if (to.meta.requiresAuth) {
    if (!token) {
      // 未登录，携带来源地址跳转到登录页
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (to.meta.requiresAdmin) {
      // 需要管理员权限
      try {
        const userInfo = JSON.parse(userInfoStr || '{}')
        if (userInfo.role !== 'admin') {
          ElMessage.error('无权限访问管理后台，需要管理员账号')
          next({ path: '/' })
        } else {
          next()
        }
      } catch {
        ElMessage.error('登录信息异常，请重新登录')
        next({ name: 'Login' })
      }
    } else if (to.meta.roles) {
      // 需要特定角色
      try {
        const userInfo = JSON.parse(userInfoStr || '{}')
        if (!to.meta.roles.includes(userInfo.role)) {
          ElMessage.error('权限不足，无法访问该页面')
          next({ path: '/' })
        } else {
          next()
        }
      } catch {
        ElMessage.error('登录信息异常，请重新登录')
        next({ name: 'Login' })
      }
    } else {
      next()
    }
  } else {
    // 已登录用户访问登录/注册页时重定向到首页
    if ((to.name === 'Login' || to.name === 'Register') && token) {
      next({ path: '/' })
    } else {
      next()
    }
  }
})

export default router
