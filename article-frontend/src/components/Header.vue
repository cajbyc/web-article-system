<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="logo" @click="$router.push('/')">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
        </div>
        <span class="logo-text">随笔</span>
      </div>

      <!-- 全局搜索框 -->
      <div class="global-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文章..."
          :prefix-icon="Search"
          clearable
          size="default"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
      </div>

      <nav class="nav-menu">
        <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">首页</router-link>
        <router-link to="/articles" class="nav-link" :class="{ active: $route.path.startsWith('/article') }">文章</router-link>
        <router-link to="/about" class="nav-link" :class="{ active: $route.path === '/about' }">说明</router-link>

        <!-- 未登录 -->
        <template v-if="!userStore.userInfo">
          <router-link to="/login" class="nav-link nav-link-btn">登录</router-link>
          <router-link to="/register" class="nav-link nav-link-btn filled">注册</router-link>
        </template>

        <!-- 已登录 -->
        <template v-else>
          <router-link v-if="userStore.userInfo?.role === 'admin'" to="/admin/dashboard" class="nav-link" :class="{ active: $route.path.startsWith('/admin') }">
            管理
          </router-link>
          <router-link v-if="isEditor" to="/article/create" class="nav-link" :class="{ active: $route.path === '/article/create' }">
            写文章
          </router-link>
          <router-link v-if="isEditor" to="/my/articles" class="nav-link" :class="{ active: $route.path === '/my/articles' }">
            我的
          </router-link>

          <!-- 通知铃铛 -->
          <el-popover
            placement="bottom-end"
            :width="360"
            trigger="click"
            @show="fetchNotifList"
          >
            <template #reference>
              <div class="notif-bell">
                <el-icon :size="20"><Bell /></el-icon>
                <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
              </div>
            </template>
            <div class="notif-panel">
              <div class="notif-header">
                <span class="notif-title">通知</span>
                <button v-if="unreadCount > 0" class="notif-read-all" @click="handleMarkAllRead">全部已读</button>
              </div>
              <div class="notif-list" v-if="notifList.length > 0">
                <div
                  v-for="item in notifList"
                  :key="item.id"
                  class="notif-item"
                  :class="{ unread: !item.isRead }"
                  @click="handleNotifClick(item)"
                >
                  <div class="notif-dot" v-if="!item.isRead"></div>
                  <div class="notif-content">
                    <div class="notif-item-title">{{ item.title }}</div>
                    <div class="notif-item-desc">{{ item.content }}</div>
                    <div class="notif-item-time">{{ formatNotifTime(item.createdAt) }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="notif-empty">暂无通知</div>
            </div>
          </el-popover>

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-avatar-wrap">
              <el-avatar :size="30">
                {{ userStore.userInfo.username?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="/profile">
                  <el-icon><UserFilled /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.userInfo?.role === 'admin'" command="/admin/applications">
                  <el-icon><Checked /></el-icon>角色审批
                </el-dropdown-item>
                <el-dropdown-item v-if="isEditor" command="/my/recycle">
                  <el-icon><Delete /></el-icon>回收站
                </el-dropdown-item>
                <el-dropdown-item command="/my/collects">
                  <el-icon><Star /></el-icon>我的收藏
                </el-dropdown-item>
                <el-dropdown-item command="/my/likes">
                  <el-icon><StarFilled /></el-icon>我的点赞
                </el-dropdown-item>
                <el-dropdown-item command="/my/comments">
                  <el-icon><ChatDotRound /></el-icon>我的评论
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { UserFilled, SwitchButton, Delete, Star, StarFilled, ChatDotRound, Search, Checked, Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getMyNotifications, markAsRead, markAllRead } from '../api/notification'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')
const notifList = ref([])
const unreadCount = ref(0)
let pollTimer = null

const isEditor = computed(() => {
  const role = userStore.userInfo?.role
  return ['admin', 'editor', 'author'].includes(role)
})

function startPolling() {
  stopPolling()
  fetchUnreadCount()
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchUnreadCount()
    }
  }, 30000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    startPolling()
  } else {
    stopPolling()
    unreadCount.value = 0
    notifList.value = []
  }
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})

async function fetchUnreadCount() {
  if (!userStore.isLoggedIn) return
  try {
    const res = await getMyNotifications({ page: 1, pageSize: 1 })
    unreadCount.value = res.data.unreadCount || 0
  } catch {}
}

async function fetchNotifList() {
  try {
    const res = await getMyNotifications({ page: 1, pageSize: 20 })
    notifList.value = res.data.list || []
    unreadCount.value = res.data.unreadCount || 0
  } catch {}
}

async function handleNotifClick(item) {
  if (!item.isRead) {
    try {
      await markAsRead(item.id)
      item.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {}
  }
  // 根据类型跳转
  if (item.type === 'comment_reply' && item.relatedId) {
    router.push(`/article/${item.relatedId}`)
  } else if (item.type === 'application_approved') {
    router.push('/my/articles')
  } else if (item.type === 'application_rejected') {
    router.push('/profile')
  }
}

async function handleMarkAllRead() {
  try {
    await markAllRead()
    notifList.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
  } catch {}
}

function formatNotifTime(timeStr) {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function handleSearch() {
  const keyword = searchKeyword.value.trim()
  const targetPath = keyword ? `/articles?keyword=${encodeURIComponent(keyword)}` : '/articles'
  if (route.path + route.search !== targetPath) {
    router.push(targetPath)
  }
}

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } else {
    router.push(cmd)
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 58px;
  gap: 20px;

  @media (max-width: 1240px) {
    padding: 0 16px;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  .logo-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: linear-gradient(135deg, #2d6a4f, #40916c);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: transform 0.2s;
  }

  &:hover .logo-icon {
    transform: rotate(-8deg) scale(1.05);
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.3px;
  }
}

.global-search {
  width: 220px;
  flex-shrink: 0;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.03);
    box-shadow: none !important;
    border: 1px solid transparent;
    transition: all 0.2s;

    &:hover, &.is-focus {
      background: #fff;
      border-color: rgba(45, 106, 79, 0.25);
      box-shadow: 0 2px 8px rgba(45, 106, 79, 0.08) !important;
    }
  }

  @media (max-width: 768px) {
    width: 140px;
  }
}

.nav-menu {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.nav-link {
  padding: 6px 14px;
  font-size: 14px;
  color: #4a4a68;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
  font-weight: 500;

  &:hover {
    color: #2d6a4f;
    background: rgba(45, 106, 79, 0.06);
  }

  &.active {
    color: #2d6a4f;
    background: rgba(45, 106, 79, 0.08);
    font-weight: 600;
  }

  &.nav-link-btn {
    color: #2d6a4f;
    border: 1px solid rgba(45, 106, 79, 0.25);
    margin-left: 4px;

    &:hover {
      background: rgba(45, 106, 79, 0.06);
    }

    &.filled {
      background: #2d6a4f;
      color: #fff;
      border-color: #2d6a4f;

      &:hover {
        background: #40916c;
        border-color: #40916c;
        color: #fff;
      }
    }
  }
}

.notif-bell {
  position: relative;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #4a4a68;
  transition: all 0.2s;
  display: flex;
  align-items: center;

  &:hover {
    color: #2d6a4f;
    background: rgba(45, 106, 79, 0.06);
  }
}

.notif-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  background: #e74c3c;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  padding: 0 4px;
}

.user-avatar-wrap {
  cursor: pointer;
  margin-left: 4px;
  padding: 2px;
  border-radius: 50%;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 2px rgba(45, 106, 79, 0.2);
  }
}

:deep(.el-dropdown-menu__item) {
  .el-icon {
    margin-right: 6px;
  }
}
</style>

<style lang="scss">
/* 通知面板样式（不在 scoped 中，因为 popover 挂载在 body） */
.notif-panel {
  margin: -12px;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .notif-title {
    font-weight: 600;
    font-size: 15px;
    color: #1a1a2e;
  }

  .notif-read-all {
    border: none;
    background: none;
    color: #2d6a4f;
    font-size: 13px;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }
}

.notif-list {
  max-height: 360px;
  overflow-y: auto;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba(45, 106, 79, 0.04); }

  &.unread {
    background: rgba(45, 106, 79, 0.02);
  }
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2d6a4f;
  flex-shrink: 0;
  margin-top: 6px;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 2px;
}

.notif-item-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; /* stylelint-disable-line -- 标准属性，浏览器支持有限 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item-time {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.notif-empty {
  text-align: center;
  padding: 40px 0;
  color: #aaa;
  font-size: 14px;
}
</style>
