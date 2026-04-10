import request from '../utils/request'

export function getMyNotifications(params) {
  return request.get('/notifications', { params })
}

export function markAsRead(id) {
  return request.put(`/notifications/read/${id}`)
}

export function markAllRead() {
  return request.put('/notifications/read-all')
}
