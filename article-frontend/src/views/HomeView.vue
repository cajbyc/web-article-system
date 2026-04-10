<template>
  <div class="home-view">
    <el-row :gutter="20">
      <el-col :span="16" :xs="24">
        <div class="hero-section">
          <h1>欢迎来到多角色文章管理系统</h1>
          <p>一个功能完善的毕业设计项目，支持多角色管理、文章发布与审核等功能。</p>
          <el-button type="primary" size="large" @click="$router.push('/articles')">
            浏览文章
          </el-button>
        </div>

        <div class="section-title">最新文章</div>
        <ArticleCard
          v-for="article in latestArticles"
          :key="article.id"
          :article="article"
        />
      </el-col>

      <el-col :span="8" :xs="24">
        <div class="sidebar">
          <div class="sidebar-card">
            <h3><el-icon><DataLine /></el-icon> 系统公告</h3>
            <ul>
              <li v-for="(notice, i) in notices" :key="i">{{ notice }}</li>
            </ul>
          </div>
          <div class="sidebar-card">
            <h3><el-icon><TrendCharts /></el-icon> 热门文章</h3>
            <ol class="hot-list">
              <li v-for="(item, i) in hotArticles" :key="i" @click="$router.push(`/article/${item.id}`)">
                {{ item.title }}
              </li>
            </ol>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { DataLine, TrendCharts } from '@element-plus/icons-vue'
import ArticleCard from '../components/ArticleCard.vue'

const latestArticles = ref([
  { id: 1, title: 'Vue3 组合式 API 完全指南', summary: '深入理解 Vue3 的 Composition API，掌握现代 Vue 开发方式...', author: '管理员', date: '2026-04-08', views: 128 },
  { id: 2, title: 'Pinia 状态管理最佳实践', summary: 'Pinia 是 Vue3 官方推荐的状态管理库，本文介绍其核心用法...', author: '编辑', date: '2026-04-07', views: 96 },
  { id: 3, title: 'Element Plus 组件库使用技巧', summary: '汇总 Element Plus 中常用组件的使用技巧和注意事项...', author: '作者', date: '2026-04-06', views: 74 },
])

const notices = ref([
  '系统已升级至 V2.0 版本',
  '新增文章审核流程',
  '支持 Markdown 编辑器',
])

const hotArticles = ref([
  { id: 1, title: 'Vue3 组合式 API 完全指南' },
  { id: 4, title: '前端工程化实践总结' },
  { id: 2, title: 'Pinia 状态管理最佳实践' },
])
</script>

<style lang="scss" scoped>
.home-view {
  padding-top: 10px;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 48px 40px;
  color: #fff;
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    margin-bottom: 12px;
  }
  p {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 24px;
  }
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin: 20px 0 14px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}

.sidebar-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 16px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  ul, ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 8px 0;
    font-size: 14px;
    color: #606266;
    cursor: pointer;

    &:hover {
      color: #409eff;
    }
  }
}

.hot-list {
  counter-reset: hot-counter;

  li {
    &::before {
      counter-increment: hot-counter;
      content: counter(hot-counter) '. ';
      color: #409eff;
      font-weight: bold;
      margin-right: 4px;
    }
  }
}
</style>
