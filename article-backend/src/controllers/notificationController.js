const { getPrisma, dbAvailable } = require('../utils/prisma')

// 内存模拟
const mockNotifications = []

async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20

    if (dbAvailable) {
      const prisma = getPrisma()
      const [list, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ])
      return res.json({ success: true, data: { list, total, unreadCount, page, pageSize } })
    }

    // 内存模式
    const mine = mockNotifications.filter(n => n.userId === userId)
    const unreadCount = mine.filter(n => !n.isRead).length
    const start = (page - 1) * pageSize
    return res.json({
      success: true,
      data: { list: mine.slice(start, start + pageSize), total: mine.length, unreadCount, page, pageSize },
    })
  } catch (err) {
    console.error('【获取通知错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

async function markAsRead(req, res) {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      const notif = await prisma.notification.findUnique({ where: { id } })
      if (!notif || notif.userId !== userId) {
          return res.status(404).json({ success: false, message: '通知不存在' })
      }
      await prisma.notification.update({ where: { id }, data: { isRead: true } })
      return res.json({ success: true, message: '已标记为已读' })
    }

    const n = mockNotifications.find(n => n.id === id && n.userId === userId)
    if (n) n.isRead = true
    return res.json({ success: true, message: '已标记为已读' })
  } catch (err) {
    console.error('【标记已读错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

async function markAllRead(req, res) {
  try {
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
      return res.json({ success: true, message: '全部已标记为已读' })
    }

    mockNotifications.filter(n => n.userId === userId).forEach(n => n.isRead = true)
    return res.json({ success: true, message: '全部已标记为已读' })
  } catch (err) {
    console.error('【全部已读错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 创建通知的辅助函数（供其他 controller 调用）==========
async function createNotification({ userId, type, title, content, relatedId }) {
  if (dbAvailable) {
    const prisma = getPrisma()
    await prisma.notification.create({
      data: { userId, type, title, content, relatedId },
    })
  } else {
    mockNotifications.push({
      id: mockNotifications.length + 1,
      userId, type, title, content, relatedId,
      isRead: false, createdAt: new Date().toISOString(),
    })
  }
}

module.exports = { getMyNotifications, markAsRead, markAllRead, createNotification }
