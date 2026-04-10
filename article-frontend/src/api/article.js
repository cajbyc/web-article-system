import request from '../utils/request'

// ========== 文章列表 ==========
export function getArticleList(params) {
  return request.get('/articles', { params })
}

// ========== 文章详情 ==========
export function getArticleDetail(id) {
  return request.get(`/articles/${id}`)
}

// ========== 发布文章 ==========
export function createArticle(data) {
  return request.post('/articles', data)
}

// ========== 更新文章 ==========
export function updateArticle(id, data) {
  return request.put(`/articles/${id}`, data)
}

// ========== 删除文章（软删除）==========
export function deleteArticle(id) {
  return request.delete(`/articles/${id}`)
}

// ========== 我的所有文章 ==========
export function getMyArticles(params) {
  return request.get('/articles/my', { params })
}

// ========== 回收站 ==========
export function getRecycleBin(params) {
  return request.get('/articles/recycle', { params })
}

// ========== 恢复文章 ==========
export function restoreArticle(id) {
  return request.post(`/articles/${id}/restore`)
}

// ========== 彻底删除 ==========
export function permanentDelete(id) {
  return request.delete(`/articles/${id}/permanent`)
}

// ========== 分类列表 ==========
export function getCategories() {
  return request.get('/articles/categories')
}

// ========== 公开统计（首页概览）==========
export function getPublicStats() {
  return request.get('/articles/stats')
}

// ========== 某用户的公开文章 ==========
export function getUserArticles(userId, params) {
  return request.get(`/articles/user/${userId}`, { params })
}

// ========== 获取用户公开资料 ==========
export function getUserProfile(userId) {
  return request.get(`/auth/user/${userId}`)
}

// ========== 图片上传 ==========
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  return request.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
