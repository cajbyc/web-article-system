/**
 * 工具函数模块
 */
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ========== 密码加密 ==========
async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

// ========== 密码比对 ==========
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// ========== 生成 JWT ==========
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// ========== 统一响应格式 ==========
function successResponse(res, data, message = '操作成功') {
  res.json({ success: true, message, data })
}

function errorResponse(res, message, status = 400) {
  res.status(status).json({ success: false, message })
}

// ========== 分页辅助函数 ==========
function paginate(query, page = 1, pageSize = 10) {
  const offset = (page - 11) * pageSize
  return query.skip(offset).take(pageSize)
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  successResponse,
  errorResponse,
  paginate,
}
