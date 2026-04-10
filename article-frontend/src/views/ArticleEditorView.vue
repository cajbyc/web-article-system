<template>
  <div class="editor-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h2>{{ isEdit ? '编辑文章' : '发布新文章' }}</h2>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <!-- 标题 -->
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="100" show-word-limit />
        </el-form-item>

        <!-- 分类 -->
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 300px;">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>

        <!-- 封面上传 -->
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
              <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <span class="tip">建议尺寸 1200x630，支持 jpg/png/gif/webp，最大 5MB</span>
          </div>
        </el-form-item>

        <!-- 内容编辑器（简化版 textarea，可后续替换为富文本）-->
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="16"
            placeholder="请输入文章内容（支持 Markdown 格式）..."
            class="article-content"
          />
        </el-form-item>

        <!-- 状态 -->
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio-button value="draft">草稿</el-radio-button>
            <el-radio-button value="published">公开</el-radio-button>
            <el-radio-button value="private">私密</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="info" @click="handleSubmit('draft')" :loading="saving">保存草稿</el-button>
          <el-button type="primary" @click="handleSubmit('published')" :loading="saving">发布</el-button>
        </el-form-item>
      </el-form>
    </el-card>
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

// 上传相关
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

  // 编辑模式：加载文章数据
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

  .card-header h2 { font-size: 20px; margin: 0; }
}

.cover-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    width: 200px;
    height: 130px;
    overflow: hidden;

    &:hover { border-color: #409eff; }
  }
}

.cover-preview {
  width: 200px;
  height: 130px;
  object-fit: cover;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tip {
  font-size: 12px;
  color: #909399;
}

.article-content {
  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', monospace;
    line-height: 1.8;
    font-size: 14px;
  }
}
</style>
