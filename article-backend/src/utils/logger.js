const { getPrisma, dbAvailable } = require('./prisma')

// ========== 内存日志存储（无数据库时使用）==========
const mockLogs = []

/**
 * 记录操作日志
 * @param {string} operator - 操作人用户名
 * @param {string} content - 操作描述
 * @param {string} ip - 操作IP（可选）
 */
async function recordLog(operator, content, ip) {
  const entry = { operator, content, ip: ip || '-', createdAt: new Date().toISOString() }

  if (dbAvailable) {
    try {
      const prisma = getPrisma()
      if (prisma) {
        await prisma.operationLog.create({ data: entry })
        await prisma.$disconnect()
        return
      }
    } catch (err) {
      console.error('【记录日志到数据库失败】', err)
    }
  }

  // 内存模式
  mockLogs.unshift(entry)
}

/**
 * 获取操作日志列表
 */
async function queryLogs({ page = 1, pageSize = 20, operator = '', startTime = '', endTime = '' }) {
  if (dbAvailable) {
    try {
      const prisma = getPrisma()
      if (!prisma) throw new Error('Prisma unavailable')

      const where = {}
      if (operator) where.operator = { contains: operator }
      if (startTime || endTime) {
        where.createdAt = {}
        if (startTime) where.createdAt.gte = new Date(startTime)
        if (endTime) where.createdAt.lte = new Date(endTime)
      }

      const [logs, total] = await Promise.all([
        prisma.operationLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.operationLog.count({ where }),
      ])
      await prisma.$disconnect()
      return { list: logs, total }
    } catch (err) {
      console.error('【查询日志失败】', err)
    }
  }

  // 内存模式
  let filtered = [...mockLogs]
  if (operator) filtered = filtered.filter(l => l.operator.includes(operator))
  if (startTime) filtered = filtered.filter(l => l.createdAt >= startTime)
  if (endTime) filtered = filtered.filter(l => l.createdAt <= endTime)

  const total = filtered.length
  const start = (page - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total }
}

module.exports = { recordLog, queryLog: queryLogs }
