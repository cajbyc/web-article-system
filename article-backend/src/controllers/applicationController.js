const { getPrisma, dbAvailable } = require('../utils/prisma')
const { mockUsers, mockRoleApplications, getNextApplicationId } = require('../utils/mockData')
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors')

// ========== 提交角色申请 ==========
async function applyRole(req, res) {
  try {
    const userId = req.user.id
    const { toRole, reason } = req.body

    if (!toRole) throw new BadRequestError('请指定申请的目标角色')
    const allowedRoles = ['author', 'editor']
    if (!allowedRoles.includes(toRole)) throw new BadRequestError('只能申请成为作者或编辑')

    if (dbAvailable) {
      const prisma = getPrisma()
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) { await prisma.$disconnect(); throw new NotFoundError('用户不存在') }
      if (allowedRoles.includes(user.role) || user.role === 'admin') {
        await prisma.$disconnect()
        throw new ConflictError(`你已是${user.role === 'admin' ? '管理员' : user.role === 'author' ? '作者' : '编辑'}，无需申请`)
      }

      // 检查是否有待审核的申请
      const existing = await prisma.roleApplication.findFirst({
        where: { userId, status: 'pending' },
      })
      if (existing) { await prisma.$disconnect(); throw new ConflictError('你已有待审核的申请，请等待处理') }

      const application = await prisma.roleApplication.create({
        data: {
          userId, fromRole: user.role, toRole,
          reason: reason || '',
          status: 'pending',
        },
      })
      await prisma.$disconnect()
      return res.status(201).json({ success: true, message: '申请已提交，请等待管理员审核', data: application })
    }

    // 内存模式
    const user = mockUsers.find(u => u.id === userId)
    if (!user) throw new NotFoundError('用户不存在')
    if (allowedRoles.includes(user.role) || user.role === 'admin') {
      throw new ConflictError(`你已是${user.role === 'admin' ? '管理员' : user.role === 'author' ? '作者' : '编辑'}，无需申请`)
    }

    const pendingApp = mockRoleApplications.find(a => a.userId === userId && a.status === 'pending')
    if (pendingApp) throw new ConflictError('你已有待审核的申请，请等待处理')

    const application = {
      id: getNextApplicationId(),
      userId,
      username: user.username,
      nickname: user.nickname,
      fromRole: user.role,
      toRole,
      reason: reason || '',
      status: 'pending',
      reviewedBy: null,
      reviewNote: '',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    }
    mockRoleApplications.push(application)
    return res.status(201).json({ success: true, message: '申请已提交，请等待管理员审核', data: application })
  } catch (err) {
    if (err instanceof (BadRequestError || ForbiddenError || NotFoundError || ConflictError)) throw err
    console.error('【申请角色错误】', err)
    throw err
  }
}

// ========== 获取当前用户的申请状态 ==========
async function getMyApplication(req, res) {
  try {
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      const application = await prisma.roleApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      await prisma.$disconnect()
      return res.json({ success: true, data: application || null })
    }

    // 内存模式：返回最近一条申请
    const apps = mockRoleApplications.filter(a => a.userId === userId)
    const latest = apps.length > 0 ? apps[apps.length - 1] : null
    return res.json({ success: true, data: latest })
  } catch (err) {
    console.error('【获取申请状态错误】', err)
    throw err
  }
}

// ========== 管理员：获取所有申请列表 ==========
async function getApplications(req, res) {
  try {
    const status = req.query.status || ''

    if (dbAvailable) {
      const prisma = getPrisma()
      const where = {}
      if (status) where.status = status
      const list = await prisma.roleApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, nickname: true } } },
      })
      await prisma.$disconnect()
      return res.json({ success: true, data: list })
    }

    let filtered = [...mockRoleApplications]
    if (status) filtered = filtered.filter(a => a.status === status)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return res.json({ success: true, data: filtered })
  } catch (err) {
    console.error('【获取申请列表错误】', err)
    throw err
  }
}

// ========== 管理员：审批申请 ==========
async function reviewApplication(req, res) {
  try {
    const { id } = req.params
    const { status, reviewNote } = req.body
    const reviewerId = req.user.id

    if (!['approved', 'rejected'].includes(status)) {
      throw new BadRequestError('审批状态只能是 approved 或 rejected')
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      const application = await prisma.roleApplication.findUnique({ where: { id: parseInt(id) } })
      if (!application) { await prisma.$disconnect(); throw new NotFoundError('申请不存在') }
      if (application.status !== 'pending') { await prisma.$disconnect(); throw new ConflictError('该申请已被处理') }

      const updated = await prisma.roleApplication.update({
        where: { id: parseInt(id) },
        data: {
          status,
          reviewedBy: reviewerId,
          reviewNote: reviewNote || '',
          reviewedAt: new Date().toISOString(),
        },
      })

      // 批准则更新用户角色
      if (status === 'approved') {
        await prisma.user.update({
          where: { id: application.userId },
          data: { role: application.toRole },
        })
      }
      await prisma.$disconnect()
      return res.json({ success: true, message: status === 'approved' ? '已批准申请' : '已拒绝申请', data: updated })
    }

    // 内存模式
    const application = mockRoleApplications.find(a => a.id === parseInt(id))
    if (!application) throw new NotFoundError('申请不存在')
    if (application.status !== 'pending') throw new ConflictError('该申请已被处理')

    application.status = status
    application.reviewedBy = reviewerId
    application.reviewNote = reviewNote || ''
    application.reviewedAt = new Date().toISOString()

    // 批准则更新用户角色
    if (status === 'approved') {
      const user = mockUsers.find(u => u.id === application.userId)
      if (user) {
        user.role = application.toRole
        user.updatedAt = new Date().toISOString()
      }
    }

    return res.json({ success: true, message: status === 'approved' ? '已批准申请' : '已拒绝申请', data: application })
  } catch (err) {
    if (err instanceof (BadRequestError || ForbiddenError || NotFoundError || ConflictError)) throw err
    console.error('【审批申请错误】', err)
    throw err
  }
}

module.exports = { applyRole, getMyApplication, getApplications, reviewApplication }
