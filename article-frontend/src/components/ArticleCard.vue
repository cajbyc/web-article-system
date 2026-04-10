<template>
  <el-card shadow="hover" class="article-card" @click="$router.push(`/article/${article.id}`)">
    <div class="card-body">
      <div class="card-top" v-if="article.cover">
        <img :src="article.cover" class="cover" alt="" />
      </div>
      <h3 class="title">{{ article.title }}</h3>
      <p class="summary">{{ article.content || article.summary || '' }}</p>
      <div class="meta">
        <span><el-icon><User /></el-icon> {{ article.authorName || article.author || '未知' }}</span>
        <span><el-icon><Clock /></el-icon> {{ formatDate(article.createdAt || article.date) }}</span>
        <span><el-icon><View /></el-icon> {{ article.viewCount || article.views || 0 }}</span>
        <span v-if="article.likeCount"><el-icon><Star /></el-icon> {{ article.likeCount }}</span>
        <el-tag size="small" type="info" v-if="article.categoryName || article.category">
          {{ article.categoryName || article.category }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { User, Clock, View, Star } from '@element-plus/icons-vue'

defineProps({
  article: { type: Object, required: true },
})

function formatDate(timeStr) {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.article-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  .card-top {
    margin: -20px -20px 12px;
    overflow: hidden;
    border-radius: 4px 4px 0 0;

    .cover {
      width: 100%;
      height: 180px;
      object-fit: cover;
    }
  }

  .card-body {
    .title {
      font-size: 17px;
      color: #303133;
      margin-bottom: 8px;
      line-height: 1.4;

      &:hover { color: #409eff; }
    }

    .summary {
      color: #606266;
      font-size: 14px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 13px;
      color: #909399;
      flex-wrap: wrap;

      span {
        display: flex;
        align-items: center;
        gap: 3px;
      }
    }
  }
}
</style>
