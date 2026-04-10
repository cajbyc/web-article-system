import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

/**
 * 动态确定 API baseURL：
 * 1. 优先使用 .env 中配置的 VITE_API_BASE_URL（Vercel 部署时自动注入）
 * 2. 回退到 localhost:3000/api（本地开发默认）
 */
const getBaseUrl = () => {
  // import.meta.env.VITE 在构建时注入，运行时可访问
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '') // 去除尾部斜杠
  return 'http://localhost:3000/api'
}

// 创建 axios 实例
const request = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
})

// ========== 请求拦截器 ==========
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 支持 _silent 标记：跳过响应拦截器的全局错误提示
    if (config._silent) {
      config.silent = true
      delete config._silent
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ========== 响应拦截器 ==========
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 业务层面的成功判断（后端统一返回 { success, message, data }）
    if (res.success === false) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    // 静默请求：不弹全局错误提示
    if (error.config?.silent) {
      return Promise.reject(error)
    }

    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 401:
          // 登录/注册接口的 401 直接透传，不自动跳转（避免循环）
          if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register')) {
            ElMessage.error(error.response.data?.message || '用户名或密码错误')
            break
          }
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        default:
          ElMessage.error(error.response.data?.message || '服务器错误')
      }
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error('网络连接失败，请检查网络或后端服务是否启动')
    }

    return Promise.reject(error)
  }
)

export default request
