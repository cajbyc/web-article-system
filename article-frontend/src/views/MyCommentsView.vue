<template>
  <div class="my-comments-view">
    <div class="page-header">
      <h2>我的评论</h2>
    </div>

    <div class="content-area" v-loading="loading">
      <div v-if="list.length > 0" class="comment-list">
        <div v-for="item in list" :key="item.id" class="comment-card">
          <div class="comment-header">
            <el-avatar :size="28">{{ (item.user?.nickname || item.user?.username || '?').charAt(0) }}</el-avatar>
            <span class="commenter-name">{{ item.user?.nickname || item.user?.username || '未知用户' }}</span>
          </div>
          <p class="comment-content">{{ item.content }}</p>
          <div class="comment-footer">
            <span class="article-link">评论于《<router-link :to="`/article/${item.article?.id}`">{{ item.article?.title || '未知文章' }}</router-link>》</span>
            <span class="comment-time">{{ formatTime(item.createdAt) }}</span>
            <el-button type="danger" text size="small" @click="handleDelete(item)">删除</el-button>
          </div>
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

      <el-empty v-else description="还没有发表过评论">
        <el-button type="primary" @click="$router.push('/articles')">浏览文章</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyComments, deleteComment as delComment } from '../api/interaction'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 10

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const res = await getMyComments({ page: currentPage.value, pageSize })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载评论列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function handleDelete(item) {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '提示', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await delComment(item.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') console.error('删除评论失败:', err)
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.my-comments-view {
  max-width: 800px;
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

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 16px 20px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .commenter-name {
    font-weight: 500;
    font-size: 14px;
    color: #2d6a4f;
  }
}

.comment-content {
  margin: 0 0 12px;
  line-height: 1.6;
  font-size: 14px;
  color: #1a1a2e;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #8e8ea0;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  padding-top: 10px;

  .article-link a {
    color: #2d6a4f;
    &:hover { text-decoration: underline; }
  }

  .comment-time { color: #b8b8c8; }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
