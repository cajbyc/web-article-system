/**
 * PrismaClient 全局单例
 *
 * - Serverless 环境下防止每次请求都 new PrismaClient() 导致连接耗尽
 * - 自动检测数据库可用性：DATABASE_URL 有效 → 返回单例；无效 → 返回 null
 * - dbAvailable 标志供各控制器判断是否走数据库模式
 * - 首次请求时延迟检测 + 定期重试，避免数据库启动慢于后端时永久降级
 */
const { PrismaClient } = require('@prisma/client')

let dbAvailable = false
let prismaInstance = null
let checkPromise = null

async function checkDb() {
  try {
    const p = new PrismaClient()
    await p.$queryRaw`SELECT 1`
    await p.$disconnect()
    dbAvailable = true
    return true
  } catch {
    dbAvailable = false
    return false
  }
}

// 延迟检测：不立即执行，等首次 getPrisma() 时再检测
// 同时每 10 秒重试一次直到成功，避免数据库启动慢于后端时永久降级
function startRetryLoop() {
  const timer = setInterval(async () => {
    if (dbAvailable) {
      clearInterval(timer)
      return
    }
    const ok = await checkDb()
    if (ok) {
      console.log('[prisma] 数据库连接恢复')
      clearInterval(timer)
    }
  }, 10000)
}

// 模块加载时启动重试（但不阻塞）
startRetryLoop()

function getPrisma() {
  if (prismaInstance) return prismaInstance
  if (!dbAvailable) {
    // 首次调用时触发一次检测
    if (!checkPromise) {
      checkPromise = checkDb().finally(() => { checkPromise = null })
    }
    return null
  }
  try {
    // 全局单例：Vercel Serverless 会复用同一进程，避免重复创建连接
    if (process.env.NODE_ENV === 'production') {
      prismaInstance = new PrismaClient()
    } else {
      // 开发环境使用全局变量防止 hot-reload 创建多个连接
      if (!global.__prismaClient) {
        global.__prismaClient = new PrismaClient()
      }
      prismaInstance = global.__prismaClient
    }
    return prismaInstance
  } catch {
    return null
  }
}

module.exports = { getPrisma, dbAvailable, checkDb }
