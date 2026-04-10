const express = require('express')
const router = express.Router()
const { register, login, getCurrentUser } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/auth')

// 公开路由
router.post('/register', register)
router.post('/login', login)

// 需要登录的路由
router.get('/me', authMiddleware(), getCurrentUser)

module.exports = router
