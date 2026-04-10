<template>
  <div class="register-view">
    <el-card class="register-card" shadow="always">
      <template #header>
        <div class="card-header">
          <h2>用户注册</h2>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%;" @click="handleRegister" :loading="loading">
            注 册
          </el-button>
        </el-form-item>
        <div class="register-footer">
          已有账号？<router-link to="/login">去登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
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
      nickname: form.username, // 默认用用户名作为昵称
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
  padding-top: 40px;

  .register-card {
    width: 480px;
    max-width: 100%;

    .card-header h2 {
      text-align: center;
      font-size: 22px;
      margin: 0;
    }
  }

  .register-footer {
    text-align: center;
    color: #909399;
    font-size: 14px;

    a {
      color: #409eff;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }
}
</style>
