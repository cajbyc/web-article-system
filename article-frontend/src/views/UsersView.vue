<template>
  <div class="users-view">
    <el-page-header @back="$router.push('/admin/dashboard')" title="返回看板">
      <template #content><span class="page-title">用户管理</span></template>
    </el-page-header>

    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名 / 昵称 / 邮箱"
        clearable
        style="width: 260px;"
        @clear="fetchData"
        @keyup.enter="fetchData"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filterRole" placeholder="角色筛选" clearable style="width: 140px;" @change="fetchData">
        <el-option label="管理员" value="admin" />
        <el-option label="编辑" value="editor" />
        <el-option label="作者" value="author" />
        <el-option label="普通用户" value="user" />
      </el-select>
      <el-button type="primary" @click="fetchData"><el-icon><Search /></el-icon> 搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe style="margin-top: 16px;">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column label="角色" width="130">
        <template #default="{ row }">
          <el-select
            :modelValue="row.role"
            size="small"
            style="width: 105px;"
            :disabled="row.id === currentUser?.id"
            @change="(val) => handleRoleChange(row.id, val)"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="作者" value="author" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            :modelValue="row.status"
            active-text="启用"
            inactive-text="禁用"
            :disabled="row.id === currentUser?.id"
            @change="(val) => handleStatusChange(row.id, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-popconfirm title="确定删除该用户吗？不可恢复" confirmButtonText="确定" cancelButtonText="取消" @confirm="handleDelete(row)">
            <template #reference>
              <el-button type="danger" text size="small" :disabled="row.role === 'admin'">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getUserList, updateUserRole, updateUserStatus, deleteUser as apiDeleteUser } from '../api/admin'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const currentUser = computed(() => userStore.userInfo)

const loading = ref(false)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10
const searchKeyword = ref('')
const filterRole = ref('')

onMounted(fetchData)

async function fetchData() {
  loading.value = true
  try {
    const res = await getUserList({
      page: currentPage.value,
      pageSize,
      keyword: searchKeyword.value,
      role: filterRole.value,
    })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('获取用户列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(id, role) {
  try {
    await updateUserRole(id, role)
    ElMessage.success('角色已更新')
    fetchData()
  } catch (err) {
    console.error('修改角色失败:', err)
  }
}

async function handleStatusChange(id, status) {
  try {
    await updateUserStatus(id, status)
    ElMessage.success(status ? '用户已启用' : '用户已禁用')
  } catch (err) {
    console.error('修改状态失败:', err)
  }
}

async function handleDelete(user) {
  try {
    await apiDeleteUser(user.id)
    ElMessage.success(`用户 ${user.username} 已删除`)
    fetchData()
  } catch (err) {
    console.error('删除用户失败:', err)
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.users-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
