const { getPrisma, dbAvailable } = require('../utils/prisma')

// ========== 内存模拟数据 ==========

const mockAdminUsers = [
  { id: 1, username: 'admin', nickname: '管理员', email: 'admin@test.com', role: 'admin', status: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, username: 'editor01', nickname: '编辑小明', email: 'editor01@test.com', role: 'editor', status: true, createdAt: '2026-02-15T08:00:00Z' },
  { id: 3, username: 'author01', nickname: '作者小红', email: 'author01@test.com', role: 'author', status: true, createdAt: '2026-03-10T12:00:00Z' },
  { id: 4, username: 'user01', nickname: '普通用户A', email: 'user01@test.com', role: 'user', status: true, createdAt: '2026-03-20T09:30:00Z' },
  { id: 5, username: 'user02', nickname: '普通用户B', email: 'user02@test.com', role: 'user', status: false, createdAt: '2026-04-01T14:20:00Z' },
]

const mockAdminArticles = [
  { id: 1, title: 'Vue3 组合式 API 完全指南', categoryId: 3, status: 'published', viewCount: 128, likeCount: 15, collectCount: 8, userId: 2, authorName: '编辑小明', categoryName: '技术分享', createdAt: '2026-04-08T10:00:00Z' },
  { id: 2, title: 'Pinia 状态管理最佳实践', categoryId: 3, status: 'published', viewCount: 96, likeCount: 8, collectCount: 4, userId: 3, authorName: '作者小红', categoryName: '技术分享', createdAt: '2026-04-07T14:30:00Z' },
  { id: 3, title: 'Element Plus 组件库使用技巧', categoryId: 1, status: 'published', viewCount: 74, likeCount: 5, collectCount: 2, userId: 1, authorName: '管理员', categoryName: '学习笔记', createdAt: '2026-04-06T09:20:00Z' },
]

const mockAdminComments = [
  { id: 1, articleId: 1, articleTitle: 'Vue3 组合式 API 完全指南', userId: 2, userName: '编辑小明', content: '写得非常清晰，学到了很多！', createdAt: '2026-04-08T12:00:00Z' },
  { id: 2, articleId: 1, articleTitle: 'Vue3 组合式 API 完全指南', userId: 3, userName: '作者小红', content: '组合式 API 确实比选项式更灵活，支持！', createdAt: '2026-04-08T13:30:00Z' },
  { id: 3, articleId: 2, articleTitle: 'Pinia 状态管理最佳实践', userId: 1, userName: '管理员', content: 'Pinia 的 TypeScript 支持很好', createdAt: '2026-04-07T16:00:00Z' },
  { id: 4, articleId: 1, articleTitle: 'Vue3 组合式 API 完全指南', userId: 1, userName: '管理员', content: '补充：setup语法糖配合script setup更简洁', createdAt: '2026-04-08T14:20:00Z' },
]

// ============================================================
//  数据看板统计
// ============================================================
async function getDashboardStats(req, res) {
  try {
    if (dbAvailable) {
      const prisma = getPrisma()

      const [userCount, articleCount, commentCount, likeCount, collectCount, categoryStats] = await Promise.all([
        prisma.user.count(),
        prisma.article.count({ where: { status: 'published' } }),
        prisma.comment.count(),
        prisma.like.count(),
        prisma.collect.count(),
        prisma.category.findMany({
          select: { name: true },
          include: { _count: { select: { articles: true } } },
        }),
      ])

      await prisma.$disconnect()
      const categoryData = categoryStats.map(c => ({ name: c.name, count: c._count.articles }))

      return res.json({
        success: true,
        data: {
          userCount,
          articleCount,
          commentCount,
          likeCount,
          collectCount,
          categoryData,
        },
      })
    }

    // 内存模拟
    return res.json({
      success: true,
      data: {
        userCount: mockAdminUsers.length,
        articleCount: mockAdminArticles.filter(a => a.status === 'published').length,
        commentCount: mockAdminComments.length,
        likeCount: 28,
        collectCount: 14,
        categoryData: [
          { name: '学习笔记', count: 1 },
          { name: '课程报告', count: 0 },
          { name: '技术分享', count: 2 },
          { name: '校园随笔', count: 0 },
          { name: '学术交流', count: 0 },
        ],
      },
    })
  } catch (err) {
    console.error('【获取统计数据错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ============================================================
//  用户管理
// ============================================================

/** 获取用户列表 */
async function getUserList(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const keyword = req.query.keyword || ''
    const role = req.query.role || ''

    if (dbAvailable) {
      const prisma = getPrisma()
      const where = {}
      if (keyword) {
        where.OR = [
          { username: { contains: keyword } },
          { nickname: { contains: keyword } },
          { email: { contains: keyword } },
        ]
      }
      if (role) where.role = role

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: { id: true, username: true, nickname: true, email: true, role: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.user.count({ where }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: users, total, page, pageSize } })
    }

    // 内存模式
    let filtered = [...mockAdminUsers]
    if (keyword) {
      filtered = filtered.filter(u =>
        u.username.includes(keyword) || u.nickname.includes(keyword) || u.email.includes(keyword)
      )
    }
    if (role) filtered = filtered.filter(u => u.role === role)

    const total = filtered.length
    const start = (page - 1) * pageSize

    await req.recordLog?.(req.user.username, `查询用户列表（关键词: ${keyword || '无'}, 角色: ${role || '全部'}）`, getClientIp(req))
    return res.json({ success: true, data: { list: filtered.slice(start, start + pageSize), total, page, pageSize } })
  } catch (err) {
    console.error('【获取用户列表错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

/** 修改用户角色 */
async function updateUserRole(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { role } = req.body
    const validRoles = ['user', 'editor', 'author', 'admin']

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色值' })
    }

    // 不允许修改自己的角色
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: '不能修改自己的角色' })
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      const targetUser = await prisma.user.findUnique({ where: { id } })
      if (!targetUser) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '用户不存在' }) }

      // 检查是否为最后一个管理员
      if (targetUser.role === 'admin' && role !== 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin' } })
        if (adminCount <= 1) {
          await prisma.$disconnect()
          return res.status(400).json({ success: false, message: '系统中至少需要保留一个管理员账号' })
        }
      }

      await prisma.user.update({ where: { id }, data: { role } })
      await prisma.$disconnect()
    } else {
      // 内存模式
      const user = mockAdminUsers.find(u => u.id === id)
      if (!user) return res.status(404).json({ success: false, message: '用户不存在' })
      if (id === req.user.id) return res.status(400).json({ success: false, message: '不能修改自己的角色' })

      const adminCount = mockAdminUsers.filter(u => u.role === 'admin').length
      if (user.role === 'admin' && role !== 'admin' && adminCount <= 1) {
        return res.status(400).json({ success: false, message: '系统中至少需要保留一个管理员账号' })
      }
      user.role = role
    }

    await req.recordLog?.(req.user.username, `将用户(ID:${id})角色修改为 ${role}`, getClientIp(req))
    return res.json({ success: true, message: '角色已更新' })
  } catch (err) {
    console.error('【修改用户角色错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

/** 启用/禁用用户 */
async function updateUserStatus(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body

    if (typeof status !== 'boolean') {
      return res.status(400).json({ success: false, message: '状态值必须为布尔类型' })
    }

    // 不能禁用自己
    if (id === req.user.id && !status) {
      return res.status(400).json({ success: false, message: '不能禁用自己' })
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '用户不存在' }) }

      await prisma.user.update({ where: { id }, data: { status } })
      await prisma.$disconnect()
    } else {
      const user = mockAdminUsers.find(u => u.id === id)
      if (!user) return res.status(404).json({ success: false, message: '用户不存在' })
      if (id === req.user.id && !status) return res.status(400).json({ success: false, message: '不能禁用自己' })
      user.status = status
    }

    await req.recordLog?.(req.user.username, `${status ? '启用' : '禁用'}了用户(ID:${id})`, getClientIp(req))
    return res.json({ success: true, message: status ? '用户已启用' : '用户已禁用' })
  } catch (err) {
    console.error('【修改用户状态错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

/** 删除用户 */
async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id)

    // 不能删除管理员
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: '不能删除自己' })
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      const targetUser = await prisma.user.findUnique({ where: { id } })
      if (!targetUser) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '用户不存在' }) }

      if (targetUser.role === 'admin') {
        await prisma.$disconnect()
        return res.status(400).json({ success: false, message: '不能删除管理员账号' })
      }

      // 检查是否有文章
      const articleCount = await prisma.article.count({ where: { userId: id } })
      if (articleCount > 0) {
        await prisma.$disconnect()
        return res.status(400).json({
          success: false,
          message: `该用户有 ${articleCount} 篇文章，请先处理文章后再删除用户`,
        })
      }

      // 删除关联数据
      await prisma.like.deleteMany({ where: { userId: id } })
      await prisma.collect.deleteMany({ where: { userId: id } })
      await prisma.comment.deleteMany({ where: { userId: id } })
      await prisma.user.delete({ where: { id } })
      await prisma.$disconnect()
    } else {
      // 内存模式
      const idx = mockAdminUsers.findIndex(u => u.id === id)
      if (idx === -1) return res.status(404).json({ success: false, message: '用户不存在' })
      if (mockAdminUsers[idx].role === 'admin') return res.status(400).json({ success: false, message: '不能删除管理员账号' })
      if (id === req.user.id) return res.status(400).json({ success: false, message: '不能删除自己' })

      const hasArticles = mockAdminArticles.some(a => a.userId === id)
      if (hasArticles) return res.status(400).json({ success: false, message: '该用户有文章，请先处理后再删除' })

      mockAdminUsers.splice(idx, 1)
    }

    await req.recordLog?.(req.user.username, `删除了用户(ID:${id})`, getClientIp(req))
    return res.json({ success: true, message: '用户已删除' })
  } catch (err) {
    console.error('【删除用户错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ============================================================
//  文章管理（管理员版）
// ============================================================

/** 获取所有已发布文章 */
async function getAdminArticles(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const keyword = req.query.keyword || ''

    if (dbAvailable) {
      const prisma = getPrisma()
      const where = { status: 'published' }
      if (keyword) where.title = { contains: keyword }

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: { category: true, user: { select: { id: true, nickname: true, username: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.article.count({ where }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: articles, total, page, pageSize } })
    }

    let filtered = mockAdminArticles.filter(a => a.status === 'published')
    if (keyword) filtered = filtered.filter(a => a.title.includes(keyword))

    const total = filtered.length
    const start = (page - 1) * pageSize
    return res.json({ success: true, data: { list: filtered.slice(start, start + pageSize), total, page, pageSize } })
  } catch (err) {
    console.error('【管理员获取文章列表错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

/** 强制物理删除文章及其关联数据 */
async function forceDeleteArticle(req, res) {
  try {
    const id = parseInt(req.params.id)

    if (dbAvailable) {
      const prisma = getPrisma()
      const article = await prisma.article.findUnique({ where: { id } })
      if (!article) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '文章不存在' }) }

      // 删除所有关联数据
      await prisma.like.deleteMany({ where: { articleId: id } })
      await prisma.collect.deleteMany({ where: { articleId: id } })
      await prisma.comment.deleteMany({ where: { articleId: id } })
      await prisma.article.delete({ where: { id } })
      await prisma.$disconnect()
    } else {
      const idx = mockAdminArticles.findIndex(a => a.id === id)
      if (idx === -1) return res.status(404).json({ success: false, message: '文章不存在' })
      mockAdminArticles.splice(idx, 1)
    }

    await req.recordLog?.(req.user.username, `强制删除了文章(ID:${id})`, getClientIp(req))
    return res.json({ success: true, message: '文章已被彻底删除' })
  } catch (err) {
    console.error('【强制删除文章错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ============================================================
//  评论管理
// ============================================================

/** 获取所有评论 */
async function getAllComments(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const keyword = req.query.keyword || '' // 可按内容/文章标题搜索
    const userId = req.query.userId ? parseInt(req.query.userId) : null

    if (dbAvailable) {
      const prisma = getPrisma()
      const where = {}
      if (keyword) {
        where.OR = [
          { content: { contains: keyword } },
          { article: { title: { contains: keyword } } },
        ]
      }
      if (userId) where.userId = userId

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          include: {
            user: { select: { id: true, username: true, nickname: true } },
            article: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.comment.count({ where }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: comments, total, page, pageSize } })
    }

    let filtered = [...mockAdminComments]
    if (keyword) {
      filtered = filtered.filter(c =>
        c.content.includes(keyword) || c.articleTitle.includes(keyword)
      )
    }
    if (userId) filtered = filtered.filter(c => c.userId === userId)

    const total = filtered.length
    const start = (page - 1) * pageSize
    return res.json({ success: true, data: { list: filtered.slice(start, start + pageSize), total, page, pageSize } })
  } catch (err) {
    console.error('【获取全部评论错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

/** 批量删除评论 */
async function batchDeleteComments(req, res) {
  try {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要删除的评论ID列表' })
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      const result = await prisma.comment.deleteMany({
        where: { id: { in: ids } },
      })
      await prisma.$disconnect()

      await req.recordLog?.(req.user.username, `批量删除了 ${result.count} 条评论`, getClientIp(req))
      return res.json({ success: true, message: `成功删除 ${result.count} 条评论` })
    }

    // 内存模式
    let deleted = 0
    ids.forEach(id => {
      const idx = mockAdminComments.findIndex(c => c.id === id)
      if (idx !== -1) { mockAdminComments.splice(idx, 1); deleted++ }
    })

    await req.recordLog?.(req.user.username, `批量删除了 ${deleted} 条评论`, getClientIp(req))
    return res.json({ success: true, message: `成功删除 ${deleted} 条评论` })
  } catch (err) {
    console.error('【批量删除评论错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ============================================================
//  操作日志
// ============================================================

/** 获取操作日志 */
async function getOperationLogs(req, res) {
  try {
    const { queryLog } = require('../utils/logger')
    const result = await queryLog({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      operator: req.query.operator || '',
      startTime: req.query.startTime || '',
      endTime: req.query.endTime || '',
    })

    return res.json({ success: true, data: result })
  } catch (err) {
    console.error('【获取操作日志错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ============================================================
//  辅助函数
// ============================================================
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.ip ||
         req.connection?.remoteAddress ||
         '-'
}

module.exports = {
  getDashboardStats,
  getUserList,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getAdminArticles,
  forceDeleteArticle,
  getAllComments,
  batchDeleteComments,
  getOperationLogs,
}
