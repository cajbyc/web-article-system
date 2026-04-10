const jwt = require('jsonwebtoken')
require('dotenv').config()

/**
 * 生成 JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

/**
 * 验证 JWT Token
 * @returns {object|null} 解析后的 payload，无效返回 null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    return null
  }
}

module.exports = { generateToken, verifyToken }
