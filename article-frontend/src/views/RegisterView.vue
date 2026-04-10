<template>
  <div class="register-view">
    <div class="auth-card">
      <div class="auth-header">
        <h2>创建账号</h2>
        <p>加入我们，开始你的创作之旅</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" class="auth-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名（3-20位）" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱" :prefix-icon="Message" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码（至少6位）" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <button type="button" class="submit-btn" :disabled="loading" @click="handleRegister">
            <span v-if="loading" class="btn-loading"></span>
            <span v-else>注 册</span>
          </button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        已有账号？<router-link to="/login">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

async function handleRegister() {
  await formRef.value.validate()
  loading.value = true

  try {
    await userStore.register({
      username: form.username,
      email: form.email,
      password: form.password,
      nickname: form.username,
    })
    ElMessage.success('注册成功！请登录')
    router.push('/login')
  } catch (err) {
    console.error('注册失败:', err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
  padding: 40px 0;
  background:
    radial-gradient(ellipse at 70% 30%, rgba(45, 106, 79, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 70%, rgba(45, 106, 79, 0.03) 0%, transparent 50%);
}

.auth-card {
  width: 420px;
  max-width: 100%;
  background: #fff;
  border-radius: 14px;
  padding: 40px 36px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.auth-header {
  margin-bottom: 28px;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }

  p {
    font-size: 14px;
    color: #8e8ea0;
  }
}

.auth-form {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    padding: 4px 12px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}

.submit-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 8px;
  background: #2d6a4f;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #40916c;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.btn-loading {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
  color: #8e8ea0;
  font-size: 14px;
  margin-top: 20px;

  a {
    color: #2d6a4f;
    font-weight: 500;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
</style>
