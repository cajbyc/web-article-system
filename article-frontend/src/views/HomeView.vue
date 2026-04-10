<template>
  <div class="home-view">
    <!-- ========== Hero 横幅区 ========== -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>书写，是最好的思考方式</h1>
        <p>在这里记录学习、分享技术、交流思想</p>
        <div class="hero-btns">
          <button class="hero-btn primary" @click="$router.push('/articles')">
            浏览文章
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button v-if="!userStore.isLoggedIn" class="hero-btn ghost" @click="$router.push('/register')">
            加入我们
          </button>
          <button v-if="isEditor" class="hero-btn ghost" @click="$router.push('/article/create')">
            开始写作
          </button>
          <button v-if="isAdmin" class="hero-btn ghost" @click="$router.push('/admin/dashboard')">
            管理后台
          </button>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="deco-circle c1"></div>
        <div class="deco-circle c2"></div>
        <div class="deco-circle c3"></div>
      </div>
    </section>

    <!-- ========== 文章分类入口 ========== -->
    <section class="section">
      <div class="section-head">
        <h2>文章分类</h2>
        <div class="section-divider"></div>
      </div>
      <div class="category-grid">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          @click="$router.push(`/articles?categoryId=${cat.id}`)"
        >
          <span class="cat-icon">{{ catIcons[cat.name] || '📖' }}</span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ cat.articleCount || 0 }} 篇</span>
        </div>
      </div>
    </section>

    <!-- ========== 最新文章 ========== -->
    <section class="section">
      <div class="section-head">
        <h2>最新文章</h2>
        <div class="section-divider"></div>
        <router-link v-if="articles.length > 0" to="/articles" class="view-all">
          查看全部
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </router-link>
      </div>
      <div v-loading="loading" class="article-list">
        <div v-if="articles.length === 0 && !loading" class="empty-tip">
          <el-empty description="暂无文章，快来发布第一篇吧！" :image-size="80" />
        </div>
        <ArticleCard
          v-for="article in articles"
          :key="article.id"
          :article="article"
        />
      </div>
    </section>

    <!-- ========== 数据概览 ========== -->
    <section class="section">
      <div class="section-head">
        <h2>数据概览</h2>
        <div class="section-divider"></div>
      </div>
      <div class="stats-grid">
        <div class="stat-item" v-for="item in statItems" :key="item.label">
          <span class="stat-emoji">{{ item.emoji }}</span>
          <div class="stat-info">
            <span class="stat-num">{{ item.value }}</span>
            <span class="stat-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ArticleCard from '../components/ArticleCard.vue'
import { getArticleList, getCategories, getPublicStats } from '../api/article'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const isEditor = computed(() => {
  const role = userStore.userInfo?.role
  return role === 'admin' || role === 'editor' || role === 'author'
})
const isAdmin = computed(() => userStore.userInfo?.role === 'admin')

const catIcons = {
  '学习笔记': '📝',
  '课程报告': '📊',
  '技术分享': '💻',
  '校园随笔': '🏫',
  '学术交流': '🎓',
}

const articles = ref([])
const categories = ref([])
const stats = ref({ articleCount: 0, userCount: 0, commentCount: 0, likeCount: 0 })
const loading = ref(false)

const statItems = computed(() => [
  { emoji: '📄', label: '文章总数', value: stats.value.articleCount },
  { emoji: '👥', label: '注册用户', value: stats.value.userCount },
  { emoji: '💬', label: '评论总数', value: stats.value.commentCount },
  { emoji: '❤️', label: '点赞总数', value: stats.value.likeCount },
])

onMounted(async () => {
  loading.value = true
  try {
    const [articlesRes, catsRes, statsRes] = await Promise.allSettled([
      getArticleList({ page: 1, pageSize: 6 }),
      getCategories(),
      getPublicStats(),
    ])
    if (articlesRes.status === 'fulfilled') {
      articles.value = articlesRes.value.data?.list || []
    }
    if (catsRes.status === 'fulfilled') {
      categories.value = catsRes.value.data || []
    }
    if (statsRes.status === 'fulfilled') {
      stats.value = statsRes.value.data || stats.value
    }
  } catch (err) {
    console.error('首页数据加载失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.home-view {
  padding-top: 4px;
}

// ===== Hero =====
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d3a4a 50%, #2d4a3e 100%);
  border-radius: 14px;
  padding: 56px 48px;
  color: #fff;
  margin-bottom: 36px;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 36px 24px;
  }
}

.hero-content {
  position: relative;
  z-index: 2;

  h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
    line-height: 1.3;
  }

  p {
    font-size: 16px;
    opacity: 0.7;
    margin-bottom: 28px;
  }
}

.hero-btns {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &.primary {
    background: #74c69d;
    color: #1a1a2e;

    &:hover {
      background: #95d5b2;
      transform: translateY(-1px);
    }
  }

  &.ghost {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
}

.hero-decoration {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 50%;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(116, 198, 157, 0.15);

  &.c1 {
    width: 300px;
    height: 300px;
    top: -80px;
    right: -40px;
    background: radial-gradient(circle, rgba(116, 198, 157, 0.08) 0%, transparent 70%);
  }

  &.c2 {
    width: 180px;
    height: 180px;
    bottom: -40px;
    right: 120px;
    background: radial-gradient(circle, rgba(116, 198, 157, 0.06) 0%, transparent 70%);
  }

  &.c3 {
    width: 100px;
    height: 100px;
    top: 30px;
    right: 200px;
    border-color: rgba(255, 255, 255, 0.06);
    background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
  }
}

// ===== Section 通用 =====
.section {
  margin-bottom: 36px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.3px;
  }

  .view-all {
    margin-left: auto;
    font-size: 13px;
    color: #8e8ea0;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;

    &:hover {
      color: #2d6a4f;
    }
  }
}

.section-divider {
  width: 28px;
  height: 3px;
  background: #2d6a4f;
  border-radius: 2px;
  flex-shrink: 0;
}

// ===== 分类入口 =====
.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.category-item {
  background: #fff;
  border-radius: 10px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    border-color: rgba(45, 106, 79, 0.15);
  }

  .cat-icon {
    font-size: 28px;
    display: block;
    margin-bottom: 8px;
  }

  .cat-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  .cat-count {
    font-size: 12px;
    color: #8e8ea0;
  }
}

// ===== 文章列表 =====
.article-list {
  min-height: 100px;
}

// ===== 数据概览 =====
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  .stat-emoji {
    font-size: 28px;
  }

  .stat-num {
    display: block;
    font-size: 26px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.5px;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: #8e8ea0;
  }
}
</style>
