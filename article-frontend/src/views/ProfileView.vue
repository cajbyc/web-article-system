<template>
  <div class="profile-view">
    <div class="profile-card">
      <!-- 用户头像区 -->
      <div class="profile-hero">
        <el-avatar :size="64" class="profile-avatar">
          {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
        </el-avatar>
        <div class="profile-brief">
          <h2>{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</h2>
          <div class="role-row">
            <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
            <el-tag v-if="hasPendingApplication" type="warning" size="small">审核中</el-tag>
          </div>
        </div>
      </div>

      <!-- 用户信息 -->
      <div class="profile-info">
        <div class="info-row">
          <span class="info-label">用户名</span>
          <span class="info-value">{{ userStore.userInfo?.username }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">邮箱</span>
          <span class="info-value">{{ userStore.userInfo?.email || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">用户 ID</span>
          <span class="info-value">{{ userStore.userInfo?.id }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">注册时间</span>
          <span class="info-value">{{ formatTime(userStore.userInfo?.createdAt) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button @click="showEditDialog">
          <el-icon><EditPen /></el-icon> 编辑资料
        </el-button>
        <el-button @click="showPasswordDialog">
          <el-icon><Key /></el-icon> 修改密码
        </el-button>
        <el-button v-if="canApplyAuthor" type="primary" @click="showApplyDialog">
          <el-icon><Promotion /></el-icon> 申请成为作者
        </el-button>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料" width="460px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="70px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleUpdateProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="460px" destroy-on-close>
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 申请成为作者对话框 -->
    <el-dialog v-model="applyDialogVisible" title="申请成为作者" width="480px" destroy-on-close>
      <p style="margin-top: 0; color: #8e8ea0;">成为作者后，你将可以发布和管理自己的文章。</p>
      <el-form label-width="80px">
        <el-form-item label="申请理由">
          <el-input
            v-model="applyReason"
            type="textarea"
            :rows="4"
            placeholder="请简要说明申请理由（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="applyLoading" @click="handleApplyAuthor">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { EditPen, Key, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import request from '../utils/request'

const userStore = useUserStore()

const ROLE_LABEL_MAP = Object.freeze({ admin: '管理员', author: '作者', user: '普通用户' })
const ROLE_TAG_TYPE_MAP = Object.freeze({ admin: 'danger', author: '', user: 'info' })

const myApplication = ref(null)

onMounted(async () => {
  await userStore.fetchUserInfo()
  if (userStore.userInfo?.role === 'user') {
    fetchMyApplication()
  }
})

const canApplyAuthor = computed(() => {
  const role = userStore.userInfo?.role
  return role === 'user' && myApplication.value?.status !== 'pending'
})

const hasPendingApplication = computed(() => {
  return myApplication.value?.status === 'pending'
})

const roleLabel = computed(() => ROLE_LABEL_MAP[userStore.userInfo?.role] || '普通用户')
const roleTagType = computed(() => ROLE_TAG_TYPE_MAP[userStore.userInfo?.role] || 'info')

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

// ========== 编辑资料 ==========
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editForm = reactive({ nickname: '', email: '' })

const editRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 20, message: '昵称长度1-20个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

function showEditDialog() {
  editForm.nickname = userStore.userInfo?.nickname || ''
  editForm.email = userStore.userInfo?.email || ''
  editDialogVisible.value = true
}

async function handleUpdateProfile() {
  await editFormRef.value.validate()
  editLoading.value = true
  try {
    const res = await request.put('/auth/profile', {
      nickname: editForm.nickname,
      email: editForm.email,
    })
    ElMessage.success(res.message || '资料更新成功')
    userStore.userInfo = { ...userStore.userInfo, ...res.data }
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
    editDialogVisible.value = false
  } catch (err) {
    console.error('更新资料失败:', err)
  } finally {
    editLoading.value = false
  }
}

// ========== 修改密码 ==========
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const validateConfirm = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

function showPasswordDialog() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

async function handleChangePassword() {
  await passwordFormRef.value.validate()
  passwordLoading.value = true
  try {
    const res = await request.put('/auth/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success(res.message || '密码修改成功')
    passwordDialogVisible.value = false
  } catch (err) {
    console.error('修改密码失败:', err)
  } finally {
    passwordLoading.value = false
  }
}

// ========== 申请成为作者 ==========
const applyDialogVisible = ref(false)
const applyLoading = ref(false)
const applyReason = ref('')

async function fetchMyApplication() {
  try {
    const res = await request.get('/applications/my', { _silent: true })
    myApplication.value = res.data
  } catch {
    // 静默处理
  }
}

function showApplyDialog() {
  applyReason.value = ''
  applyDialogVisible.value = true
}

async function handleApplyAuthor() {
  applyLoading.value = true
  try {
    const res = await request.post('/applications', {
      toRole: 'author',
      reason: applyReason.value,
    })
    ElMessage.success(res.message || '申请已提交')
    myApplication.value = res.data
    applyDialogVisible.value = false
  } catch (err) {
    console.error('申请失败:', err)
  } finally {
    applyLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.profile-view {
  max-width: 640px;
  margin: 0 auto;
}

.profile-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.profile-hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d4a3e 100%);
  padding: 32px 28px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  border: 3px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  font-size: 24px;
  color: #fff;
}

.profile-brief {
  h2 {
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .role-row {
    display: flex;
    gap: 6px;
  }
}

.profile-info {
  padding: 20px 28px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  &:last-child { border-bottom: none; }

  .info-label {
    color: #8e8ea0;
    font-size: 14px;
  }

  .info-value {
    color: #1a1a2e;
    font-size: 14px;
    font-weight: 500;
  }
}

.action-bar {
  padding: 16px 28px 24px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
