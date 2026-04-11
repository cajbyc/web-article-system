<template>
  <AdminLayout>
    <div class="admin-articles-view">
      <div class="page-card">
        <div class="toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文章标题..."
            clearable
            style="width: 280px;"
            @keyup.enter="fetchData"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="fetchData">搜索</el-button>
        </div>

        <el-table :data="list" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="65" />
          <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ row.categoryName || row.category?.name || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="作者" width="110">
            <template #default="{ row }">{{ row.authorName || row.user?.nickname || '-' }}</template>
          </el-table-column>
          <el-table-column prop="viewCount" label="阅读量" width="85" sortable />
          <el-table-column prop="likeCount" label="点赞" width="70" />
          <el-table-column prop="collectCount" label="收藏" width="70" />
          <el-table-column label="发布时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" text size="small" @click="$router.push(`/article/${row.id}`)">查看</el-button>
              <el-button type="primary" text size="small" @click="$router.push(`/article/edit/${row.id}`)">编辑</el-button>
              <el-popconfirm title="确定彻底删除此文章及所有关联数据？" @confirm="handleForceDelete(row)">
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
import { ElMessage } from 'element-plus'
import { getAdminArticles, forceDeleteArticle } from '../api/admin'
import AdminLayout from '../components/AdminLayout.vue'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10
const searchKeyword = ref('')

onMounted(fetchData)

async function fetchData() {
  loading.value = true
  try {
    const res = await getAdminArticles({
      page: currentPage.value,
      pageSize,
      keyword: searchKeyword.value,
    })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('获取文章列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleForceDelete(article) {
  try {
    await forceDeleteArticle(article.id)
    ElMessage.success('文章已被彻底删除')
    fetchData()
  } catch (err) {
    console.error('删除文章失败:', err)
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.admin-articles-view {
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
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
