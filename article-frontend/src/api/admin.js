import request from '../utils/request'

// ==================== 数据统计 ====================
export function getDashboardStats() {
  return request.get('/admin/stats/dashboard')
}

// ==================== 用户管理 ====================
export function getUserList(params) {
  return request.get('/admin/users', { params })
}

export function updateUserRole(id, role) {
  return request.put(`/admin/users/${id}/role`, { role })
}

export function updateUserStatus(id, status) {
  return request.put(`/admin/users/${id}/status`, { status })
}

export function deleteUser(id) {
  return request.delete(`/admin/users/${id}`)
}

// ==================== 文章管理（管理员）====================
export function getAdminArticles(params) {
  return request.get('/admin/articles', { params })
}

export function forceDeleteArticle(id) {
  return request.delete(`/admin/articles/${id}/force`)
}

// ==================== 评论管理 ====================
export function getAllComments(params) {
  return request.get('/admin/comments', { params })
}

export function batchDeleteComments(ids) {
  return request.delete('/admin/comments/batch', { data: { ids } })
}

// ==================== 操作日志 ====================
export function getOperationLogs(params) {
  return request.get('/admin/logs', { params })
}
