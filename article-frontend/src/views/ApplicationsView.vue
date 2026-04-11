<template>
  <AdminLayout>
    <div class="applications-view">
      <div class="page-card">
        <div class="page-header">
          <div class="header-left">
            <h3>角色申请列表</h3>
            <span class="pending-count" v-if="pendingCount > 0">{{ pendingCount }} 条待审核</span>
          </div>
          <el-radio-group v-model="filterStatus" size="small" @change="fetchApplications">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="pending">待审核</el-radio-button>
            <el-radio-button value="approved">已批准</el-radio-button>
            <el-radio-button value="rejected">已拒绝</el-radio-button>
          </el-radio-group>
        </div>

        <el-table :data="applications" v-loading="loading" stripe>
          <el-table-column label="申请人" min-width="120">
            <template #default="{ row }">
              {{ row.nickname || row.username }}
            </template>
          </el-table-column>
          <el-table-column label="申请角色" width="100">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ roleLabel(row.toRole) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="申请理由" prop="reason" min-width="200">
            <template #default="{ row }">
              {{ row.reason || '未填写' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="申请时间" width="170">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <template v-if="row.status === 'pending'">
                <el-button type="success" size="small" @click="handleReview(row, 'approved')">批准</el-button>
                <el-button type="danger" size="small" @click="handleReview(row, 'rejected')">拒绝</el-button>
              </template>
              <span v-else style="color: #8e8ea0;">已处理</span>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && applications.length === 0" description="暂无申请记录" />
      </div>

      <!-- 审批对话框 -->
      <el-dialog v-model="reviewDialogVisible" :title="reviewAction === 'approved' ? '批准申请' : '拒绝申请'" width="460px" destroy-on-close>
        <p>确定要{{ reviewAction === 'approved' ? '批准' : '拒绝' }} <strong>{{ currentApp?.nickname || currentApp?.username }}</strong> 的作者申请吗？</p>
        <el-form label-width="80px" style="margin-top: 16px;">
          <el-form-item label="审批备注">
            <el-input v-model="reviewNote" type="textarea" :rows="3" placeholder="选填" maxlength="100" show-word-limit />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button :type="reviewAction === 'approved' ? 'success' : 'danger'" :loading="reviewLoading" @click="submitReview">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import AdminLayout from '../components/AdminLayout.vue'

const loading = ref(false)
const applications = ref([])
const filterStatus = ref('')

const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const reviewAction = ref('')
const reviewNote = ref('')
const currentApp = ref(null)

const pendingCount = computed(() => applications.value.filter(a => a.status === 'pending').length)

onMounted(() => {
  fetchApplications()
})

async function fetchApplications() {
  loading.value = true
  try {
    const params = {}
    if (filterStatus.value) params.status = filterStatus.value
    const res = await request.get('/admin/applications', { params })
    applications.value = res.data
  } catch (err) {
    console.error('获取申请列表失败:', err)
  } finally {
    loading.value = false
  }
}

function handleReview(row, action) {
  currentApp.value = row
  reviewAction.value = action
  reviewNote.value = ''
  reviewDialogVisible.value = true
}

async function submitReview() {
  reviewLoading.value = true
  try {
    const res = await request.put(`/admin/applications/${currentApp.value.id}`, {
      status: reviewAction.value,
      reviewNote: reviewNote.value,
    })
    ElMessage.success(res.message)
    reviewDialogVisible.value = false
    fetchApplications()
  } catch (err) {
    console.error('审批失败:', err)
  } finally {
    reviewLoading.value = false
  }
}

function roleLabel(role) {
  return { author: '作者' }[role] || role
}

function statusType(status) {
  return { pending: 'warning', approved: 'success', rejected: 'danger' }[status] || 'info'
}

function statusLabel(status) {
  return { pending: '待审核', approved: '已批准', rejected: '已拒绝' }[status] || status
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.applications-view {
  max-width: 1100px;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 24px 28px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }

  .pending-count {
    font-size: 12px;
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.08);
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
  }
}
</style>
