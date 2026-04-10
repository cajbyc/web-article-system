const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload')
const { authMiddleware } = require('../middlewares/auth')
const fs = require('fs')
const path = require('path')

// 确保上传目录存在（仅本地环境需要；Vercel Serverless 为只读文件系统，跳过）
const uploadDir = path.join(__dirname, '../../public/uploads')
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
} catch (e) {
  // Serverless 环境为只读文件系统，跳过目录创建
}

/**
 * 图片上传接口
 *
 * 存储策略：
 * - 本地开发（NODE_ENV !== production）：保存到 public/uploads/，返回本地路径
 * - 生产环境（NODE_ENV === production）：文件暂存内存，上传到 Vercel Blob 或其他云存储
 *   - 如果配置了 BLOB_READ_WRITE_TOKEN（Vercel Blob），自动上传并返回公网 URL
 *   - 如果未配置，返回提示信息（需要配置云存储）
 *
 * 异常由 multer 中间件 + 全局 errorHandler 共同捕获
 */
router.post('/image', authMiddleware(), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'NO_FILE',
        message: '请选择要上传的图片（支持 jpg / png / gif / webp 格式，最大 5MB）',
      })
    }

    // 本地开发模式：磁盘存储
    if (process.env.NODE_ENV !== 'production') {
      const url = `/uploads/${req.file.filename}`
      return res.json({
        success: true,
        data: { url, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size },
      })
    }

    // ===== 生产环境：上传到云存储 =====
    // 方案1: Vercel Blob（推荐，需安装 @vercel/blob 并配置 BLOB_READ_WRITE_TOKEN）
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob')
        const ext = path.extname(req.file.originalname) || '.png'
        const blobName = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`
        const blob = await put(blobName, req.file.buffer, {
          access: 'public',
          contentType: req.file.mimetype,
        })
        return res.json({
          success: true,
          data: { url: blob.url, filename: blobName, originalName: req.file.originalname, size: req.file.size },
        })
      } catch (blobErr) {
        console.error('【Vercel Blob 上传失败】', blobErr)
        return res.status(500).json({
          success: false,
          code: 'UPLOAD_FAILED',
          message: '图片上传到云存储失败，请检查 BLOB_READ_WRITE_TOKEN 配置',
        })
      }
    }

    // 方案2: 自定义云存储（可通过 UPLOAD_HANDLER 环境变量扩展）
    // 如果既没有 Vercel Blob 也没有自定义处理器，返回内存中的临时 URL（仅限测试）
    return res.status(501).json({
      success: false,
      code: 'NO_STORAGE_CONFIGURED',
      message: '生产环境未配置云存储，请设置 BLOB_READ_WRITE_TOKEN（Vercel Blob）或配置其他云存储服务',
    })
  } catch (err) {
    next(err)
  }
})

// Multer 错误会自动传递给 Express 全局错误中间件
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      code: 'FILE_TOO_LARGE',
      message: `图片大小超过5MB限制，当前文件 ${(err.limit / 1024 / 1024).toFixed(1)}MB`,
    })
  }
  if (err.message && (err.message.includes('不支持的文件类型') || err.message.includes('file type'))) {
    return res.status(400).json({
      success: false,
      code: 'FILE_TYPE_INVALID',
      message: err.message,
    })
  }
  next(err)
})

module.exports = router
