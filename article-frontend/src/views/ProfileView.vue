<template>
  <div class="profile-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h2><el-icon><UserFilled /></el-icon> 个人中心</h2>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">{{ userStore.userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="用户 ID">{{ userStore.userInfo?.id }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="roleTagType">{{ roleLabel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatTime(userStore.userInfo?.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <div class="action-bar" style="margin-top: 24px;">
        <el-button type="primary"><el-icon><EditPen /></el-icon> 编辑资料</el-button>
        <el-button type="warning"><el-icon><Key /></el-icon> 修改密码</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { UserFilled, EditPen, Key } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

// 角色映射常量（避免在 computed 中重复创建）
const ROLE_LABEL_MAP = Object.freeze({ admin: '管理员', editor: '编辑', author: '作者', user: '普通用户' })
const ROLE_TAG_TYPE_MAP = Object.freeze({ admin: 'danger', editor: 'warning', author: '', user: 'info' })

// 进入页面时拉取最新的用户信息
onMounted(() => {
  userStore.fetchUserInfo()
})

const roleLabel = computed(() => ROLE_LABEL_MAP[userStore.userInfo?.role] || '普通用户')
const roleTagType = computed(() => ROLE_TAG_TYPE_MAP[userStore.userInfo?.role] || 'info')

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.profile-view {
  .card-header h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 20px;
    margin: 0;
  }

  .action-bar {
    display: flex;
    gap: 12px;
  }
}
</style>
