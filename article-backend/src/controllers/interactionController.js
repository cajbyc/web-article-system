const { PrismaClient } = require('@prisma/client')
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} = require('../utils/errors')

let dbAvailable = false
async function checkDb() {
  try {
    const p = new PrismaClient(); await p.$queryRaw`SELECT 1`; await p.$disconnect()
    dbAvailable = true
  } catch { dbAvailable = false }
}
checkDb()

function getPrisma() {
  if (!dbAvailable) return null
  try { return new PrismaClient() } catch { return null }
}

// ========== 内存模拟数据 ==========
const mockUsers = [
  { id: 1, username: 'admin', nickname: '管理员', avatar: null, role: 'admin' },
  { id: 2, username: 'editor01', nickname: '编辑小明', avatar: null, role: 'editor' },
  { id: 3, username: 'author01', nickname: '作者小红', avatar: null, role: 'author' },
]
const mockArticles = [
  { id: 1, title: 'Vue3 组合式 API 完全指南', likeCount: 15, collectCount: 8 },
  { id: 2, title: 'Pinia 状态管理最佳实践', likeCount: 8, collectCount: 4 },
  { id: 3, title: 'Element Plus 组件库使用技巧', likeCount: 5, collectCount: 2 },
]
const mockLikes = new Set(['2-1', '3-1', '1-2'])
const mockCollects = new Set(['2-1', '1-1'])
let nextCommentId = 1
const mockComments = [
  { id: 1, articleId: 1, userId: 2, content: '写得非常清晰！', createdAt: '2026-04-08T12:00:00Z' },
  { id: 2, articleId: 1, userId: 3, content: '组合式 API 确实更灵活', createdAt: '2026-04-08T13:30:00Z' },
  { id: 3, articleId: 2, userId: 1, content: 'Pinia 的 TS 支持很好', createdAt: '2026-04-07T16:00:00Z' },
  { id: 4, articleId: 1, userId: 1, content: 'script setup 更简洁', createdAt: '2026-04-08T14:20:00Z' },
]

// ============================================================
//  点赞功能
// ============================================================

async function toggleLike(req, res) {
  try {
    const { articleId } = req.body
    const userId = req.user.id

    if (!articleId) throw new BadRequestError('文章ID不能为空')
    if (typeof articleId !== 'number') throw new BadRequestError('文章ID必须为数字')

    if (dbAvailable) {
      const prisma = getPrisma()
      // 检查文章是否存在
      const article = await prisma.article.findUnique({ where: { id: articleId } })
      if (!article) { await prisma.$disconnect(); throw new NotFoundError('文章不存在或已删除') }
      if (article.status !== 'published') { await prisma.$disconnect(); throw new ForbiddenError('该文章未公开，无法点赞') }

      const existing = await prisma.like.findUnique({ where: { userId_articleId: { userId, articleId } } })

      let liked, likeCount
      if (existing) {
        await prisma.like.delete({ where: { id: existing.id } })
        await prisma.article.update({ where: { id: articleId }, data: { likeCount: { decrement: 1 } } })
        liked = false
      } else {
        await prisma.like.create({ data: { userId, articleId } })
        await prisma.article.update({ where: { id: articleId }, data: { likeCount: { increment: 1 } } })
        liked = true
      }
      const art = await prisma.article.findUnique({ where: { id: articleId }, select: { likeCount: true } })
      likeCount = art.likeCount
      await prisma.$disconnect()
      return res.json({ success: true, data: { liked, likeCount }, message: liked ? '点赞成功' : '已取消点赞' })
    }

    // 内存模拟
    const key = `${userId}-${articleId}`
    const article = mockArticles.find(a => a.id === articleId)
    if (!article) throw new NotFoundError('文章不存在或已删除')

    let liked
    if (mockLikes.has(key)) {
      mockLikes.delete(key); article.likeCount = Math.max(0, article.likeCount - 1); liked = false
    } else {
      mockLikes.add(key); article.likeCount++; liked = true
    }
    return res.json({ success: true, data: { liked, likeCount: article.likeCount }, message: liked ? '点赞成功' : '已取消点赞' })
  } catch (err) {
    console.error('【切换点赞错误】', err)
    throw err
  }
}

async function getLikeStatus(req, res) {
  try {
    const articleId = parseInt(req.params.articleId)
    const userId = req.user.id

    if (isNaN(articleId)) throw new BadRequestError('文章ID格式无效')

    if (dbAvailable) {
      const prisma = getPrisma()
      const existing = await prisma.like.findUnique({ where: { userId_articleId: { userId, articleId } } })
      await prisma.$disconnect()
      return res.json({ success: true, data: { liked: !!existing } })
    }
    return res.json({ success: true, data: { liked: mockLikes.has(`${userId}-${articleId}`) } })
  } catch (err) {
    console.error('【获取点赞状态错误】', err)
    throw err
  }
}

// ============================================================
//  收藏功能
// ============================================================

async function toggleCollect(req, res) {
  try {
    const { articleId } = req.body
    const userId = req.user.id

    if (!articleId) throw new BadRequestError('文章ID不能为空')

    if (dbAvailable) {
      const prisma = getPrisma()
      const article = await prisma.article.findUnique({ where: { id: articleId } })
      if (!article) { await prisma.$disconnect(); throw new NotFoundError('文章不存在或已删除') }

      const existing = await prisma.collect.findUnique({ where: { userId_articleId: { userId, articleId } } })

      let collected, collectCount
      if (existing) {
        await prisma.collect.delete({ where: { id: existing.id } })
        await prisma.article.update({ where: { id: articleId }, data: { collectCount: { decrement: 1 } } })
        collected = false
      } else {
        await prisma.collect.create({ data: { userId, articleId } })
        await prisma.article.update({ where: { id: articleId }, data: { collectCount: { increment: 1 } } })
        collected = true
      }
      const art = await prisma.article.findUnique({ where: { id: articleId }, select: { collectCount: true } })
      collectCount = art.collectCount
      await prisma.$disconnect()
      return res.json({ success: true, data: { collected, collectCount }, message: collected ? '收藏成功' : '已取消收藏' })
    }

    const key = `${userId}-${articleId}`
    const article = mockArticles.find(a => a.id === articleId)
    if (!article) throw new NotFoundError('文章不存在或已删除')

    let collected
    if (mockCollects.has(key)) {
      mockCollects.delete(key); article.collectCount = Math.max(0, article.collectCount - 1); collected = false
    } else {
      mockCollects.add(key); article.collectCount++; collected = true
    }
    return res.json({ success: true, data: { collected, collectCount: article.collectCount }, message: collected ? '收藏成功' : '已取消收藏' })
  } catch (err) {
    console.error('【切换收藏错误】', err)
    throw err
  }
}

async function getCollectStatus(req, res) {
  try {
    const articleId = parseInt(req.params.articleId)
    const userId = req.user.id
    if (isNaN(articleId)) throw new BadRequestError('文章ID格式无效')

    if (dbAvailable) {
      const prisma = getPrisma()
      const existing = await prisma.collect.findUnique({ where: { userId_articleId: { userId, articleId } } })
      await prisma.$disconnect()
      return res.json({ success: true, data: { collected: !!existing } })
    }
    return res.json({ success: true, data: { collected: mockCollects.has(`${userId}-${articleId}`) } })
  } catch (err) {
    console.error('【获取收藏状态错误】', err)
    throw err
  }
}

async function getMyCollects(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      const [collects, total] = await Promise.all([
        prisma.collect.findMany({
          where: { userId },
          include: { article: { include: { category: true, user: { select: { id: true, nickname: true, username: true } } } } },
          orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
        }),
        prisma.collect.count({ where: { userId } }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: collects.map(c => ({ ...c.article, collectedAt: c.createdAt })), total, page, pageSize } })
    }

    const collectedIds = []
    mockCollects.forEach((key) => { const [uid, aid] = key.split('-'); if (parseInt(uid) === userId) collectedIds.push(parseInt(aid)) })

    const articles = collectedIds.map(id => {
      const art = mockArticles.find(a => a.id === id)
      return art ? { ...art, categoryName: '技术分享', authorName: '未知作者', collectedAt: new Date().toISOString() } : null
    }).filter(Boolean)

    return res.json({ success: true, data: { list: articles.slice((page - 1) * pageSize, page * pageSize), total: articles.length, page, pageSize } })
  } catch (err) {
    console.error('【我的收藏列表错误】', err)
    throw err
  }
}

// ============================================================
//  评论功能
// ============================================================

async function createComment(req, res) {
  try {
    const { articleId, content } = req.body
    const userId = req.user.id

    if (!articleId) throw new BadRequestError('文章ID不能为空')
    if (!content || !content.trim()) throw new BadRequestError('评论内容不能为空')
    if (content.length > 500) throw new BadRequestError('评论内容不能超过500个字符')
    if (content.trim().length < 1) throw new BadRequestError('评论内容不能仅包含空格')

    if (dbAvailable) {
      const prisma = getPrisma()
      const article = await prisma.article.findUnique({ where: { id: articleId } })
      if (!article) { await prisma.$disconnect(); throw new NotFoundError('文章不存在或已删除') }
      if (article.status === 'private') { await prisma.$disconnect(); throw new ForbiddenError('该文章为私密状态，无法评论') }
      if (article.status === 'draft') { await prisma.$disconnect(); throw new NotFoundError('该文章尚未发布') }

      const comment = await prisma.comment.create({
        data: { content: content.trim(), articleId, userId },
        include: { user: { select: { id: true, nickname: true, username: true, avatar: true } } },
      })
      await prisma.$disconnect()
      return res.status(201).json({ success: true, message: '评论成功', data: comment })
    }

    const article = mockArticles.find(a => a.id === articleId)
    if (!article) throw new NotFoundError('文章不存在或已删除')

    const user = mockUsers.find(u => u.id === userId) || { id: userId, username: `用户${userId}`, nickname: `用户${userId}`, avatar: null }
    const comment = { id: nextCommentId++, articleId, userId, content: content.trim(), createdAt: new Date().toISOString(), user }
    mockComments.push({ id: comment.id, articleId, userId, content: comment.content, createdAt: comment.createdAt })
    return res.status(201).json({ success: true, message: '评论成功', data: comment })
  } catch (err) {
    console.error('【发表评论错误】', err)
    throw err
  }
}

async function getComments(req, res) {
  try {
    const { articleId, page = 1, pageSize = 20 } = req.query
    if (!articleId) throw new BadRequestError('缺少文章ID参数')
    const p = parseInt(page), ps = parseInt(pageSize)

    if (dbAvailable) {
      const prisma = getPrisma()
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { articleId: parseInt(articleId) },
          include: { user: { select: { id: true, nickname: true, username: true, avatar: true } } },
          orderBy: { createdAt: 'desc' }, skip: (p - 1) * ps, take: ps,
        }),
        prisma.comment.count({ where: { articleId: parseInt(articleId) } }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: comments, total, page: p, pageSize: ps } })
    }

    const filtered = mockComments.filter(c => c.articleId === parseInt(articleId))
    const total = filtered.length
    const start = (p - 1) * ps
    return res.json({ success: true, data: { list: filtered.slice(start, start + ps).reverse().map(c => ({ ...c, user: mockUsers.find(u => u.id === c.userId) || { id: c.userId, nickname: `用户${c.userId}`, avatar: null } })), total, page: p, pageSize: ps } })
  } catch (err) {
    console.error('【获取评论列表错误】', err)
    throw err
  }
}

async function deleteComment(req, res) {
  try {
    const id = parseInt(req.params.id)
    const userId = req.user.id
    const userRole = req.user.role

    if (isNaN(id)) throw new BadRequestError('评论ID格式无效')

    if (dbAvailable) {
      const prisma = getPrisma()
      const comment = await prisma.comment.findUnique({ where: { id }, include: { user: { select: { id: true } } } })
      if (!comment) { await prisma.$disconnect(); throw new NotFoundError('评论不存在或已被删除') }

      if (comment.userId !== userId && userRole !== 'admin') {
        await prisma.$disconnect()
        throw new ForbiddenError('只能删除自己的评论，或联系管理员处理')
      }

      await prisma.comment.delete({ where: { id } })
      await prisma.$disconnect()
      return res.json({ success: true, message: '删除成功' })
    }

    const idx = mockComments.findIndex(c => c.id === id)
    if (idx === -1) throw new NotFoundError('评论不存在或已被删除')
    if (mockComments[idx].userId !== userId && userRole !== 'admin') {
      throw new ForbiddenError('只能删除自己的评论，或联系管理员处理')
    }
    mockComments.splice(idx, 1)
    return res.json({ success: true, message: '删除成功' })
  } catch (err) {
    console.error('【删除评论错误】', err)
    throw err
  }
}

async function getMyComments(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { userId },
          include: { article: { select: { id: true, title: true } }, user: { select: { id: true, nickname: true, username: true, avatar: true } } },
          orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
        }),
        prisma.comment.count({ where: { userId } }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: comments, total, page, pageSize } })
    }

    const myComments = mockComments.filter(c => c.userId === userId)
    const total = myComments.length
    const start = (page - 1) * pageSize
    return res.json({ success: true, data: { list: myComments.slice(start, start + pageSize).map(c => ({ ...c, article: mockArticles.find(a => a.id === c.articleId) || { id: c.articleId, title: '未知文章' }, user: mockUsers.find(u => u.id === c.userId) || { id: c.userId, nickname: `用户${c.userId}`, avatar: null } })), total, page, pageSize } })
  } catch (err) {
    console.error('【我的评论列表错误】', err)
    throw err
  }
}

module.exports = { toggleLike, getLikeStatus, toggleCollect, getCollectStatus, getMyCollects, createComment, getComments, deleteComment, getMyComments }
