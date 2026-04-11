<template>
  <AdminLayout>
    <div class="dashboard-view" v-loading="loading">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-icon-wrap" :style="{ background: stat.bgColor }">
            <el-icon :size="22" :style="{ color: stat.color }"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- 分类统计 -->
      <div class="chart-card">
        <div class="card-header">
          <h3>分类文章统计</h3>
        </div>
        <div class="bar-list" v-if="categoryData.length > 0">
          <div class="bar-item" v-for="cat in categoryData" :key="cat.name">
            <span class="bar-label">{{ cat.name }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: getBarWidth(cat.count) + '%' }"></div>
            </div>
            <span class="bar-value">{{ cat.count }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无数据" :image-size="60" />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { User, Document, ChatLineSquare, StarFilled, Collection } from '@element-plus/icons-vue'
import { getDashboardStats } from '../api/admin'
import AdminLayout from '../components/AdminLayout.vue'

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
    { label: '收藏总数', value: rawStats.value.collectCount || 0, icon: 'Collection', color: '#7c3aed', bgColor: 'rgba(124,58,237,0.08)' },
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
  max-width: 1000px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .stat-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
    color: #1a1a2e;
  }

  .stat-label {
    font-size: 12px;
    color: #8e8ea0;
    margin-top: 2px;
  }
}

.dashboard-grid {
  display: block;
}

.chart-card, .quick-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 20px;
}

.card-header {
  margin-bottom: 16px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
    height: 18px;
    background: rgba(45, 106, 79, 0.05);
    border-radius: 9px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #2d6a4f, #74c69d);
    border-radius: 9px;
    transition: width 0.6s ease;
    min-width: 4px;
  }

  .bar-value {
    width: 40px;
    font-size: 13px;
    color: #8e8ea0;
    font-weight: 500;
  }
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
