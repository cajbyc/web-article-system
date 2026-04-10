<template>
  <div class="article-card" @click="$router.push(`/article/${article.id}`)">
    <div class="card-cover" v-if="article.cover">
      <img :src="article.cover" alt="" @error="handleCoverError" />
    </div>
    <div class="card-body">
      <h3 class="title">{{ article.title }}</h3>
      <p class="summary">{{ displaySummary }}</p>
      <div class="meta">
        <span class="meta-item author" @click.stop="article.userId && $router.push(`/user/${article.userId}`)">
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
import { computed } from 'vue'

const props = defineProps({
  article: { type: Object, required: true },
})

const displaySummary = computed(() => {
  if (props.article.summary) return props.article.summary
  if (!props.article.content) return ''
  // 去除 Markdown 标记，截取前 120 字符作为摘要
  return props.article.content
    .replace(/!\[.*?\]\(.*?\)/g, '')   // 移除图片
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // 链接只保留文字
    .replace(/#{1,6}\s/g, '')          // 移除标题标记
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2') // 移除加粗/斜体
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // 移除行内代码
    .replace(/>\s/g, '')               // 移除引用标记
    .replace(/[-*+]\s/g, '')           // 移除列表标记
    .replace(/\n+/g, ' ')             // 换行转空格
    .slice(0, 120)
})

function formatDate(timeStr) {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function handleCoverError(e) {
  e.target.style.display = 'none'
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
    box-shadow: 0 8px 24px rgba(45, 106, 79, 0.08);
    border-color: rgba(45, 106, 79, 0.12);

    .title {
      transform: scale(1.03);
    }

    .card-cover img {
      transform: scale(1.05);
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
    transition: transform 0.35s ease;
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
  font-size: 17px;
  font-weight: 600;
  color: #2d6a4f;
  margin-bottom: 8px;
  line-height: 1.4;
  transition: transform 0.2s ease, color 0.2s;
  transform-origin: left center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary {
  color: #555;
  font-size: 14px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; /* stylelint-disable-line -- 标准属性，浏览器支持有限 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 10px;
}

.meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
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
    background: #ccc;
    margin: 0 8px;
  }

  .author {
    color: #2d6a4f;
    font-weight: 500;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }

  .cat-tag {
    margin-left: auto;
    background: rgba(45, 106, 79, 0.06);
    border-color: rgba(45, 106, 79, 0.12);
    color: #2d6a4f;
  }
}
</style>
