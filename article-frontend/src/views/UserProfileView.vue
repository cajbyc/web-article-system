<template>
  <div class="user-profile-view">
    <div class="profile-card" v-if="profile">
      <div class="profile-hero">
        <el-avatar :size="64" class="profile-avatar">
          {{ profile.nickname?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase() || 'U' }}
        </el-avatar>
        <div class="profile-brief">
          <h2>{{ profile.nickname || profile.username }}</h2>
          <div class="profile-meta">
            <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
            <span class="meta-item">{{ profile.articleCount }} 篇文章</span>
            <span class="meta-item">加入于 {{ formatDate(profile.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="section-head">
      <h2>{{ profile?.nickname || profile?.username || '用户' }}的文章</h2>
      <div class="section-divider"></div>
    </div>

    <div v-loading="loading">
      <ArticleCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
      />
      <el-empty v-if="!loading && articles.length === 0" description="暂无公开文章" />
    </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ArticleCard from '../components/ArticleCard.vue'
import { getUserProfile, getUserArticles } from '../api/article'

const route = useRoute()
const profile = ref(null)
const articles = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)

const ROLE_LABEL_MAP = { admin: '管理员', editor: '编辑', author: '作者', user: '普通用户' }
const ROLE_TAG_TYPE_MAP = { admin: 'danger', editor: 'warning', author: '', user: 'info' }

const roleLabel = computed(() => ROLE_LABEL_MAP[profile.value?.role] || '普通用户')
const roleTagType = computed(() => ROLE_TAG_TYPE_MAP[profile.value?.role] || 'info')

function formatDate(timeStr) {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchData() {
  const userId = parseInt(route.params.id)
  try {
    const res = await getUserProfile(userId)
    profile.value = res.data
  } catch (err) {
    console.error('获取用户资料失败:', err)
  }
  fetchArticles()
}

async function fetchArticles() {
  loading.value = true
  try {
    const userId = parseInt(route.params.id)
    const res = await getUserArticles(userId, { page: page.value, pageSize })
    articles.value = (res.data.list || []).map(a => ({
      id: a.id,
      title: a.title,
      content: (a.content || '').slice(0, 120) + '...',
      authorName: profile.value?.nickname || profile.value?.username,
      createdAt: a.createdAt,
      viewCount: a.viewCount,
      categoryName: a.category?.name || a.categoryName || '未分类',
    }))
    total.value = res.data.total
  } catch (err) {
    console.error('获取用户文章失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
watch(() => route.params.id, () => { page.value = 1; fetchData() })
</script>

<style lang="scss" scoped>
.user-profile-view {
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  margin-bottom: 28px;
}

.profile-hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d4a3e 100%);
  padding: 32px 28px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  border: 3px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  font-size: 24px;
  color: #fff;
}

.profile-brief {
  h2 {
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 6px;
  }
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 10px;

  .meta-item {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
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
}

.section-divider {
  width: 28px;
  height: 3px;
  background: #2d6a4f;
  border-radius: 2px;
  flex-shrink: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}
</style>
