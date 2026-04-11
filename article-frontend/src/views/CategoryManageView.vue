<template>
  <AdminLayout>
    <div class="category-manage-view">
      <div class="page-card">
        <div class="card-toolbar">
          <h3>分类列表</h3>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 新增分类
          </el-button>
        </div>

        <el-table :data="categories" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="分类名称" />
          <el-table-column prop="sort" label="排序" width="100" />
          <el-table-column prop="articleCount" label="文章数" width="100">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ row.articleCount ?? 0 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 新增/编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑分类' : '新增分类'" width="400px" destroy-on-close>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="0" :max="999" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategories } from '../api/article'
import { createCategory, updateCategory, deleteCategory } from '../api/admin'
import AdminLayout from '../components/AdminLayout.vue'

const categories = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref()

const form = reactive({ name: '', sort: 0 })
const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

onMounted(fetchCategories)

async function fetchCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data
  } catch (err) {
    console.error('获取分类失败:', err)
  }
}

function showAddDialog() {
  isEditing.value = false
  editingId.value = null
  form.name = ''
  form.sort = 0
  dialogVisible.value = true
}

function showEditDialog(row) {
  isEditing.value = true
  editingId.value = row.id
  form.name = row.name
  form.sort = row.sort || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEditing.value) {
      await updateCategory(editingId.value, { name: form.name, sort: form.sort })
      ElMessage.success('更新成功')
    } else {
      await createCategory({ name: form.name, sort: form.sort })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchCategories()
  } catch (err) {
    console.error('保存分类失败:', err)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？如果该分类下有文章则无法删除。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch (err) {
    if (err !== 'cancel') console.error('删除分类失败:', err)
  }
}
</script>

<style lang="scss" scoped>
.category-manage-view {
  max-width: 900px;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 24px;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }
}
</style>
