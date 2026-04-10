import request from '../utils/request'

// ==================== 点赞 API ====================

export function toggleLike(articleId) {
  return request.post('/likes/toggle', { articleId })
}

export function getLikeStatus(articleId) {
  return request.get(`/likes/status/${articleId}`)
}

// ==================== 收藏 API ====================

export function toggleCollect(articleId) {
  return request.post('/collects/toggle', { articleId })
}

export function getCollectStatus(articleId) {
  return request.get(`/collects/status/${articleId}`)
}

export function getMyCollects(params) {
  return request.get('/collects/my', { params })
}

// ==================== 评论 API ====================

export function createComment(data) {
  return request.post('/comments', data)
}

export function getComments(params) {
  return request.get('/comments', { params })
}

export function deleteComment(id) {
  return request.delete(`/comments/${id}`)
}

export function getMyComments(params) {
  return request.get('/comments/my', { params })
}
