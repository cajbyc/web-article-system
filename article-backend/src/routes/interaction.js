const express = require('express')
const router = express.Router()
const {
  toggleLike, getLikeStatus,
  toggleCollect, getCollectStatus, getMyCollects,
  createComment, getComments, deleteComment, getMyComments,
} = require('../controllers/interactionController')
const { authMiddleware, roleMiddleware } = require('../middlewares/auth')

// ============================================================
//  点赞路由
// ============================================================

// POST /api/likes/toggle — 切换点赞（需登录）
router.post('/toggle', authMiddleware(), toggleLike)

// GET /api/likes/status/:articleId — 获取点赞状态（需登录）
router.get('/status/:articleId', authMiddleware(), getLikeStatus)

// ============================================================
//  收藏路由
// ============================================================

// POST /api/collects/toggle — 切换收藏（需登录）
router.post('/toggle', authMiddleware(), toggleCollect)

// GET /api/collects/status/:articleId — 获取收藏状态（需登录）
router.get('/status/:articleId', authMiddleware(), getCollectStatus)

// GET /api/collects/my — 我的收藏列表（需登录）
router.get('/my', authMiddleware(), getMyCollects)

// ============================================================
//  评论路由
// ============================================================

// POST /api/comments — 发表评论（需登录）
router.post('/', authMiddleware(), createComment)

// GET /api/comments?articleId=xxx — 文章评论列表（公开）
router.get('/', getComments)

// DELETE /api/comments/:id — 删除评论（需登录，本人或管理员）
router.delete('/:id', authMiddleware(), deleteComment)

// GET /api/comments/my — 我的评论列表（需登录）
router.get('/my', authMiddleware(), getMyComments)

module.exports = router
