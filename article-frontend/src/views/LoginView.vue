<template>
  <div class="login-view">
    <div class="auth-card">
      <div class="auth-header">
        <h2>欢迎回来</h2>
        <p>登录你的账号继续</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" class="auth-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <button type="button" class="submit-btn" :disabled="loading" @click="handleLogin">
            <span v-if="loading" class="btn-loading"></span>
            <span v-else>登 录</span>
          </button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true

  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功！')
    const redirect = router.currentRoute.value.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    console.error('登录失败:', err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
  padding: 40px 0;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(45, 106, 79, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(45, 106, 79, 0.03) 0%, transparent 50%);
}

.auth-card {
  width: 400px;
  max-width: 100%;
  background: #fff;
  border-radius: 14px;
  padding: 40px 36px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.auth-header {
  margin-bottom: 32px;

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

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
