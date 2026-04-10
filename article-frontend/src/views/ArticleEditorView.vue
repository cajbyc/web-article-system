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
          <!-- Markdown 工具栏 -->
          <div class="md-toolbar">
            <button type="button" class="md-btn" title="加粗" @click="insertMd('**', '**')">B</button>
            <button type="button" class="md-btn" title="斜体" @click="insertMd('*', '*')"><em>I</em></button>
            <button type="button" class="md-btn" title="删除线" @click="insertMd('~~', '~~')"><s>S</s></button>
            <span class="md-sep">|</span>
            <button type="button" class="md-btn" title="标题" @click="insertMd('\n## ', '\n')">H</button>
            <button type="button" class="md-btn" title="引用" @click="insertMd('\n> ', '\n')">Q</button>
            <button type="button" class="md-btn" title="代码块" @click="insertMd('\n```\n', '\n```\n')">&lt;/&gt;</button>
            <button type="button" class="md-btn" title="链接" @click="insertMd('[', '](url)')">Link</button>
            <button type="button" class="md-btn" title="图片" @click="insertMd('![alt](', ')')">Img</button>
            <button type="button" class="md-btn" title="无序列表" @click="insertMd('\n- ', '\n')">UL</button>
            <button type="button" class="md-btn" title="有序列表" @click="insertMd('\n1. ', '\n')">OL</button>
            <span class="md-sep">|</span>
            <button type="button" class="md-btn preview-toggle" :class="{ active: showPreview }" @click="showPreview = !showPreview">
              预览
            </button>
          </div>
          <div class="md-editor-row">
            <el-input
              ref="contentInput"
              v-model="form.content"
              type="textarea"
              :rows="18"
              placeholder="支持 Markdown 语法，输入文章内容..."
              class="article-content"
              @input="updatePreview"
            />
            <div v-if="showPreview" class="md-preview" v-html="previewHtml"></div>
          </div>
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
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { getCategories, getArticleDetail, createArticle, updateArticle } from '../api/article'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)
const categories = ref([])
const showPreview = ref(false)
const previewHtml = ref('')
const contentInput = ref()

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
      updatePreview()
    } catch (err) {
      console.error('加载文章失败:', err)
    }
  }
})

function updatePreview() {
  previewHtml.value = form.content ? md.render(form.content) : ''
}

function insertMd(before, after) {
  const textarea = contentInput.value?.$el?.querySelector('textarea')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = form.content.substring(start, end)
  const replacement = before + selected + after

  form.content = form.content.substring(0, start) + replacement + form.content.substring(end)
  updatePreview()

  nextTick(() => {
    textarea.focus()
    const cursorPos = start + before.length + selected.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  })
}

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
  max-width: 960px;
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

.md-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.md-btn {
  padding: 4px 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  border-radius: 4px;
  transition: all 0.15s;
  font-weight: 500;

  &:hover {
    background: rgba(45, 106, 79, 0.08);
    color: #2d6a4f;
  }

  &.preview-toggle.active {
    background: #2d6a4f;
    color: #fff;
  }
}

.md-sep {
  color: #d0d0d8;
  margin: 0 4px;
  font-size: 12px;
}

.md-editor-row {
  display: flex;
  gap: 0;
}

.article-content {
  flex: 1;

  :deep(.el-textarea__inner) {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    line-height: 1.8;
    font-size: 14px;
    border-radius: 8px;
    border-top-right-radius: 0;
  }
}

.md-preview {
  flex: 1;
  padding: 16px 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: none;
  border-radius: 0 8px 8px 0;
  background: #fafafa;
  overflow-y: auto;
  max-height: 440px;
  font-size: 14px;
  line-height: 1.7;
  color: #333;

  :deep(h1), :deep(h2), :deep(h3) {
    color: #2d6a4f;
    margin-top: 0.8em;
    margin-bottom: 0.4em;
  }
  :deep(code) {
    background: rgba(45, 106, 79, 0.06);
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.9em;
  }
  :deep(pre) {
    background: #1e1e2e;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    code { background: none; color: #cdd6f4; }
  }
  :deep(blockquote) {
    border-left: 3px solid #2d6a4f;
    padding: 0.3em 1em;
    margin: 0.5em 0;
    background: rgba(45, 106, 79, 0.04);
    border-radius: 0 4px 4px 0;
  }
}

.form-actions {
  display: flex;
  gap: 8px;
}
</style>
