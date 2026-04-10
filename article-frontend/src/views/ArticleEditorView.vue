<template>
  <div class="editor-view">
    <div class="editor-card">
      <div class="editor-header">
        <h2>{{ isEdit ? '编辑文章' : '发布新文章' }}</h2>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="editor-form">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 300px;">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="封面">
          <div class="cover-upload">
            <el-upload
              class="cover-uploader"
              :action="uploadAction"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleCoverSuccess"
              accept="image/*"
            >
              <img v-if="form.cover" :src="form.cover" class="cover-preview" />
              <div v-else class="cover-placeholder">
                <el-icon :size="24"><Plus /></el-icon>
                <span>上传封面</span>
              </div>
            </el-upload>
            <span class="tip">建议 1200x630，最大 5MB</span>
          </div>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="16"
            placeholder="请输入文章内容..."
            class="article-content"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio-button value="draft">草稿</el-radio-button>
            <el-radio-button value="published">公开</el-radio-button>
            <el-radio-button value="private">私密</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <div class="form-actions">
            <el-button @click="$router.back()">取消</el-button>
            <el-button type="info" @click="handleSubmit('draft')" :loading="saving">保存草稿</el-button>
            <el-button type="primary" @click="handleSubmit('published')" :loading="saving">发布</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getCategories, getArticleDetail, createArticle, updateArticle, uploadImage } from '../api/article'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)
const categories = ref([])

const isEdit = computed(() => !!route.params.id)
const articleId = computed(() => route.params.id)

const uploadAction = computed(() => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  return `${baseUrl.replace(/\/api\/?$/, '')}/api/upload/image`
})
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
}))

const form = reactive({
  title: '',
  categoryId: '',
  content: '',
  cover: '',
  status: 'draft',
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

onMounted(async () => {
  const res = await getCategories()
  categories.value = res.data

  if (isEdit.value) {
    try {
      const detail = await getArticleDetail(articleId.value)
      Object.assign(form, {
        title: detail.data.title,
        categoryId: detail.data.categoryId,
        content: detail.data.content,
        cover: detail.data.cover,
        status: detail.data.status,
      })
    } catch (err) {
      console.error('加载文章失败:', err)
    }
  }
})

function handleCoverSuccess(res) {
  if (res.success) {
    form.cover = res.data.url
    ElMessage.success('封面上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

async function handleSubmit(statusOverride) {
  await formRef.value.validate()
  saving.value = true

  try {
    const data = { ...form, status: statusOverride }

    if (isEdit.value) {
      await updateArticle(articleId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createArticle(data)
      ElMessage.success('发布成功')
    }

    router.push('/my/articles')
  } catch (err) {
    console.error('保存失败:', err)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.editor-view {
  max-width: 900px;
  margin: 0 auto;
}

.editor-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 28px 32px;
}

.editor-header {
  margin-bottom: 24px;

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
    letter-spacing: -0.3px;
  }
}

.editor-form {
  :deep(.el-input__wrapper),
  :deep(.el-select .el-input__wrapper) {
    border-radius: 8px;
  }
}

.cover-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d4d4dc;
    border-radius: 10px;
    width: 200px;
    height: 120px;
    overflow: hidden;
    transition: border-color 0.2s;

    &:hover { border-color: #2d6a4f; }
  }
}

.cover-preview {
  width: 200px;
  height: 120px;
  object-fit: cover;
}

.cover-placeholder {
  width: 200px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #b8b8c8;
  font-size: 13px;
}

.tip {
  font-size: 12px;
  color: #8e8ea0;
}

.article-content {
  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    line-height: 1.8;
    font-size: 14px;
    border-radius: 8px;
  }
}

.form-actions {
  display: flex;
  gap: 8px;
}
</style>
