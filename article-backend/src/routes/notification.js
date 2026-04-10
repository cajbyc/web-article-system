const express = require('express')
const router = express.Router()
const { getMyNotifications, markAsRead, markAllRead } = require('../controllers/notificationController')
const { authMiddleware } = require('../middlewares/auth')

router.use(authMiddleware())

router.get('/', getMyNotifications)
router.put('/read/:id', markAsRead)
router.put('/read-all', markAllRead)

module.exports = router
