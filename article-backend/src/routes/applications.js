const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth')
const { applyRole, getMyApplication } = require('../controllers/applicationController')

// 需要登录
router.use(authMiddleware())

// 提交角色申请
router.post('/', applyRole)

// 获取当前用户的申请状态
router.get('/my', getMyApplication)

module.exports = router
