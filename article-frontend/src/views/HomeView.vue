<template>
  <div class="home-view">
    <!-- ========== Banner 横幅区 ========== -->
    <div class="hero-section">
      <h1>欢迎使用多角色文章管理系统</h1>
      <p>支持文章创作、互动交流、权限管控，公网可访问</p>
      <div class="hero-btns">
        <el-button type="primary" size="large" @click="$router.push('/articles')">
          立即浏览
        </el-button>
        <el-button v-if="!userStore.isLoggedIn" size="large" @click="$router.push('/register')">
          立即注册
        </el-button>
        <el-button v-if="isEditor" type="warning" size="large" @click="$router.push('/article/create')">
          发布文章
        </el-button>
        <el-button v-if="isAdmin" type="danger" size="large" @click="$router.push('/admin/dashboard')">
          管理后台
        </el-button>
      </div>
    </div>

    <!-- ========== 文章分类入口 ========== -->
    <div class="section-title">文章分类</div>
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

    <!-- ========== 文章卡片列表 ========== -->
    <div class="section-title">最新文章</div>
    <div v-loading="loading" class="article-list">
      <div v-if="articles.length === 0 && !loading" class="empty-tip">
        <el-empty description="暂无文章，快来发布第一篇吧！" :image-size="80" />
      </div>
      <ArticleCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
      />
      <div class="more-btn" v-if="articles.length > 0">
        <el-button type="primary" text @click="$router.push('/articles')">
          查看更多文章 →
        </el-button>
      </div>
    </div>

    <!-- ========== 公开数据概览 ========== -->
    <div class="section-title">数据概览</div>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-num">{{ stats.articleCount }}</span>
        <span class="stat-label">文章总数</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.userCount }}</span>
        <span class="stat-label">注册用户</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.commentCount }}</span>
        <span class="stat-label">评论总数</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.likeCount }}</span>
        <span class="stat-label">点赞总数</span>
      </div>
    </div>
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
  padding-top: 10px;
}

// ===== Banner 横幅区 =====
.hero-section {
  background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
  border-radius: 12px;
  padding: 48px 40px;
  color: #fff;
  margin-bottom: 28px;

  h1 {
    font-size: 28px;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 24px;
  }

  .hero-btns {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin: 24px 0 14px;
  padding-left: 10px;
  border-left: 4px solid #1677ff;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  .cat-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 8px;
  }

  .cat-name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }

  .cat-count {
    font-size: 13px;
    color: #909399;
  }
}

// ===== 文章列表 =====
.article-list {
  min-height: 100px;
}

.more-btn {
  text-align: center;
  padding: 16px 0;
}

// ===== 数据概览 =====
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  background: #fff;
  border-radius: 10px;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .stat-num {
    display: block;
    font-size: 32px;
    font-weight: bold;
    color: #1677ff;
    margin-bottom: 6px;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}
</style>
