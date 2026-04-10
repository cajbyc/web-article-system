const { verifyToken } = require('../utils/jwt')

/**
 * JWT 认证中间件
 * @param {object} options
 * @param {boolean} options.checkStatus - 是否检查用户状态（默认 false）
 */
function authMiddleware(options = {}) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌，请先登录',
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '令牌无效或已过期，请重新登录',
      })
    }

    req.user = decoded

    // 如果需要检查用户状态（数据库连接时才有效）
    if (options.checkStatus) {
      // 在控制器或路由中单独处理，避免中间件依赖数据库
      req._checkUserStatus = true
    }

    next()
  }
}

/**
 * 角色授权中间件
 * @param {string[]} allowedRoles - 允许的角色列表
 */
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `权限不足，需要角色: ${allowedRoles.join(', ')}`,
      })
    }
    next()
  }
}

module.exports = { authMiddleware, roleMiddleware }
