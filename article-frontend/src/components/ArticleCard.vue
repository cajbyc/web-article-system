<template>
  <el-card shadow="hover" class="article-card" @click="$router.push(`/article/${article.id}`)">
    <div class="card-body">
      <h3 class="title">{{ article.title }}</h3>
      <p class="summary">{{ article.summary }}</p>
      <div class="meta">
        <span><el-icon><User /></el-icon> {{ article.author }}</span>
        <span><el-icon><Calendar /></el-icon> {{ article.date }}</span>
        <span><el-icon><View /></el-icon> {{ article.views }}</span>
        <el-tag size="small" type="info" v-if="article.category">{{ categoryLabel }}</el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { User, Calendar, View } from '@element-plus/icons-vue'

const props = defineProps({
  article: { type: Object, required: true },
})

const categoryMap = {
  tech: '技术',
  life: '生活',
  study: '学习',
}

const categoryLabel = computed(() => categoryMap[props.article.category] || props.article.category)
</script>

<style lang="scss" scoped>
.article-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  .card-body {
    .title {
      font-size: 17px;
      color: #303133;
      margin-bottom: 8px;

      &:hover {
        color: #409eff;
      }
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
      gap: 16px;
      font-size: 13px;
      color: #909399;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}
</style>
