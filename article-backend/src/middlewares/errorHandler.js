const { AppError } = require('../utils/errors')

/**
 * 统一异常捕获中间件
 * 放在路由之后、404 之前使用：app.use(errorHandler())
 *
 * 功能：
 * 1. 捕获自定义 AppError → 使用其自带的 statusCode 和 message
 * 2. 捕获 Multer 错误（文件大小超限 / 文件类型不符）→ 返回明确中文提示
 * 3. 捕获 Prisma 已知错误码（唯一约束冲突等）→ 转换为友好提示
 * 4. 其他未知错误 → 统一返回 500 + 安全信息
 */
function errorHandler() {
  return (err, req, res, _next) => {
    console.error(`【异常】${req.method} ${req.originalUrl}`, err)

    // ====== 1. 自定义业务异常 ======
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        code: err.code,
        message: err.message,
      })
    }

    // ====== 2. Multer 文件上传异常 ======
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        code: 'FILE_TOO_LARGE',
        message: '图片大小不能超过5MB',
      })
    }
    if (err.message && err.message.includes('不支持的文件类型')) {
      return res.status(400).json({
        success: false,
        code: 'FILE_TYPE_INVALID',
        message: err.message,
      })
    }

    // ====== 3. Prisma 唯一约束冲突 ======
    if (err.code === 'P2002') {
      const field = err.meta?.target?.join('、') || '该字段'
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_ENTRY',
        message: `${field}已存在，不可重复`,
      })
    }

    // ====== 4. Prisma 记录不存在 ======
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        code: 'RECORD_NOT_FOUND',
        message: '记录不存在或已被删除',
      })
    }

    // ====== 5. JSON 解析异常（body 过大等）=====
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_BODY',
        message: '请求数据格式错误或过大',
      })
    }

    // ====== 6. 未知服务器错误 ======
    const isDev = process.env.NODE_ENV === 'development'
    res.status(err.status || 500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      ...(isDev && { detail: err.message, stack: err.stack }),
    })
  }
}

/**
 * 异步控制器包装器 —— 自动 try/catch 并将异常传递给 errorHandler
 *
 * 用法替代手动 try/catch：
 *   router.get('/', asyncHandler(getList))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = { errorHandler, asyncHandler }
