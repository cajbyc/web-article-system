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
        <span class="logo-text">墨笔</span>
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { UserFilled, SwitchButton, Delete, Star, StarFilled, ChatDotRound, Search, Checked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')

const isEditor = computed(() => {
  const role = userStore.userInfo?.role
  return ['admin', 'editor', 'author'].includes(role)
})

function handleSearch() {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    router.push({ path: '/articles', query: { keyword } })
  } else {
    router.push('/articles')
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

.user-avatar-wrap {
  cursor: pointer;
  margin-left: 8px;
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
