<template>
  <AdminLayout>
    <div class="comments-manage-view">
      <div class="page-card">
        <div class="toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索评论内容 / 文章标题..."
            clearable
            style="width: 300px;"
            @keyup.enter="fetchData"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
            批量删除（{{ selectedIds.length }}）
          </el-button>
          <el-button type="primary" @click="fetchData">搜索</el-button>
        </div>

        <el-table
          :data="list"
          v-loading="loading"
          stripe
          @selection-change="val => selectedIds = val.map(r => r.id)"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="内容" min-width="250" show-overflow-tooltip>
            <template #default="{ row }">{{ row.content }}</template>
          </el-table-column>
          <el-table-column label="所属文章" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <router-link v-if="row.article" :to="`/article/${row.articleId || row.article?.id}`" class="article-link">
                {{ row.articleTitle || row.article?.title }}
              </router-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="评论者" width="110">
            <template #default="{ row }">
              {{ row.userName || row.user?.nickname || row.user?.username || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="70" fixed="right">
            <template #default="{ row }">
              <el-popconfirm title="确定删除此条评论？" @confirm="handleDeleteSingle(row)">
                <template #reference>
                  <el-button type="danger" text size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper" v-if="total > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="fetchData"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllComments, batchDeleteComments } from '../api/admin'
import AdminLayout from '../components/AdminLayout.vue'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10
const searchKeyword = ref('')
const selectedIds = ref([])

onMounted(fetchData)

async function fetchData(page = currentPage.value) {
  currentPage.value = page
  loading.value = true
  try {
    const res = await getAllComments({
      page,
      pageSize,
      keyword: searchKeyword.value,
    })
    list.value = res.data.list || []
    total.value = res.data.total || 0
    selectedIds.value = []
  } catch (err) {
    console.error('获取评论列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条评论吗？`, '批量删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res = await batchDeleteComments(selectedIds.value)
    ElMessage.success(res.message || '批量删除成功')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') console.error('批量删除失败:', err)
  }
}

async function handleDeleteSingle(comment) {
  try {
    await batchDeleteComments([comment.id])
    ElMessage.success('删除成功')
    fetchData()
  } catch (err) {
    console.error('删除评论失败:', err)
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.comments-manage-view {
  max-width: 1150px;
}

.page-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 24px 28px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.article-link {
  color: #2d6a4f;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
