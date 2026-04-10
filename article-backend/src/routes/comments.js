const express = require('express')
const router = express.Router()
const { createComment, getComments, deleteComment, getMyComments } = require('../controllers/interactionController')
const { authMiddleware } = require('../middlewares/auth')

// POST /api/comments — 发表评论（需登录）
router.post('/', authMiddleware(), createComment)

// GET /api/comments?articleId=xxx — 文章评论列表（公开）
router.get('/', getComments)

// DELETE /api/comments/:id — 删除评论（需登录，本人或管理员）
router.delete('/:id', authMiddleware(), deleteComment)

// GET /api/comments/my — 我的评论列表（需登录）
router.get('/my', authMiddleware(), getMyComments)

module.exports = router
