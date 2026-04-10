const { getPrisma, dbAvailable } = require('../utils/prisma')
const { mockCategories, mockArticles, mockUsers, mockRecycleBin, getNextArticleId, mockLikes, mockCollects, mockComments } = require('../utils/mockData')

// ========== 辅助：构建文章响应（附加分类名和作者信息） ==========
function enrichArticle(article, categories, users) {
  const cat = categories.find(c => c.id === article.categoryId)
  const user = users?.find(u => u.id === article.userId)
  return {
    ...article,
    categoryName: cat?.name || '未分类',
    authorName: user?.nickname || user?.username || '未知作者',
  }
}

// ========== 获取文章列表 ==========
async function getArticleList(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null
    const keyword = req.query.keyword || ''
    const status = req.query.status || ''
    const sort = req.query.sort || 'newest'

    if (dbAvailable) {
      const prisma = getPrisma()
      const where = {}
      // 公开列表只显示已发布
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
        where.status = 'published'
      } else {
        // 编辑/管理员可看更多
        if (status) where.status = status
        else where.status = { in: ['published'] }
      }
      if (categoryId) where.categoryId = categoryId
      if (keyword) where.OR = [{ title: { contains: keyword } }, { content: { contains: keyword } }]

      const orderBy = sort === 'views' ? { viewCount: 'desc' }
                    : sort === 'likes' ? { likeCount: 'desc' }
                    : { createdAt: 'desc' }

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: { category: true, user: { select: { id: true, nickname: true, username: true } } },
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.article.count({ where }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: articles, total, page, pageSize } })
    }

    // ===== 内存模拟模式 =====
    let filtered = mockArticles.filter(a => a.status === 'published')
    if (req.user && ['admin', 'editor'].includes(req.user.role)) {
      filtered = [...mockArticles]
      if (status) filtered = filtered.filter(a => a.status === status)
    }
    if (categoryId) filtered = filtered.filter(a => a.categoryId === categoryId)
    if (keyword) filtered = filtered.filter(a => a.title.includes(keyword) || a.content.includes(keyword))

    // 排序
    if (sort === 'views') filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    else if (sort === 'likes') filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize).map(
      a => enrichArticle(a, mockCategories, mockUsers)
    )

    return res.json({
      success: true,
      data: { list, total: filtered.length, page, pageSize },
    })
  } catch (err) {
    console.error('【获取文章列表错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 获取单篇文章 ==========
async function getArticleById(req, res) {
  try {
    const id = parseInt(req.params.id)

    if (dbAvailable) {
      const prisma = getPrisma()
      const article = await prisma.article.findUnique({
        where: { id },
        include: { category: true, user: { select: { id: true, nickname: true, username: true, avatar: true } } },
      })
      if (!article) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '文章不存在' }) }

      // 权限检查
      if (article.status !== 'published' && (!req.user || (article.userId !== req.user.id && !['admin', 'editor'].includes(req.user.role)))) {
        await prisma.$disconnect()
        return res.status(403).json({ success: false, message: '无权查看该文章' })
      }

      // 增加阅读量
      await prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } })
      article.viewCount += 1

      // 查询点赞/收藏状态
      let liked = false, collected = false
      if (req.user) {
        liked = !!(await prisma.like.findUnique({ where: { userId_articleId: { userId: req.user.id, articleId: id } } }))
        collected = !!(await prisma.collect.findUnique({ where: { userId_articleId: { userId: req.user.id, articleId: id } } }))
      }

      await prisma.$disconnect()
      return res.json({ success: true, data: { ...article, isLiked: liked, isCollected: collected } })
    }

    // ===== 内存模拟 =====
    const article = mockArticles.find(a => a.id === id)
    if (!article) return res.status(404).json({ success: false, message: '文章不存在' })

    article.viewCount++
    const isLiked = req.user ? mockLikes.has(`${req.user.id}-${id}`) : false
    const isCollected = req.user ? mockCollects.has(`${req.user.id}-${id}`) : false
    return res.json({
      success: true,
      data: { ...enrichArticle(article, mockCategories, mockUsers), isLiked, isCollected },
    })
  } catch (err) {
    console.error('【获取文章详情错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 发布文章 ==========
async function createArticle(req, res) {
  try {
    const { title, content, cover, categoryId, status } = req.body
    const userId = req.user.id

    if (!title || !title.trim()) return res.status(400).json({ success: false, message: '标题不能为空' })
    if (!content) return res.status(400).json({ success: false, message: '内容不能为空' })
    if (!categoryId) return res.status(400).json({ success: false, message: '请选择分类' })
    if (!['draft', 'published', 'private'].includes(status)) return res.status(400).json({ success: false, message: '无效的文章状态' })

    if (dbAvailable) {
      const prisma = getPrisma()
      // 检查分类是否存在
      const cat = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } })
      if (!cat) { await prisma.$disconnect(); return res.status(400).json({ success: false, message: '分类不存在' }) }

      const article = await prisma.article.create({
        data: { title: title.trim(), content, cover: cover || null, categoryId: parseInt(categoryId), status, userId },
        include: { category: true },
      })
      await prisma.$disconnect()
      return res.status(201).json({ success: true, message: '发布成功', data: article })
    }

    // 内存模拟
    const cat = mockCategories.find(c => c.id === parseInt(categoryId))
    if (!cat) return res.status(400).json({ success: false, message: '分类不存在' })

    const now = new Date().toISOString()
    const article = {
      id: getNextArticleId(), title: title.trim(), content,
      cover: cover || null, categoryId: parseInt(categoryId), status: status || 'draft',
      viewCount: 0, likeCount: 0, collectCount: 0,
      userId, createdAt: now, updatedAt: now,
    }
    mockArticles.push(article)

    return res.status(201).json({
      success: true, message: '发布成功',
      data: enrichArticle(article, mockCategories, mockUsers),
    })
  } catch (err) {
    console.error('【创建文章错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 更新文章 ==========
async function updateArticle(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { title, content, cover, categoryId, status } = req.body

    if (dbAvailable) {
      const prisma = getPrisma()
      const article = await prisma.article.findUnique({ where: { id } })
      if (!article) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '文章不存在' }) }

      // 权限：只能编辑自己的文章或管理员编辑已发布的
      if (article.userId !== req.user.id && req.user.role !== 'admin') {
        await prisma.$disconnect()
        return res.status(403).json({ success: false, message: '无权编辑该文章' })
      }

      const updateData = {}
      if (title !== undefined) updateData.title = title.trim()
      if (content !== undefined) updateData.content = content
      if (cover !== undefined) updateData.cover = cover
      if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId)
      if (status !== undefined) updateData.status = status

      const updated = await prisma.article.update({ where: { id }, data: updateData, include: { category: true } })
      await prisma.$disconnect()
      return res.json({ success: true, message: '更新成功', data: updated })
    }

    // 内存模拟
    const idx = mockArticles.findIndex(a => a.id === id)
    if (idx === -1) return res.status(404).json({ success: false, message: '文章不存在' })
    const art = mockArticles[idx]
    if (art.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权编辑该文章' })
    }

    if (title !== undefined) art.title = title.trim()
    if (content !== undefined) art.content = content
    if (cover !== undefined) art.cover = cover
    if (categoryId !== undefined) art.categoryId = parseInt(categoryId)
    if (status !== undefined) art.status = status
    art.updatedAt = new Date().toISOString()

    return res.json({ success: true, message: '更新成功', data: enrichArticle(art, mockCategories, mockUsers) })
  } catch (err) {
    console.error('【更新文章错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 删除文章（软删除 -> 回收站）==========
async function deleteArticle(req, res) {
  try {
    const id = parseInt(req.params.id)

    if (dbAvailable) {
      const prisma = getPrisma()
      const article = await prisma.article.findUnique({ where: { id } })
      if (!article) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '文章不存在' }) }

      if (article.userId !== req.user.id && req.user.role !== 'admin') {
        await prisma.$disconnect()
        return res.status(403).json({ success: false, message: '无权删除该文章' })
      }

      // 移入回收站
      await prisma.recycleBin.create({
        data: {
          title: article.title, content: article.content, cover: article.cover,
          status: article.status, categoryId: article.categoryId,
          userId: article.userId, articleId: article.id,
        },
      })
      await prisma.article.delete({ where: { id } })
      await prisma.$disconnect()
      return res.json({ success: true, message: '已移至回收站' })
    }

    // 内存模拟
    const idx = mockArticles.findIndex(a => a.id === id)
    if (idx === -1) return res.status(404).json({ success: false, message: '文章不存在' })
    const art = mockArticles[idx]
    if (art.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权删除该文章' })
    }

    mockRecycleBin.push({ id: mockRecycleBin.length + 1, ...art, deleteAt: new Date().toISOString() })
    mockArticles.splice(idx, 1)
    return res.json({ success: true, message: '已移至回收站' })
  } catch (err) {
    console.error('【删除文章错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 我的所有文章 ==========
async function getMyArticles(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const status = req.query.status || ''
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      const where = { userId }
      if (status) where.status = status
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: { category: true },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.article.count({ where }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: articles, total, page, pageSize } })
    }

    let filtered = mockArticles.filter(a => a.userId === userId)
    if (status) filtered = filtered.filter(a => a.status === status)
    const start = (page - 1) * pageSize
    return res.json({
      success: true,
      data: {
        list: filtered.slice(start, start + pageSize).map(a => enrichArticle(a, mockCategories, mockUsers)),
        total: filtered.length, page, pageSize,
      },
    })
  } catch (err) {
    console.error('【我的文章错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 回收站列表 ==========
async function getRecycleBin(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      const [items, total] = await Promise.all([
        prisma.recycleBin.findMany({
          where: { userId },
          orderBy: { deleteAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.recycleBin.count({ where: { userId } }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: items, total, page, pageSize } })
    }

    const items = mockRecycleBin.filter(r => r.userId === userId)
    return res.json({ success: true, data: { list: items, total: items.length, page, pageSize } })
  } catch (err) {
    console.error('【回收站错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 恢复文章 ==========
async function restoreArticle(req, res) {
  try {
    const id = parseInt(req.params.id)

    if (dbAvailable) {
      const prisma = getPrisma()
      const item = await prisma.recycleBin.findUnique({ where: { id } })
      if (!item) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '回收站记录不存在' }) }
      if (item.userId !== req.user.id) { await prisma.$disconnect(); return res.status(403).json({ success: false, message: '无权操作' }) }

      const restored = await prisma.article.create({
        data: {
          title: item.title, content: item.content, cover: item.cover,
          status: item.status || 'draft', categoryId: item.categoryId, userId: item.userId,
        },
      })
      await prisma.recycleBin.delete({ where: { id } })
      await prisma.$disconnect()
      return res.json({ success: true, message: '恢复成功', data: restored })
    }

    const idx = mockRecycleBin.findIndex(r => r.id === id)
    if (idx === -1) return res.status(404).json({ success: false, message: '记录不存在' })
    if (mockRecycleBin[idx].userId !== req.user.id) return res.status(403).json({ success: false, message: '无权操作' })

    const item = mockRecycleBin.splice(idx, 1)[0]
    const restored = { ...item, id: getNextArticleId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    delete restored.articleId; delete restored.deleteAt
    mockArticles.push(restored)
    return res.json({ success: true, message: '恢复成功', data: restored })
  } catch (err) {
    console.error('【恢复文章错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 彻底删除 ==========
async function permanentDelete(req, res) {
  try {
    const id = parseInt(req.params.id)

    if (dbAvailable) {
      const prisma = getPrisma()
      const item = await prisma.recycleBin.findUnique({ where: { id } })
      if (!item) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '记录不存在' }) }
      if (item.userId !== req.user.id) { await prisma.$disconnect(); return res.status(403).json({ success: false, message: '无权操作' }) }

      await prisma.recycleBin.delete({ where: { id } })
      await prisma.$disconnect()
      return res.json({ success: true, message: '彻底删除成功' })
    }

    const idx = mockRecycleBin.findIndex(r => r.id === id)
    if (idx === -1) return res.status(404).json({ success: false, message: '记录不存在' })
    if (mockRecycleBin[idx].userId !== req.user.id) return res.status(403).json({ success: false, message: '无权操作' })

    mockRecycleBin.splice(idx, 1)
    return res.json({ success: true, message: '彻底删除成功' })
  } catch (err) {
    console.error('【彻底删除错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 获取分类列表 ==========
async function getCategories(req, res) {
  try {
    if (dbAvailable) {
      const prisma = getPrisma()
      const cats = await prisma.category.findMany({ orderBy: { sort: 'asc' } })
      await prisma.$disconnect()
      return res.json({ success: true, data: cats })
    }
    return res.json({ success: true, data: mockCategories })
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 公开数据统计（首页概览用，无需登录）==========
async function getPublicStats(req, res) {
  try {
    if (dbAvailable) {
      const prisma = getPrisma()
      const [articleCount, userCount, commentCount, likeCount] = await Promise.all([
        prisma.article.count({ where: { status: 'published' } }),
        prisma.user.count({ where: { status: true } }),
        prisma.comment.count(),
        prisma.like.count(),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { articleCount, userCount, commentCount, likeCount } })
    }
    // 内存模拟
    return res.json({
      success: true,
      data: {
        articleCount: mockArticles.filter(a => a.status === 'published').length,
        userCount: mockUsers.length,
        commentCount: mockComments.length,
        likeCount: mockArticles.reduce((s, a) => s + (a.likeCount || 0), 0),
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 分类管理（管理员）==========
async function createCategory(req, res) {
  try {
    const { name, sort } = req.body
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '分类名称不能为空' })

    if (dbAvailable) {
      const prisma = getPrisma()
      const existing = await prisma.category.findUnique({ where: { name: name.trim() } })
      if (existing) { await prisma.$disconnect(); return res.status(400).json({ success: false, message: '分类名称已存在' }) }

      const cat = await prisma.category.create({ data: { name: name.trim(), sort: sort || 0 } })
      await prisma.$disconnect()
      return res.status(201).json({ success: true, message: '分类创建成功', data: cat })
    }

    // 内存模式
    if (mockCategories.find(c => c.name === name.trim())) {
      return res.status(400).json({ success: false, message: '分类名称已存在' })
    }
    const cat = { id: Math.max(...mockCategories.map(c => c.id), 0) + 1, name: name.trim(), sort: sort || 0, articleCount: 0 }
    mockCategories.push(cat)
    return res.status(201).json({ success: true, message: '分类创建成功', data: cat })
  } catch (err) {
    console.error('【创建分类错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

async function updateCategory(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { name, sort } = req.body

    if (dbAvailable) {
      const prisma = getPrisma()
      const cat = await prisma.category.findUnique({ where: { id } })
      if (!cat) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '分类不存在' }) }

      if (name && name.trim() !== cat.name) {
        const dup = await prisma.category.findUnique({ where: { name: name.trim() } })
        if (dup) { await prisma.$disconnect(); return res.status(400).json({ success: false, message: '分类名称已存在' }) }
      }

      const updateData = {}
      if (name !== undefined) updateData.name = name.trim()
      if (sort !== undefined) updateData.sort = sort
      const updated = await prisma.category.update({ where: { id }, data: updateData })
      await prisma.$disconnect()
      return res.json({ success: true, message: '分类更新成功', data: updated })
    }

    const idx = mockCategories.findIndex(c => c.id === id)
    if (idx === -1) return res.status(404).json({ success: false, message: '分类不存在' })
    if (name !== undefined) mockCategories[idx].name = name.trim()
    if (sort !== undefined) mockCategories[idx].sort = sort
    return res.json({ success: true, message: '分类更新成功', data: mockCategories[idx] })
  } catch (err) {
    console.error('【更新分类错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

async function deleteCategory(req, res) {
  try {
    const id = parseInt(req.params.id)

    if (dbAvailable) {
      const prisma = getPrisma()
      const cat = await prisma.category.findUnique({ where: { id } })
      if (!cat) { await prisma.$disconnect(); return res.status(404).json({ success: false, message: '分类不存在' }) }

      const articleCount = await prisma.article.count({ where: { categoryId: id } })
      if (articleCount > 0) { await prisma.$disconnect(); return res.status(400).json({ success: false, message: `该分类下有 ${articleCount} 篇文章，无法删除` }) }

      await prisma.category.delete({ where: { id } })
      await prisma.$disconnect()
      return res.json({ success: true, message: '分类已删除' })
    }

    const idx = mockCategories.findIndex(c => c.id === id)
    if (idx === -1) return res.status(404).json({ success: false, message: '分类不存在' })
    const hasArticles = mockArticles.some(a => a.categoryId === id)
    if (hasArticles) return res.status(400).json({ success: false, message: '该分类下有文章，无法删除' })
    mockCategories.splice(idx, 1)
    return res.json({ success: true, message: '分类已删除' })
  } catch (err) {
    console.error('【删除分类错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// ========== 获取某用户的公开文章 ==========
async function getUserArticles(req, res) {
  try {
    const userId = parseInt(req.params.id)
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10

    if (dbAvailable) {
      const prisma = getPrisma()
      const where = { userId, status: 'published' }
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.article.count({ where }),
      ])
      await prisma.$disconnect()
      return res.json({ success: true, data: { list: articles, total, page, pageSize } })
    }

    // 内存模拟
    const filtered = mockArticles.filter(a => a.userId === userId && a.status === 'published')
    const start = (page - 1) * pageSize
    return res.json({
      success: true,
      data: { list: filtered.slice(start, start + pageSize).map(a => enrichArticle(a, mockCategories, mockUsers)), total: filtered.length, page, pageSize },
    })
  } catch (err) {
    console.error('【获取用户文章错误】', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

module.exports = {
  getArticleList, getArticleById, createArticle, updateArticle, deleteArticle,
  getMyArticles, getRecycleBin, restoreArticle, permanentDelete, getCategories, getPublicStats,
  getUserArticles, createCategory, updateCategory, deleteCategory,
}
