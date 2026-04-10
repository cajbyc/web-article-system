<template>
  <div class="dashboard-view">
    <button class="back-btn" @click="$router.push('/')">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      返回首页
    </button>

    <h1 class="page-title">数据看板</h1>

    <div class="stats-grid" v-loading="loading">
      <div class="stat-card" v-for="(stat, index) in stats" :key="index">
        <div class="stat-icon" :style="{ background: stat.bgColor, color: stat.color }">
          <el-icon :size="24"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <!-- 分类统计 -->
      <div class="chart-card">
        <h3>分类文章统计</h3>
        <div class="bar-list" v-if="categoryData.length > 0">
          <div class="bar-item" v-for="cat in categoryData" :key="cat.name">
            <span class="bar-label">{{ cat.name }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: getBarWidth(cat.count) + '%' }"></div>
            </div>
            <span class="bar-value">{{ cat.count }} 篇</span>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="60" />
      </div>

      <!-- 快捷操作 -->
      <div class="quick-card">
        <h3>快捷操作</h3>
        <div class="action-buttons">
          <button class="quick-btn" @click="$router.push('/admin/users')">
            <span class="qb-icon">👥</span>
            <span>用户管理</span>
          </button>
          <button class="quick-btn" @click="$router.push('/admin/articles')">
            <span class="qb-icon">📄</span>
            <span>文章管理</span>
          </button>
          <button class="quick-btn" @click="$router.push('/admin/comments')">
            <span class="qb-icon">💬</span>
            <span>评论管理</span>
          </button>
          <button class="quick-btn" @click="$router.push('/admin/logs')">
            <span class="qb-icon">📋</span>
            <span>操作日志</span>
          </button>
          <button class="quick-btn" @click="$router.push('/admin/categories')">
            <span class="qb-icon">📂</span>
            <span>分类管理</span>
          </button>
          <button class="quick-btn" @click="$router.push('/admin/applications')">
            <span class="qb-icon">✅</span>
            <span>角色审批</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { User, Document, ChatLineSquare, StarFilled, Collection } from '@element-plus/icons-vue'
import { getDashboardStats } from '../api/admin'

const loading = ref(false)
const rawStats = ref(null)
const categoryData = ref([])

onMounted(fetchStats)

async function fetchStats() {
  loading.value = true
  try {
    const res = await getDashboardStats()
    rawStats.value = res.data
    categoryData.value = res.data.categoryData || []
  } catch (err) {
    console.error('加载统计数据失败:', err)
  } finally {
    loading.value = false
  }
}

const stats = computed(() => {
  if (!rawStats.value) return []
  return [
    { label: '用户总数', value: rawStats.value.userCount || 0, icon: 'User', color: '#2d6a4f', bgColor: 'rgba(45,106,79,0.08)' },
    { label: '文章总数', value: rawStats.value.articleCount || 0, icon: 'Document', color: '#1a6b54', bgColor: 'rgba(26,107,84,0.08)' },
    { label: '评论总数', value: rawStats.value.commentCount || 0, icon: 'ChatLineSquare', color: '#b45309', bgColor: 'rgba(180,83,9,0.08)' },
    { label: '点赞总数', value: rawStats.value.likeCount || 0, icon: 'StarFilled', color: '#dc2626', bgColor: 'rgba(220,38,38,0.08)' },
    { label: '收藏总数', value: rawStats.value.collectCount || 0, icon: 'Collection', color: '#6b7280', bgColor: 'rgba(107,114,128,0.08)' },
  ]
})

function getBarWidth(count) {
  if (categoryData.value.length === 0) return 0
  const max = Math.max(...categoryData.value.map(c => c.count), 1)
  return Math.round((count / max) * 100)
}
</script>

<style lang="scss" scoped>
.dashboard-view {
  max-width: 1100px;
  margin: 0 auto;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #8e8ea0;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 8px;
  transition: color 0.2s;

  &:hover { color: #2d6a4f; }
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 20px;
  letter-spacing: -0.3px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    color: #1a1a2e;
  }

  .stat-label {
    font-size: 13px;
    color: #8e8ea0;
    margin-top: 2px;
  }
}

.chart-card, .quick-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 20px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 16px;
  }
}

.chart-card {
  grid-column: span 2;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 10px;

  .bar-label {
    width: 72px;
    text-align: right;
    font-size: 13px;
    color: #4a4a68;
    flex-shrink: 0;
  }

  .bar-track {
    flex: 1;
    height: 16px;
    background: rgba(45, 106, 79, 0.06);
    border-radius: 8px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #2d6a4f, #74c69d);
    border-radius: 8px;
    transition: width 0.6s ease;
    min-width: 2px;
  }

  .bar-value {
    width: 50px;
    font-size: 13px;
    color: #8e8ea0;
  }
}

.quick-card {
  grid-column: span 1;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(45, 106, 79, 0.02);
  cursor: pointer;
  font-size: 13px;
  color: #4a4a68;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(45, 106, 79, 0.15);
    background: rgba(45, 106, 79, 0.05);
    color: #2d6a4f;
  }

  .qb-icon {
    font-size: 18px;
  }
}
</style>
