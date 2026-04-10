<template>
  <div class="article-detail-view" v-if="article">
    <el-page-header @back="$router.push('/articles')" title="返回列表">
      <template #content>
        <span class="page-title">{{ article.title }}</span>
        <el-tag v-if="article.status !== 'published'" :type="statusType(article.status)" size="small" style="margin-left: 8px;">
          {{ statusLabel(article.status) }}
        </el-tag>
      </template>
    </el-page-header>

    <div class="article-meta">
      <el-avatar :size="32">{{ (article.authorName || article.author || '?').charAt(0) }}</el-avatar>
      <span class="author">{{ article.authorName || article.author }}</span>
      <el-divider direction="vertical" />
      <el-tag size="small" type="info">{{ article.categoryName || '未分类' }}</el-tag>
      <el-divider direction="vertical" />
      <span class="date"><el-icon><Clock /></el-icon> {{ formatTime(article.createdAt) }}</span>
      <el-divider direction="vertical" />
      <span class="views"><el-icon><View /></el-icon> {{ article.viewCount }} 次阅读</span>
    </div>

    <!-- 封面图 -->
    <img v-if="article.cover" :src="article.cover" class="cover-image" alt="" />

    <el-divider />

    <article class="article-content" v-html="formatContent(article.content)"></article>

    <!-- 点赞 / 收藏 操作栏 -->
    <div class="interaction-bar">
      <div class="action-btns">
        <!-- 点赞 -->
        <div
          class="action-item"
          :class="{ active: isLiked }"
          @click="handleToggleLike"
        >
          <el-icon :size="20"><HeartFilled v-if="isLiked" /><Heart v-else /></el-icon>
          <span>{{ isLiked ? '已赞' : '点赞' }}</span>
          <span class="count">{{ likeCount }}</span>
        </div>

        <!-- 收藏 -->
        <div
          class="action-item"
          :class="{ active: isCollected }"
          @click="handleToggleCollect"
        >
          <el-icon :size="20"><StarFilled v-if="isCollected" /><Star v-else /></el-icon>
          <span>{{ isCollected ? '已收藏' : '收藏' }}</span>
          <span class="count">{{ collectCount }}</span>
        </div>
      </div>
    </div>

    <!-- 评论区域 -->
    <div id="comments" class="comments-section">
      <h3 class="section-title">评论（{{ commentTotal }}）</h3>

      <!-- 评论输入框 -->
      <div class="comment-input-area" v-if="userStore.isLoggedIn">
        <el-input
          v-model="commentText"
          type="textarea"
          :rows="3"
          placeholder="写下你的想法..."
          maxlength="500"
          show-word-limit
        />
        <div class="input-actions">
          <el-button type="primary" :loading="submitting" :disabled="!commentText.trim()" @click="handleSubmitComment">
            发表评论
          </el-button>
        </div>
      </div>
      <div v-else class="login-prompt">
        <p>登录后即可参与评论</p>
        <el-button type="primary" size="small" @click="$router.push(`/login?redirect=${$route.fullPath}`)">去登录</el-button>
      </div>

      <!-- 评论列表 -->
      <div class="comment-list" v-loading="commentLoading">
        <div v-if="commentList.length === 0 && !commentLoading" class="no-comment">
          <el-empty description="暂无评论，快来抢沙发吧！" :image-size="80" />
        </div>
        <div v-for="comment in commentList" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <el-avatar :size="36" :src="comment.user?.avatar">
              {{ (comment.user?.nickname || comment.user?.username || '?').charAt(0) }}
            </el-avatar>
            <div class="user-info">
              <span class="nickname">{{ comment.user?.nickname || comment.user?.username || '匿名用户' }}</span>
              <span class="time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            <el-button
              v-if="canDelete(comment)"
              type="danger"
              text
              size="small"
              @click="handleDeleteComment(comment)"
            >删除</el-button>
          </div>
          <p class="comment-body">{{ comment.content }}</p>
        </div>

        <!-- 分页 -->
        <div class="comment-pagination" v-if="commentTotal > commentPageSize">
          <el-pagination
            v-model:current-page="commentPage"
            :page-size="commentPageSize"
            :total="commentTotal"
            layout="prev, pager, next"
            small
            @current-change="fetchComments"
          />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="loading-wrapper">
    <el-empty description="文章不存在或已删除">
      <el-button type="primary" @click="$router.push('/articles')">返回文章列表</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  Clock, View, HeartFilled, Heart, StarFilled, Star,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getArticleDetail } from '../api/article'
import {
  toggleLike as apiToggleLike,
  toggleCollect as apiToggleCollect,
  getComments as apiGetComments,
  createComment as apiCreateComment,
  deleteComment as apiDeleteComment,
} from '../api/interaction'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()
const article = ref(null)

// ====== 点赞/收藏状态 ======
const isLiked = ref(false)
const isCollected = ref(false)
const likeCount = ref(0)
const collectCount = ref(0)

// ====== 评论 ======
const commentList = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)
const commentPageSize = 10
const commentLoading = ref(false)
const submitting = ref(false)
const commentText = ref('')

onMounted(async () => {
  await fetchArticleDetail()
  fetchComments()
})

async function fetchArticleDetail() {
  try {
    const res = await getArticleDetail(route.params.id)
    article.value = res.data
    isLiked.value = !!res.data.isLiked
    isCollected.value = !!res.data.isCollected
    likeCount.value = res.data.likeCount || 0
    collectCount.value = res.data.collectCount || 0
  } catch (err) {
    console.error('加载文章失败:', err)
  }
}

// ---- 点赞操作 ----
async function handleToggleLike() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再点赞')
    return
  }
  try {
    const res = await apiToggleLike(article.value.id)
    isLiked.value = res.data.liked
    likeCount.value = res.data.likeCount
    ElMessage.success(res.message)
  } catch (err) {
    console.error('点赞失败:', err)
  }
}

// ---- 收藏操作 ----
async function handleToggleCollect() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再收藏')
    return
  }
  try {
    const res = await apiToggleCollect(article.value.id)
    isCollected.value = res.data.collected
    collectCount.value = res.data.collectCount
    ElMessage.success(res.message)
  } catch (err) {
    console.error('收藏失败:', err)
  }
}

// ---- 获取评论列表 ----
async function fetchComments() {
  commentLoading.value = true
  try {
    const res = await apiGetComments({
      articleId: route.params.id,
      page: commentPage.value,
      pageSize: commentPageSize,
    })
    commentList.value = res.data.list || []
    commentTotal.value = res.data.total || 0
  } catch (err) {
    console.error('获取评论失败:', err)
  } finally {
    commentLoading.value = false
  }
}

// ---- 发表评论 ----
async function handleSubmitComment() {
  if (!commentText.value.trim()) return

  submitting.value = true
  try {
    await apiCreateComment({
      articleId: parseInt(route.params.id),
      content: commentText.value.trim(),
    })
    ElMessage.success('评论成功')
    commentText.value = ''
    // 回到第一页查看最新评论
    commentPage.value = 1
    fetchComments()
  } catch (err) {
    console.error('发表评论失败:', err)
  } finally {
    submitting.value = false
  }
}

// ---- 删除评论 ----
function canDelete(comment) {
  if (!userStore.isLoggedIn) return false
  if (userStore.userInfo.role === 'admin') return true
  return comment.user?.id === userStore.userInfo.id
}

async function handleDeleteComment(comment) {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await apiDeleteComment(comment.id)
    ElMessage.success('删除成功')
    fetchComments()
  } catch (err) {
    if (err !== 'cancel') console.error('删除评论失败:', err)
  }
}

function formatContent(content) {
  if (!content) return ''
  return content.replace(/\n/g, '<br/>')
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

function statusType(status) {
  const map = { draft: 'info', published: 'success', private: 'warning' }
  return map[status] || ''
}

function statusLabel(status) {
  const map = { draft: '草稿', published: '已发布', private: '私密' }
  return map[status] || status
}
</script>

<style lang="scss" scoped>
.article-detail-view .page-title {
  font-size: 18px;
  font-weight: bold;
}

.article-meta {
  display: flex;
  align-items: center;
  margin-top: 16px;
  color: #909399;
  font-size: 14px;

  .author { margin-left: 8px; color: #409eff; }
  .date, .views { display: flex; align-items: center; gap: 4px; }
}

.cover-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 16px;
}

.article-content {
  line-height: 1.8;
  font-size: 15px;
  padding: 20px 0;
}

// ====== 互动操作栏 ======
.interaction-bar {
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  margin-top: 24px;
}

.action-btns {
  display: flex;
  gap: 32px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  transition: all 0.2s;

  &:hover { color: #f56c6c; }

  &.active {
    color: #f56c6c;

    .count { font-weight: 600; }
  }

  .count {
    font-size: 13px;
    margin-left: 2px;
  }
}

// ====== 评论区域 ======
.comments-section {
  margin-top: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
}

.comment-input-area {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;

  .input-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fafbfc;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #909399;
}

.comment-list {
  min-height: 60px;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child { border-bottom: none; }
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .user-info {
    display: flex;
    flex-direction: column;
    flex: 1;

    .nickname {
      font-size: 14px;
      font-weight: 500;
      color: #409eff;
    }

    .time {
      font-size: 12px;
      color: #c0c4cc;
      margin-top: 2px;
    }
  }
}

.comment-body {
  margin: 8px 0 0 46px;
  line-height: 1.7;
  font-size: 14px;
  color: #303133;
}

.no-comment {
  text-align: center;
  padding: 30px 0;
}

.comment-pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 80px;
}
</style>
