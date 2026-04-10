<template>
  <div class="my-collects-view">
    <el-page-header @back="$router.push('/')" title="返回首页">
      <template #content><span class="page-title">我的收藏</span></template>
    </el-page-header>

    <div class="content-area" v-loading="loading">
      <!-- 收藏列表 -->
      <div v-if="list.length > 0" class="collect-list">
        <el-card v-for="item in list" :key="item.id" class="collect-card" shadow="hover" @click="$router.push(`/article/${item.id}`)">
          <div class="card-body">
            <div class="card-info">
              <h3 class="card-title">{{ item.title }}</h3>
              <div class="card-meta">
                <el-tag size="small" type="info">{{ item.categoryName || '未分类' }}</el-tag>
                <span class="meta-text"><el-icon><User /></el-icon> {{ item.authorName || '未知作者' }}</span>
                <span class="meta-text"><el-icon><StarFilled /></el-icon> {{ item.collectCount || 0 }} 人收藏</span>
                <span class="meta-time">收藏于 {{ formatTime(item.collectedAt || item.createdAt) }}</span>
              </div>
            </div>
            <el-button type="danger" text size="small" class="uncollect-btn" @click.stop="handleUncollect(item)">
              取消收藏
            </el-button>
          </div>
        </el-card>

        <div class="pagination-wrapper" v-if="total > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="fetchData"
          />
        </div>
      </div>

      <el-empty v-else description="还没有收藏任何文章，去发现好文吧！">
        <el-button type="primary" @click="$router.push('/articles')">浏览文章</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, StarFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyCollects, toggleCollect } from '../api/interaction'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const res = await getMyCollects({ page: currentPage.value, pageSize })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载收藏列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleUncollect(item) {
  try {
    await ElMessageBox.confirm('确定取消收藏这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res = await toggleCollect(item.id)
    ElMessage.success(res.message || '已取消收藏')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') console.error('取消收藏失败:', err)
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.my-collects-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.content-area {
  margin-top: 20px;
  min-height: 300px;
}

.collect-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collect-card {
  cursor: pointer;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #909399;
  flex-wrap: wrap;

  .meta-text {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .meta-time {
    color: #c0c4cc;
  }
}

.uncollect-btn {
  flex-shrink: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
