<template>
  <div class="article-detail-view" v-if="article">
    <!-- 返回导航 -->
    <button class="back-btn" @click="$router.push('/articles')">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      返回列表
    </button>

    <!-- 文章标题区 -->
    <div class="article-header">
      <h1 class="article-title">{{ article.title }}</h1>
      <el-tag v-if="article.status !== 'published'" :type="statusType(article.status)" size="small" style="margin-left: 8px; vertical-align: middle;">
        {{ statusLabel(article.status) }}
      </el-tag>
      <div class="article-meta">
        <div class="meta-author">
          <el-avatar :size="28">{{ (article.authorName || article.author || '?').charAt(0) }}</el-avatar>
          <span class="author-name">{{ article.authorName || article.author }}</span>
        </div>
        <span class="meta-divider">·</span>
        <el-tag size="small" class="cat-tag">{{ article.categoryName || '未分类' }}</el-tag>
        <span class="meta-divider">·</span>
        <span class="meta-text">{{ formatTime(article.createdAt) }}</span>
        <span class="meta-divider">·</span>
        <span class="meta-text">{{ article.viewCount }} 阅读</span>
      </div>
    </div>

    <!-- 封面图 -->
    <img v-if="article.cover" :src="article.cover" class="cover-image" alt="" />

    <!-- 文章正文 -->
    <article class="article-content" v-html="formatContent(article.content)"></article>

    <!-- 互动操作栏 -->
    <div class="interaction-bar">
      <button
        class="action-btn"
        :class="{ liked: isLiked }"
        @click="handleToggleLike"
      >
        <span class="action-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
        <span class="action-text">{{ isLiked ? '已赞' : '点赞' }}</span>
        <span class="action-count" v-if="likeCount">{{ likeCount }}</span>
      </button>

      <button
        class="action-btn"
        :class="{ collected: isCollected }"
        @click="handleToggleCollect"
      >
        <span class="action-icon">{{ isCollected ? '⭐' : '☆' }}</span>
        <span class="action-text">{{ isCollected ? '已收藏' : '收藏' }}</span>
        <span class="action-count" v-if="collectCount">{{ collectCount }}</span>
      </button>
    </div>

    <!-- 评论区 -->
    <div id="comments" class="comments-section">
      <div class="comments-header">
        <h3>评论 <span class="comment-count">{{ commentTotal }}</span></h3>
      </div>

      <!-- 评论输入 -->
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
          <el-button type="primary" :loading="submitting" :disabled="!commentText.trim()" @click="handleSubmitComment" size="default">
            发表评论
          </el-button>
        </div>
      </div>
      <div v-else class="login-prompt">
        <span>登录后即可参与评论</span>
        <el-button type="primary" size="small" @click="$router.push(`/login?redirect=${$route.fullPath}`)">去登录</el-button>
      </div>

      <!-- 评论列表 -->
      <div class="comment-list" v-loading="commentLoading">
        <div v-if="commentList.length === 0 && !commentLoading" class="no-comment">
          <el-empty description="暂无评论，来抢沙发吧" :image-size="60" />
        </div>
        <div v-for="comment in commentList" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <el-avatar :size="32" :src="comment.user?.avatar">
              {{ (comment.user?.nickname || comment.user?.username || '?').charAt(0) }}
            </el-avatar>
            <div class="user-info">
              <span class="nickname">{{ comment.user?.nickname || comment.user?.username || '匿名' }}</span>
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

const isLiked = ref(false)
const isCollected = ref(false)
const likeCount = ref(0)
const collectCount = ref(0)

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
    commentPage.value = 1
    fetchComments()
  } catch (err) {
    console.error('发表评论失败:', err)
  } finally {
    submitting.value = false
  }
}

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
  margin-bottom: 16px;
  transition: color 0.2s;

  &:hover { color: #2d6a4f; }
}

// ===== 文章标题区 =====
.article-header {
  margin-bottom: 24px;
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.3;
  letter-spacing: -0.5px;
  margin-bottom: 12px;
}

.article-meta {
  display: flex;
  align-items: center;
  color: #8e8ea0;
  font-size: 13px;
  flex-wrap: wrap;
  gap: 0;
}

.meta-author {
  display: flex;
  align-items: center;
  gap: 8px;

  .author-name {
    color: #2d6a4f;
    font-weight: 500;
  }
}

.meta-divider {
  margin: 0 10px;
  color: #d0d0d8;
}

.meta-text {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-tag {
  background: rgba(45, 106, 79, 0.06);
  border-color: rgba(45, 106, 79, 0.12);
  color: #2d6a4f;
}

// ===== 封面图 =====
.cover-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 24px;
}

// ===== 正文 =====
.article-content {
  line-height: 1.9;
  font-size: 15px;
  color: #1a1a2e;
  padding: 24px 0;
  max-width: 720px;
}

// ===== 互动栏 =====
.interaction-bar {
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #4a4a68;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(45, 106, 79, 0.2);
    background: rgba(45, 106, 79, 0.03);
  }

  &.liked {
    color: #e74c3c;
    border-color: rgba(231, 76, 60, 0.15);
    background: rgba(231, 76, 60, 0.04);
  }

  &.collected {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.15);
    background: rgba(245, 158, 11, 0.04);
  }

  .action-icon {
    font-size: 16px;
  }

  .action-count {
    font-size: 13px;
    font-weight: 600;
    margin-left: 2px;
  }
}

// ===== 评论区 =====
.comments-section {
  margin-top: 40px;
}

.comments-header {
  margin-bottom: 20px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .comment-count {
    font-size: 14px;
    color: #8e8ea0;
    font-weight: 400;
  }
}

.comment-input-area {
  background: rgba(45, 106, 79, 0.02);
  border: 1px solid rgba(45, 106, 79, 0.08);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    background: #fff;
  }

  .input-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
}

.login-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(45, 106, 79, 0.02);
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #8e8ea0;
}

.comment-list {
  min-height: 60px;
}

.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

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
      color: #2d6a4f;
    }

    .time {
      font-size: 12px;
      color: #b8b8c8;
      margin-top: 2px;
    }
  }
}

.comment-body {
  margin: 8px 0 0 42px;
  line-height: 1.7;
  font-size: 14px;
  color: #1a1a2e;
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
