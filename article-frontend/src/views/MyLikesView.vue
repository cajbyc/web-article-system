<template>
  <div class="my-likes-view">
    <div class="page-header">
      <h2>我的点赞</h2>
    </div>

    <div class="content-area" v-loading="loading">
      <div v-if="list.length > 0" class="item-list">
        <div v-for="item in list" :key="item.id" class="list-card" @click="$router.push(`/article/${item.id}`)">
          <div class="card-info">
            <h3 class="card-title">{{ item.title }}</h3>
            <div class="card-meta">
              <el-tag size="small" class="cat-tag">{{ item.categoryName || '未分类' }}</el-tag>
              <span class="meta-dot">·</span>
              <span class="meta-text">{{ item.authorName || '未知作者' }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-text">{{ item.likeCount || 0 }} 人点赞</span>
              <span class="meta-dot">·</span>
              <span class="meta-time">点赞于 {{ formatTime(item.likedAt || item.createdAt) }}</span>
            </div>
          </div>
          <el-button type="danger" text size="small" @click.stop="handleUnlike(item)">
            取消点赞
          </el-button>
        </div>

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

      <el-empty v-else description="还没有点赞任何文章">
        <el-button type="primary" @click="$router.push('/articles')">浏览文章</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyLikes, toggleLike } from '../api/interaction'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const res = await getMyLikes({ page: currentPage.value, pageSize })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载点赞列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleUnlike(item) {
  try {
    await ElMessageBox.confirm('确定取消点赞这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res = await toggleLike(item.id)
    ElMessage.success(res.message || '已取消点赞')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') console.error('取消点赞失败:', err)
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.my-likes-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
    letter-spacing: -0.3px;
  }
}

.content-area {
  min-height: 300px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(45, 106, 79, 0.12);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    .card-title { color: #2d6a4f; }
  }
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.card-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #8e8ea0;
  flex-wrap: wrap;
  gap: 0;

  .meta-dot { margin: 0 8px; color: #d4d4dc; }
  .meta-time { color: #b8b8c8; }
}

.cat-tag {
  background: rgba(45, 106, 79, 0.06);
  border-color: rgba(45, 106, 79, 0.12);
  color: #2d6a4f;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
