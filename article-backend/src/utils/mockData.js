/**
 * 共享内存模拟数据（数据库不可用时使用）
 * 所有 controller 引用同一份数据，保证注册后的用户在各模块一致
 */

const mockCategories = [
  { id: 1, name: '学习笔记', sort: 1 },
  { id: 2, name: '课程报告', sort: 2 },
  { id: 3, name: '技术分享', sort: 3 },
  { id: 4, name: '校园随笔', sort: 4 },
  { id: 5, name: '学术交流', sort: 5 },
]

const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$MOCK_HASHED_PASSWORD_FOR_ADMIN',
    nickname: '管理员',
    email: 'admin@test.com',
    avatar: null,
    role: 'admin',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let nextUserId = 2

const mockArticles = [
  {
    id: 1, title: 'Vue3 组合式 API 完全指南', content: '深入理解 Vue3 的 Composition API...',
    cover: null, categoryId: 3, status: 'published',
    viewCount: 128, likeCount: 15, collectCount: 8,
    userId: 1, createdAt: '2026-04-08T10:00:00Z', updatedAt: '2026-04-08T10:00:00Z',
  },
  {
    id: 2, title: 'Pinia 状态管理最佳实践', content: 'Pinia 是 Vue3 官方推荐的状态管理库...',
    cover: null, categoryId: 3, status: 'published',
    viewCount: 96, likeCount: 8, collectCount: 4,
    userId: 1, createdAt: '2026-04-07T14:30:00Z', updatedAt: '2026-04-07T14:30:00Z',
  },
  {
    id: 3, title: 'Element Plus 组件库使用技巧', content: '汇总 Element Plus 中常用组件的使用技巧...',
    cover: null, categoryId: 1, status: 'published',
    viewCount: 74, likeCount: 5, collectCount: 2,
    userId: 1, createdAt: '2026-04-06T09:20:00Z', updatedAt: '2026-04-06T09:20:00Z',
  },
]

let nextArticleId = 4

const mockLikes = new Set()      // userId-articleId
const mockCollects = new Set()   // userId-articleId

let nextCommentId = 1
const mockComments = []

const mockRecycleBin = []

module.exports = {
  mockCategories,
  mockUsers,
  nextUserId,
  getNextUserId() { return nextUserId++ },
  mockArticles,
  nextArticleId,
  getNextArticleId() { return nextArticleId++ },
  mockLikes,
  mockCollects,
  nextCommentId,
  getNextCommentId() { return nextCommentId++ },
  mockComments,
  mockRecycleBin,
}
