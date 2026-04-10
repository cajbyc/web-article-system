<template>
  <div class="my-articles-view">
    <div class="page-card">
      <div class="page-header">
        <h2>我的文章</h2>
        <el-button type="primary" @click="$router.push('/article/create')">
          <el-icon><EditPen /></el-icon> 写文章
        </el-button>
      </div>

      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 140px;" @change="fetchData">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
          <el-option label="私密" value="private" />
        </el-select>
      </div>

      <el-table :data="articles" v-loading="loading" stripe style="width: 100%;">
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">{{ row.categoryName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="阅读" width="80" align="center" />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="$router.push(`/article/${row.id}`)">查看</el-button>
            <el-button size="small" link type="primary" @click="$router.push(`/article/edit/${row.id}`)">编辑</el-button>
            <el-popconfirm title="确定删除此文章？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button size="small" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          background
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="(p) => { page = p; fetchData() }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { EditPen } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getMyArticles, deleteArticle } from '../api/article'

const loading = ref(false)
const articles = ref([])
const filterStatus = ref('')
const page = ref(1)
const pageSize = 10
const total = ref(0)

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const res = await getMyArticles({
      page: page.value,
      pageSize,
      status: filterStatus.value,
    })
    articles.value = res.data.list
    total.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function handleDelete(id) {
  await deleteArticle(id)
  ElMessage.success('已移至回收站')
  fetchData()
}

function statusType(status) {
  const map = { draft: 'info', published: 'success', private: 'warning' }
  return map[status] || ''
}

function statusLabel(status) {
  const map = { draft: '草稿', published: '已发布', private: '私密' }
  return map[status] || status
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.my-articles-view {
  max-width: 1100px;
  margin: 0 auto;
}

.page-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 24px 28px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
    letter-spacing: -0.3px;
  }
}

.filter-bar {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
