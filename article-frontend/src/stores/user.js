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
      const res = await request.get('/auth/me', { _silent: true })
      userInfo.value = res.data
      localStorage.setItem('userInfo', JSON.stringify(res.data))
      return res
    } catch (err) {
      const status = err?.response?.status
      // 401: token 无效/过期; 404: 用户不存在（mock 重启后数据丢失）
      // 这两种情况都需要重新登录
      if (status === 401 || status === 404) {
        logout()
      }
      // 其他错误（网络超时等）不清除登录状态，保留本地缓存的用户信息
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
