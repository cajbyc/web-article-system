const express = require('express')
const router = express.Router()
const { toggleCollect, getCollectStatus, getMyCollects } = require('../controllers/interactionController')
const { authMiddleware } = require('../middlewares/auth')

// POST /api/collects/toggle — 切换收藏（需登录）
router.post('/toggle', authMiddleware(), toggleCollect)

// GET /api/collects/status/:articleId — 获取收藏状态（需登录）
router.get('/status/:articleId', authMiddleware(), getCollectStatus)

// GET /api/collects/my — 我的收藏列表（需登录）
router.get('/my', authMiddleware(), getMyCollects)

module.exports = router
