/**
 * PrismaClient 全局单例
 *
 * - Serverless 环境下防止每次请求都 new PrismaClient() 导致连接耗尽
 * - 自动检测数据库可用性：DATABASE_URL 有效 → 返回单例；无效 → 返回 null
 * - dbAvailable 标志供各控制器判断是否走数据库模式
 */
const { PrismaClient } = require('@prisma/client')

let dbAvailable = false
let prismaInstance = null

async function checkDb() {
  try {
    const p = new PrismaClient()
    await p.$queryRaw`SELECT 1`
    await p.$disconnect()
    dbAvailable = true
  } catch {
    dbAvailable = false
  }
}

// 模块加载时自动检测
checkDb()

function getPrisma() {
  if (!dbAvailable) return null
  if (prismaInstance) return prismaInstance
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
