<template>
  <div class="article-list-view">
    <div class="list-header">
      <h2>文章列表</h2>
      <div class="header-actions">
        <el-button v-if="userStore.isLoggedIn" type="primary" @click="$router.push('/article/create')">
          <el-icon><EditPen /></el-icon> 新建文章
        </el-button>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="category-tabs">
      <el-radio-group v-model="categoryId" size="small" @change="fetchArticles">
        <el-radio-button :value="0">全部</el-radio-button>
        <el-radio-button v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</el-radio-button>
      </el-radio-group>
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
        date: article.createdAt,
        views: article.viewCount,
        category: article.categoryName || '',
        status: article.status,
      }"
    />

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

    <el-empty v-if="!loading && articles.length === 0" description="暂无文章数据" />
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
const page = ref(1)
const pageSize = 8
const total = ref(0)

onMounted(async () => {
  const res = await getCategories()
  categories.value = res.data
  fetchArticles()
})

// 监听路由 query 变化（Header 搜索框跳转触发）
watch(() => route.query.keyword, (val) => {
  keyword.value = val || ''
  page.value = 1
  fetchArticles()
})

function fetchArticles() {
  loading.value = true
  const params = { page: page.value, pageSize }
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
    align-items: center;
    margin-bottom: 16px;

    h2 { font-size: 22px; margin: 0; }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .category-tabs { margin-bottom: 20px; }
  .pagination-wrapper { display: flex; justify-content: center; padding: 30px 0; }
}
</style>
