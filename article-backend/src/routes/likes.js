const express = require('express')
const router = express.Router()
const { toggleLike, getLikeStatus, getMyLikes } = require('../controllers/interactionController')
const { authMiddleware } = require('../middlewares/auth')

// POST /api/likes/toggle — 切换点赞（需登录）
router.post('/toggle', authMiddleware(), toggleLike)

// GET /api/likes/status/:articleId — 获取点赞状态（需登录）
router.get('/status/:articleId', authMiddleware(), getLikeStatus)

// GET /api/likes/my — 我的点赞列表（需登录）
router.get('/my', authMiddleware(), getMyLikes)

module.exports = router
