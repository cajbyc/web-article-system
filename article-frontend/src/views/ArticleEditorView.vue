<template>
  <div class="editor-view">
    <div class="editor-card">
      <div class="editor-header">
        <div class="header-left">
          <h2>{{ isEdit ? '编辑文章' : '发布新文章' }}</h2>
          <span class="word-count" v-if="form.content">{{ charCount }} 字</span>
        </div>
        <div class="header-actions">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon> 取消
          </el-button>
          <el-button type="info" @click="handleSubmit('draft')" :loading="saving">
            <el-icon><Document /></el-icon> 保存草稿
          </el-button>
          <el-button type="primary" @click="handleSubmit('published')" :loading="saving">
            <el-icon><Promotion /></el-icon> 发布
          </el-button>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="editor-form">
        <div class="form-top-row">
          <el-form-item label="文章标题" prop="title" class="title-field">
            <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="100" show-word-limit size="large" />
          </el-form-item>

          <el-form-item label="分类" prop="categoryId" class="category-field">
            <el-select v-model="form.categoryId" placeholder="选择分类" size="large" style="width: 100%;">
              <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="封面图片">
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
                <el-icon :size="28"><Plus /></el-icon>
                <span>上传封面图片</span>
                <span class="cover-tip">1200 x 630，5MB 以内</span>
              </div>
            </el-upload>
            <el-button v-if="form.cover" type="danger" text size="small" @click.stop="form.cover = ''" class="remove-cover">
              <el-icon><Delete /></el-icon> 移除封面
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="文章内容" prop="content" class="content-field">
          <!-- Markdown 工具栏 -->
          <div class="md-toolbar">
            <div class="toolbar-group">
              <button type="button" class="md-btn" title="加粗" @click="insertMd('**', '**')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
              </button>
              <button type="button" class="md-btn" title="斜体" @click="insertMd('*', '*')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
              </button>
              <button type="button" class="md-btn" title="删除线" @click="insertMd('~~', '~~')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4H9a3 3 0 00-3 3v0a3 3 0 003 3h6"/><line x1="4" y1="12" x2="20" y2="12"/><path d="M15 12a3 3 0 013 3v0a3 3 0 01-3 3H8"/></svg>
              </button>
            </div>
            <span class="md-sep"></span>
            <div class="toolbar-group">
              <button type="button" class="md-btn" title="一级标题" @click="insertMd('\n# ', '\n')">H1</button>
              <button type="button" class="md-btn" title="二级标题" @click="insertMd('\n## ', '\n')">H2</button>
              <button type="button" class="md-btn" title="三级标题" @click="insertMd('\n### ', '\n')">H3</button>
            </div>
            <span class="md-sep"></span>
            <div class="toolbar-group">
              <button type="button" class="md-btn" title="引用" @click="insertMd('\n> ', '\n')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.264 0-2.457-.65-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.264 0-2.457-.65-2.917-1.179z"/></svg>
              </button>
              <button type="button" class="md-btn" title="代码块" @click="insertMd('\n```\n', '\n```\n')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </button>
              <button type="button" class="md-btn" title="行内代码" @click="insertMd('`', '`')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4l-5 8 5 8"/><path d="M15 4l5 8-5 8"/></svg>
              </button>
            </div>
            <span class="md-sep"></span>
            <div class="toolbar-group">
              <button type="button" class="md-btn" title="链接" @click="insertMd('[', '](url)')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </button>
              <button type="button" class="md-btn" title="图片" @click="insertMd('![alt](', ')')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </button>
              <button type="button" class="md-btn" title="水平线" @click="insertMd('\n---\n', '')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
              </button>
            </div>
            <span class="md-sep"></span>
            <div class="toolbar-group">
              <button type="button" class="md-btn" title="无序列表" @click="insertMd('\n- ', '\n')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
              </button>
              <button type="button" class="md-btn" title="有序列表" @click="insertMd('\n1. ', '\n')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" font-size="8" fill="currentColor" stroke="none">1</text><text x="2" y="14" font-size="8" fill="currentColor" stroke="none">2</text><text x="2" y="20" font-size="8" fill="currentColor" stroke="none">3</text></svg>
              </button>
              <button type="button" class="md-btn" title="任务列表" @click="insertMd('\n- [ ] ', '\n')">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
              </button>
            </div>

            <div class="toolbar-spacer"></div>

            <button type="button" class="md-btn preview-toggle" :class="{ active: showPreview }" @click="showPreview = !showPreview">
              <svg v-if="!showPreview" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              {{ showPreview ? '隐藏预览' : '显示预览' }}
            </button>
          </div>
          <div class="md-editor-row">
            <div class="md-edit-pane" :class="{ 'full-width': !showPreview }">
              <el-input
                ref="contentInput"
                v-model="form.content"
                type="textarea"
                :autosize="false"
                placeholder="支持 Markdown 语法，输入文章内容..."
                class="article-content"
                @input="updatePreview"
              />
            </div>
            <div v-if="showPreview" class="md-preview-pane">
              <div class="preview-header">预览</div>
              <div class="md-preview" v-html="previewHtml || '<p class=\'empty-hint\'>暂无内容</p>'"></div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="发布状态" class="status-field">
          <el-radio-group v-model="form.status" size="large">
            <el-radio-button value="draft">
              <el-icon><EditPen /></el-icon> 草稿
            </el-radio-button>
            <el-radio-button value="published">
              <el-icon><Promotion /></el-icon> 公开
            </el-radio-button>
            <el-radio-button value="private">
              <el-icon><Lock /></el-icon> 私密
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Delete, ArrowLeft, Document, Promotion, EditPen, Lock } from '@element-plus/icons-vue'
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

const charCount = computed(() => {
  return form.content ? form.content.replace(/\s/g, '').length : 0
})

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
  max-width: 1060px;
  margin: 0 auto;
}

.editor-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 28px 36px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;

    h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
      letter-spacing: -0.3px;
    }

    .word-count {
      font-size: 13px;
      color: #8e8ea0;
      background: rgba(0, 0, 0, 0.03);
      padding: 2px 10px;
      border-radius: 10px;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.editor-form {
  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #3a3a52;
    font-size: 14px;
    padding-bottom: 6px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select .el-input__wrapper) {
    border-radius: 8px;
  }
}

.form-top-row {
  display: flex;
  gap: 20px;

  .title-field {
    flex: 1;
  }

  .category-field {
    width: 220px;
    flex-shrink: 0;
  }
}

.cover-upload {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cover-uploader {
  :deep(.el-upload) {
    border: 2px dashed #d4d4dc;
    border-radius: 12px;
    width: 280px;
    height: 158px;
    overflow: hidden;
    transition: all 0.25s;

    &:hover {
      border-color: #2d6a4f;
      background: rgba(45, 106, 79, 0.02);
    }
  }
}

.cover-preview {
  width: 280px;
  height: 158px;
  object-fit: cover;
  border-radius: 10px;
}

.cover-placeholder {
  width: 280px;
  height: 158px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #b8b8c8;
  font-size: 14px;

  .cover-tip {
    font-size: 11px;
    color: #c8c8d4;
  }
}

.remove-cover {
  align-self: flex-start;
}

// Markdown toolbar
.md-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 10px;
  background: #f8f9fb;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: none;
  border-radius: 10px 10px 0 0;
}

.toolbar-group {
  display: flex;
  gap: 1px;
}

.md-btn {
  padding: 5px 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #5a5a72;
  border-radius: 5px;
  transition: all 0.15s;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1;

  &:hover {
    background: rgba(45, 106, 79, 0.08);
    color: #2d6a4f;
  }

  &.preview-toggle {
    font-weight: 500;
    font-size: 13px;
    margin-left: auto;
    padding: 5px 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;

    &.active {
      background: #2d6a4f;
      color: #fff;
      border-color: #2d6a4f;
    }
  }
}

.md-sep {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 6px;
}

.toolbar-spacer {
  flex: 1;
}

// Content field wrapper
.content-field {
  :deep(.el-form-item__content) {
    display: block;
    line-height: normal;
  }
}

// Editor row container
.md-editor-row {
  display: flex;
  flex-direction: row;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 0 0 10px 10px;
  overflow: hidden;
  height: 500px;
}

// Edit pane - takes full width when no preview
.md-edit-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;

  &.full-width {
    width: 100%;
  }

  // Input component wrapper
  .article-content {
    flex: 1;
    height: 100%;

    :deep(.el-textarea) {
      height: 100%;
    }

    :deep(.el-textarea__inner) {
      height: 100% !important;
      min-height: 100% !important;
      font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
      line-height: 1.8;
      font-size: 14px;
      border: none;
      border-radius: 0;
      padding: 16px 20px;
      resize: none;
      background: #fff;
      box-sizing: border-box;
    }
  }
}

// Preview pane
.md-preview-pane {
  width: 50%;
  flex-shrink: 0;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  height: 100%;

  .preview-header {
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #8e8ea0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    background: rgba(0, 0, 0, 0.01);
    flex-shrink: 0;
  }
}

.md-preview {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  font-size: 14px;
  line-height: 1.7;
  color: #333;

  :deep(h1), :deep(h2), :deep(h3) {
    color: #2d6a4f;
    margin-top: 1em;
    margin-bottom: 0.5em;
  }
  :deep(h1) { font-size: 1.5em; }
  :deep(h2) { font-size: 1.3em; }
  :deep(h3) { font-size: 1.1em; }
  :deep(code) {
    background: rgba(45, 106, 79, 0.06);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
    font-family: 'JetBrains Mono', 'Monaco', monospace;
  }
  :deep(pre) {
    background: #1e1e2e;
    border-radius: 8px;
    padding: 14px;
    overflow-x: auto;
    code { background: none; color: #cdd6f4; padding: 0; }
  }
  :deep(blockquote) {
    border-left: 3px solid #2d6a4f;
    padding: 0.3em 1em;
    margin: 0.5em 0;
    background: rgba(45, 106, 79, 0.04);
    border-radius: 0 6px 6px 0;
  }
  :deep(img) {
    max-width: 100%;
    border-radius: 6px;
  }
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    th, td {
      border: 1px solid #e0e0e8;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: rgba(0, 0, 0, 0.02);
      font-weight: 600;
    }
  }
  :deep(.empty-hint) {
    color: #c0c0cc;
    font-style: italic;
  }
}

.status-field {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .editor-card {
    padding: 20px 16px;
  }

  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }
  }

  .form-top-row {
    flex-direction: column;

    .category-field {
      width: 100%;
    }
  }

  .md-editor-row {
    flex-direction: column;
    height: auto;
  }

  .md-edit-pane {
    min-height: 280px;
    width: 100%;

    &.full-width {
      width: 100%;
    }
  }

  .md-preview-pane {
    width: 100%;
    min-height: 200px;
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .md-preview {
    max-height: 300px;
  }

  .cover-uploader :deep(.el-upload) {
    width: 100%;
  }

  .cover-preview, .cover-placeholder {
    width: 100%;
  }
}
</style>
