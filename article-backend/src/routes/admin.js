const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/auth')
const { recordLog } = require('../utils/logger')
const adminController = require('../controllers/adminController')
const { getApplications, reviewApplication } = require('../controllers/applicationController')

// 所有管理员接口需要：登录 + 管理员权限
router.use(authMiddleware())
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' })
  }
  req.recordLog = recordLog
  next()
})

// ==================== 数据看板 ====================
router.get('/stats/dashboard', adminController.getDashboardStats)

// ==================== 用户管理 ====================
router.get('/users', adminController.getUserList)
router.put('/users/:id/role', adminController.updateUserRole)
router.put('/users/:id/status', adminController.updateUserStatus)
router.delete('/users/:id', adminController.deleteUser)

// ==================== 文章管理（管理员版）====================
router.get('/articles', adminController.getAdminArticles)
router.delete('/articles/:id/force', adminController.forceDeleteArticle)

// ==================== 评论管理 ====================
router.get('/comments', adminController.getAllComments)
router.delete('/comments/batch', adminController.batchDeleteComments)

// ==================== 操作日志 ====================
router.get('/logs', adminController.getOperationLogs)

// ==================== 角色申请审批 ====================
router.get('/applications', getApplications)
router.put('/applications/:id', reviewApplication)

module.exports = router
