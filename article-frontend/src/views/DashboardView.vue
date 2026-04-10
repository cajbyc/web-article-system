<template>
  <div class="dashboard-view">
    <el-page-header @back="$router.push('/')" title="返回首页">
      <template #content><span class="page-title">数据看板</span></template>
    </el-page-header>

    <div class="stats-grid" v-loading="loading">
      <!-- 统计卡片 -->
      <div class="stat-card" v-for="(stat, index) in stats" :key="index" :style="{ '--accent': stat.color }">
        <div class="stat-icon"><el-icon :size="36"><component :is="stat.icon" /></el-icon></div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <!-- 分类文章统计 -->
      <el-card class="category-chart" shadow="never">
        <template #header><span>分类文章统计</span></template>
        <div v-if="categoryData.length > 0" class="chart-body">
          <div class="bar-list">
            <div class="bar-item" v-for="cat in categoryData" :key="cat.name">
              <span class="bar-label">{{ cat.name }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: getBarWidth(cat.count) + '%' }"></div>
              </div>
              <span class="bar-value">{{ cat.count }} 篇</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 快捷操作 -->
      <el-card class="quick-actions" shadow="never">
        <template #header><span>快捷操作</span></template>
        <div class="action-buttons">
          <el-button type="primary" @click="$router.push('/admin/users')">
            <el-icon><User /></el-icon> 用户管理
          </el-button>
          <el-button type="success" @click="$router.push('/admin/articles')">
            <el-icon><Document /></el-icon> 文章管理
          </el-button>
          <el-button type="warning" @click="$router.push('/admin/comments')">
            <el-icon><ChatDotRound /></el-icon> 评论管理
          </el-button>
          <el-button type="info" @click="$router.push('/admin/logs')">
            <el-icon><Tickets /></el-icon> 操作日志
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { User, Document, ChatDotRound, Tickets, TrendCharts, Collection, ChatLineSquare, StarFilled } from '@element-plus/icons-vue'
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
    { label: '用户总数', value: rawStats.value.userCount || 0, icon: 'User', color: '#409eff' },
    { label: '文章总数', value: rawStats.value.articleCount || 0, icon: 'Document', color: '#67c23a' },
    { label: '评论总数', value: rawStats.value.commentCount || 0, icon: 'ChatLineSquare', color: '#e6a23c' },
    { label: '点赞总数', value: rawStats.value.likeCount || 0, icon: 'StarFilled', color: '#f56c6c' },
    { label: '收藏总数', value: rawStats.value.collectCount || 0, icon: 'Collection', color: '#909399' },
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
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.stats-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
    flex-shrink: 0;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    color: #303133;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

.category-chart {
  grid-column: span 2;

  .chart-body {
    min-height: 200px;
  }
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;

  .bar-label {
    width: 80px;
    text-align: right;
    font-size: 13px;
    color: #606266;
    flex-shrink: 0;
  }

  .bar-track {
    flex: 1;
    height: 20px;
    background: #f5f7fa;
    border-radius: 10px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    border-radius: 10px;
    transition: width 0.6s ease;
    min-width: 2px;
  }

  .bar-value {
    width: 50px;
    font-size: 13px;
    color: #909399;
    text-align: left;
  }
}

.quick-actions {
  grid-column: span 1;

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
