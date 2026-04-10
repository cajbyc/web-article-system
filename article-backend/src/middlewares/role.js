/**
 * 角色权限中间件
 */
function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `权限不足，需要角色: ${allowedRoles.join(' 或 ')}`,
      })
    }
    next()
  }
}

module.exports = { checkRole }
