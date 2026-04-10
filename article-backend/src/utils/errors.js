/**
 * 统一异常类体系 —— 提供精确的 HTTP 状态码和错误消息
 *
 * 使用方式：
 *   throw new NotFoundError('文章不存在')
 *   throw new ForbiddenError('只能编辑自己的文章')
 *   throw new ValidationError('密码长度至少6位')
 */

// ========== 自定义异常基类 ==========
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code || 'APP_ERROR'
  }
}

// ========== 具体异常类 ==========
class BadRequestError extends AppError {
  constructor(message = '请求参数有误') { super(message, 400, 'BAD_REQUEST') }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') { super(message, 401, 'UNAUTHORIZED') }
}

class ForbiddenError extends AppError {
  constructor(message = '无权限执行此操作') { super(message, 403, 'FORBIDDEN') }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') { super(message, 404, 'NOT_FOUND') }
}

class ConflictError extends AppError {
  constructor(message = '数据冲突') { super(message, 409, 'CONFLICT') }
}

class TooManyRequestsError extends AppError {
  constructor(message = '操作过于频繁，请稍后再试') { super(message, 429, 'TOO_MANY_REQUESTS') }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
}
