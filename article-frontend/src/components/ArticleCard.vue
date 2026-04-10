<template>
  <div class="article-card" @click="$router.push(`/article/${article.id}`)">
    <div class="card-cover" v-if="article.cover">
      <img :src="article.cover" alt="" />
    </div>
    <div class="card-body">
      <h3 class="title">{{ article.title }}</h3>
      <p class="summary">{{ article.content || article.summary || '' }}</p>
      <div class="meta">
        <span class="meta-item author">
          {{ article.authorName || article.author || '未知' }}
        </span>
        <span class="meta-dot" v-if="article.createdAt || article.date"></span>
        <span class="meta-item" v-if="article.createdAt || article.date">
          {{ formatDate(article.createdAt || article.date) }}
        </span>
        <span class="meta-dot" v-if="article.viewCount || article.views"></span>
        <span class="meta-item" v-if="article.viewCount || article.views">
          {{ article.viewCount || article.views }} 阅读
        </span>
        <el-tag size="small" v-if="article.categoryName || article.category" class="cat-tag">
          {{ article.categoryName || article.category }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
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
  background: #fff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
  cursor: pointer;
  display: flex;
  overflow: hidden;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
    border-color: rgba(45, 106, 79, 0.12);

    .title {
      color: #2d6a4f;
    }
  }
}

.card-cover {
  width: 200px;
  min-height: 140px;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .article-card:hover & img {
    transform: scale(1.05);
  }

  @media (max-width: 640px) {
    width: 120px;
    min-height: 100px;
  }
}

.card-body {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  line-height: 1.4;
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary {
  color: #4a4a68;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}

.meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #8e8ea0;
  gap: 0;
  flex-wrap: wrap;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #c8c8d4;
    margin: 0 8px;
  }

  .author {
    color: #2d6a4f;
    font-weight: 500;
  }

  .cat-tag {
    margin-left: auto;
    background: rgba(45, 106, 79, 0.06);
    border-color: rgba(45, 106, 79, 0.12);
    color: #2d6a4f;
  }
}
</style>
