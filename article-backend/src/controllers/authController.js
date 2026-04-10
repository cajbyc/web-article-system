// bcryptjs 通过 utils/index 间接使用（hashPassword/comparePassword）
const { generateToken } = require('../utils/jwt')
const { hashPassword, comparePassword } = require('../utils')
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
} = require('../utils/errors')

// ========== 登录失败计数器（内存存储）==========
// 结构：{ username: { count: number, lockedUntil: Date|null } }
const loginAttempts = new Map()
const MAX_ATTEMPTS = 3
const LOCK_DURATION_MS = 10 * 60 * 1000 // 10 分钟

function isUserLocked(username) {
  const record = loginAttempts.get(username)
  if (!record || !record.lockedUntil) return false
  if (Date.now() < record.lockedUntil) return true // 仍在锁定中
  // 锁定已过期，清除记录
  loginAttempts.delete(username)
  return false
}

function recordFailedAttempt(username) {
  const record = loginAttempts.get(username) || { count: 0, lockedUntil: null }
  record.count++

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
    console.warn(`⚠️ 用户 ${username} 连续 ${MAX_ATTEMPTS} 次登录失败，已锁定 ${LOCK_DURATION_MS / 60000} 分钟`)
  }

  loginAttempts.set(username, record)
  return record.count
}

function clearLoginAttempts(username) {
  loginAttempts.delete(username)
}

const { getPrisma, dbAvailable } = require('../utils/prisma')
const { mockUsers, getNextUserId } = require('../utils/mockData')

// ========== 注册 ==========
async function register(req, res) {
  try {
    const { username, password, nickname, email } = req.body

    if (!username || !password || !nickname || !email) {
      throw new BadRequestError('请填写完整的注册信息（用户名、密码、昵称、邮箱）')
    }
    if (password.length < 6) {
      throw new BadRequestError('密码长度至少为6位')
    }
    if (username.length < 2 || username.length > 20) {
      throw new BadRequestError('用户名长度需在2-20个字符之间')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError('邮箱格式不正确')
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
      })

      if (existingUser) {
        await prisma.$disconnect()
        throw new ConflictError(existingUser.username === username ? '用户名已被注册' : '邮箱已被注册')
      }

      const hashedPassword = await hashPassword(password)
      const user = await prisma.user.create({
        data: { username, password: hashedPassword, nickname, email, role: 'user', status: true },
        select: { id: true, username: true, nickname: true, email: true, role: true, avatar: true, createdAt: true },
      })
      await prisma.$disconnect()
      return res.status(201).json({ success: true, message: '注册成功', data: user })
    }

    // 内存模式
    const exists = mockUsers.find(u => u.username === username || u.email === email)
    if (exists) {
      throw new ConflictError(exists.username === username ? '用户名已被注册' : '邮箱已被注册')
    }

    const hashedPassword = await hashPassword(password)
    const newUser = {
      id: getNextUserId(), username, password: hashedPassword, nickname, email,
      avatar: null, role: 'user', status: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    mockUsers.push(newUser)
    const { password: _, ...userInfo } = newUser
    return res.status(201).json({ success: true, message: '注册成功', data: userInfo })
  } catch (err) {
    if (err instanceof (BadRequestError || UnauthorizedError || ForbiddenError || NotFoundError || ConflictError)) throw err
    console.error('【注册错误】', err)
    throw err // 由全局 errorHandler 处理
  }
}

// ========== 登录（增强版：失败计数+精确错误提示）==========
async function login(req, res) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      throw new BadRequestError('请输入用户名和密码')
    }

    // 检查是否被临时锁定
    if (isUserLocked(username)) {
      const record = loginAttempts.get(username)
      const remainingMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000)
      throw new TooManyRequestsError(`密码错误次数过多，请 ${remainingMinutes} 分钟后重试`)
    }

    let user = null

    if (dbAvailable) {
      const prisma = getPrisma()
      user = await prisma.user.findUnique({ where: { username } })
      await prisma.$disconnect()
    } else {
      user = mockUsers.find(u => u.username === username)
    }

    // 用户不存在 —— 精确提示（不暴露"密码错"的模糊信息）
    if (!user) {
      recordFailedAttempt(username)
      throw new UnauthorizedError(`用户名 "${username}" 不存在或密码错误`)
    }

    // 账号被禁用
    if (user.status === false) {
      throw new ForbiddenError('账号已被禁用，请联系管理员解封后重试。如有疑问请联系 support@example.com')
    }

    // 密码验证
    let isMatch = false
    if (dbAvailable || user.password !== '$2a$10$MOCK_HASHED_PASSWORD_FOR_ADMIN') {
      isMatch = await comparePassword(password, user.password)
    } else {
      // 开发模式 admin 模拟登录
      isMatch = true
      console.log('[模拟] admin 用户登录（开发模式）')
    }

    if (!isMatch) {
      const attempts = recordFailedAttempt(username)
      if (attempts >= MAX_ATTEMPTS) {
        throw new TooManyRequestsError(`密码错误已达${MAX_ATTEMPTS}次，账号已临时锁定10分钟`)
      }
      throw new UnauthorizedError(`密码错误（剩余 ${MAX_ATTEMPTS - attempts} 次尝试机会）`)
    }

    // 登录成功 → 清除失败计数
    clearLoginAttempts(username)

    // 签发 JWT
    const token = generateToken({ id: user.id, username: user.username, role: user.role })

    return res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          avatar: user.avatar,
        },
      },
    })
  } catch (err) {
    if (['BadRequestError', 'UnauthorizedError', 'ForbiddenError', 'TooManyRequestsError'].some(c => err?.constructor?.name === c)) throw err
    console.error('【登录错误】', err)
    throw err
  }
}

// ========== 获取当前用户信息 ==========
async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id

    if (dbAvailable) {
      const prisma = getPrisma()
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, nickname: true, email: true, avatar: true, role: true, status: true, createdAt: true },
      })
      await prisma.$disconnect()

      if (!user) throw new NotFoundError('当前登录用户不存在，可能已被删除')
      return res.json({ success: true, data: user })
    }

    const user = mockUsers.find(u => u.id === userId)
    if (!user) throw new NotFoundError('当前登录用户不存在，可能已被删除')
    const { password: _, ...info } = user
    return res.json({ success: true, data: info })
  } catch (err) {
    console.error('【获取用户信息错误】', err)
    throw err
  }
}

// ========== 编辑资料 ==========
async function updateProfile(req, res) {
  try {
    const userId = req.user.id
    const { nickname, email, avatar } = req.body

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError('邮箱格式不正确')
    }
    if (nickname && (nickname.length < 1 || nickname.length > 20)) {
      throw new BadRequestError('昵称长度需在1-20个字符之间')
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      // 检查邮箱是否被其他用户占用
      if (email) {
        const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } })
        if (existing) { await prisma.$disconnect(); throw new ConflictError('该邮箱已被其他用户使用') }
      }
      const updateData = {}
      if (nickname !== undefined) updateData.nickname = nickname.trim()
      if (email !== undefined) updateData.email = email
      if (avatar !== undefined) updateData.avatar = avatar

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, username: true, nickname: true, email: true, avatar: true, role: true, status: true, createdAt: true },
      })
      await prisma.$disconnect()
      return res.json({ success: true, message: '资料更新成功', data: user })
    }

    // 内存模式
    const user = mockUsers.find(u => u.id === userId)
    if (!user) throw new NotFoundError('用户不存在')
    if (nickname !== undefined) user.nickname = nickname.trim()
    if (email !== undefined) user.email = email
    if (avatar !== undefined) user.avatar = avatar
    user.updatedAt = new Date().toISOString()
    const { password: _, ...info } = user
    return res.json({ success: true, message: '资料更新成功', data: info })
  } catch (err) {
    if (err instanceof (BadRequestError || ConflictError || NotFoundError)) throw err
    console.error('【更新资料错误】', err)
    throw err
  }
}

// ========== 修改密码 ==========
async function changePassword(req, res) {
  try {
    const userId = req.user.id
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      throw new BadRequestError('请输入旧密码和新密码')
    }
    if (newPassword.length < 6) {
      throw new BadRequestError('新密码长度至少为6位')
    }
    if (oldPassword === newPassword) {
      throw new BadRequestError('新密码不能与旧密码相同')
    }

    if (dbAvailable) {
      const prisma = getPrisma()
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) { await prisma.$disconnect(); throw new NotFoundError('用户不存在') }

      const isMatch = await comparePassword(oldPassword, user.password)
      if (!isMatch) { await prisma.$disconnect(); throw new UnauthorizedError('旧密码不正确') }

      const hashedPassword = await hashPassword(newPassword)
      await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } })
      await prisma.$disconnect()
      return res.json({ success: true, message: '密码修改成功' })
    }

    // 内存模式
    const user = mockUsers.find(u => u.id === userId)
    if (!user) throw new NotFoundError('用户不存在')

    // mock 模式下 admin 首次修改密码跳过旧密码验证（因为密码是模拟值无法校验）
    const isMockAdmin = user.username === 'admin' && user.password === '$2a$10$MOCK_HASHED_PASSWORD_FOR_ADMIN'
    if (!isMockAdmin) {
      const isMatch = await comparePassword(oldPassword, user.password)
      if (!isMatch) throw new UnauthorizedError('旧密码不正确')
    }

    // mock 模式下 admin 修改密码后，登录将需要使用新密码（模拟密码跳过逻辑不再生效）
    user.password = await hashPassword(newPassword)
    user.updatedAt = new Date().toISOString()
    return res.json({ success: true, message: '密码修改成功' })
  } catch (err) {
    if (err instanceof (BadRequestError || UnauthorizedError || NotFoundError)) throw err
    console.error('【修改密码错误】', err)
    throw err
  }
}

module.exports = { register, login, getCurrentUser, updateProfile, changePassword }
