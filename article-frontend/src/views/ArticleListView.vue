<template>
  <div class="article-list-view">
    <div class="list-header">
      <div>
        <h2>文章</h2>
        <p class="subtitle" v-if="keyword">搜索：{{ keyword }}</p>
      </div>
      <div class="header-actions">
        <el-button v-if="userStore.isLoggedIn" type="primary" @click="$router.push('/article/create')">
          <el-icon><EditPen /></el-icon> 写文章
        </el-button>
      </div>
    </div>

    <!-- 分类筛选 + 排序 -->
    <div class="filter-bar">
      <el-radio-group v-model="categoryId" size="small" @change="handleFilterChange">
        <el-radio-button :value="0">全部</el-radio-button>
        <el-radio-button v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</el-radio-button>
      </el-radio-group>

      <div class="sort-group">
        <span class="sort-label">排序：</span>
        <el-radio-group v-model="sortBy" size="small" @change="handleFilterChange">
          <el-radio-button value="newest">最新</el-radio-button>
          <el-radio-button value="views">最多阅读</el-radio-button>
          <el-radio-button value="likes">最多点赞</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 文章列表 -->
    <ArticleCard
      v-for="article in articles"
      :key="article.id"
      :article="{
        id: article.id,
        title: article.title,
        summary: (article.content || '').slice(0, 120) + '...',
        author: article.authorName || '未知',
        userId: article.userId,
        date: article.createdAt,
        views: article.viewCount,
        category: article.categoryName || '',
        status: article.status,
        cover: article.cover,
      }"
    />

    <el-empty v-if="!loading && articles.length === 0" description="暂无文章" />

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > pageSize">
      <el-pagination
        background
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="(p) => { page = p; fetchArticles() }"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { EditPen } from '@element-plus/icons-vue'
import ArticleCard from '../components/ArticleCard.vue'
import { getArticleList, getCategories } from '../api/article'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const articles = ref([])
const categories = ref([])
const keyword = ref(route.query.keyword || '')
const categoryId = ref(0)
const sortBy = ref('newest')
const page = ref(1)
const pageSize = 8
const total = ref(0)

onMounted(async () => {
  const res = await getCategories()
  categories.value = res.data
  fetchArticles()
})

watch(() => route.query.keyword, (val) => {
  keyword.value = val || ''
  page.value = 1
  fetchArticles()
})

function handleFilterChange() {
  page.value = 1
  fetchArticles()
}

function fetchArticles() {
  loading.value = true
  const params = { page: page.value, pageSize, sort: sortBy.value }
  if (categoryId.value) params.categoryId = categoryId.value
  if (keyword.value) params.keyword = keyword.value

  getArticleList(params).then(res => {
    articles.value = res.data.list
    total.value = res.data.total
  }).catch(() => {}).finally(() => { loading.value = false })
}
</script>

<style lang="scss" scoped>
.article-list-view {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
      letter-spacing: -0.3px;
    }

    .subtitle {
      font-size: 14px;
      color: #8e8ea0;
      margin-top: 4px;
    }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .sort-group {
    display: flex;
    align-items: center;
    gap: 8px;

    .sort-label {
      font-size: 13px;
      color: #8e8ea0;
      white-space: nowrap;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    padding: 30px 0;
  }
}
</style>
