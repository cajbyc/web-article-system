<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="logo" @click="$router.push('/')">
        <el-icon :size="24"><Edit /></el-icon>
        <span>文章管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        :ellipsis="false"
        router
        class="nav-menu"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/articles">文章列表</el-menu-item>

        <!-- 未登录时显示 -->
        <template v-if="!userStore.userInfo">
          <el-menu-item index="/login">登录</el-menu-item>
          <el-menu-item index="/register">注册</el-menu-item>
        </template>

        <!-- 登录后显示 -->
        <template v-else>
          <el-menu-item index="/admin/dashboard" v-if="userStore.userInfo?.role === 'admin'">
            <el-icon><DataAnalysis /></el-icon> 管理面板
          </el-menu-item>
          <el-menu-item index="/article/create" v-if="isEditor">
            <el-icon><EditPen /></el-icon> 写文章
          </el-menu-item>
          <el-menu-item index="/my/articles" v-if="isEditor">我的文章</el-menu-item>

          <el-sub-menu :index="'profile'">
            <template #title>
              <el-avatar :size="28" style="margin-right: 6px;">
                {{ userStore.userInfo.username?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
              {{ userStore.userInfo.username }}
            </template>
            <el-menu-item index="/profile">
              <el-icon><UserFilled /></el-icon>个人中心
            </el-menu-item>
            <el-menu-item index="/my/recycle" v-if="isEditor">
              <el-icon><Delete /></el-icon>回收站
            </el-menu-item>
            <el-menu-item index="/my/collects">
              <el-icon><Star /></el-icon>我的收藏
            </el-menu-item>
            <el-menu-item index="/my/comments">
              <el-icon><ChatDotRound /></el-icon>我的评论
            </el-menu-item>
            <el-menu-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { Edit, UserFilled, SwitchButton, EditPen, Delete, Star, ChatDotRound, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => {
  if (route.path.startsWith('/article/')) return '/articles'
  return route.path
})

const isEditor = computed(() => {
  const role = userStore.userInfo?.role
  return ['admin', 'editor', 'author'].includes(role)
})

function handleLogout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.app-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

  @media (max-width: 1240px) {
    padding: 0 16px;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
  margin-right: 40px;
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  border-bottom: none !important;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    font-size: 15px;
  }
}
</style>
