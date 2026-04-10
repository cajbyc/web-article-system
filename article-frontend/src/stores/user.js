import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'

export const useUserStore = defineStore('user', () => {
  // ========== State ==========
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(
    JSON.parse(localStorage.getItem('userInfo') || 'null')
  )

  // ========== Getters ==========
  const isLoggedIn = computed(() => !!token.value)

  // ========== Actions ==========

  /** 登录 */
  async function login(username, password) {
    // 先清除旧的认证信息，避免旧 token 干扰
    logout()

    const res = await request.post('/auth/login', { username, password })

    token.value = res.data.token
    userInfo.value = res.data.user

    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data.user))

    return res
  }

  /** 注册 */
  async function register(userData) {
    const res = await request.post('/auth/register', userData)
    return res
  }

  /** 获取当前用户信息 */
  async function fetchUserInfo() {
    try {
      const res = await request.get('/auth/me')
      userInfo.value = res.data
      localStorage.setItem('userInfo', JSON.stringify(res.data))
      return res
    } catch {
      // 401 时拦截器已处理跳转，此处静默失败
      logout()
    }
  }

  /** 退出登录 */
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, isLoggedIn, login, register, fetchUserInfo, logout }
})
