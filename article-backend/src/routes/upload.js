const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload')
const { authMiddleware } = require('../middlewares/auth')
const fs = require('fs')
const path = require('path')

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../public/uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * 图片上传接口
 *
 * 异常由 multer 中间件 + 全局 errorHandler 共同捕获：
 *   - 文件大小超限 → Multer LIMIT_FILE_SIZE → errorHandler 转换为 400 "图片大小不能超过5MB"
 *   - 文件类型不符 → Multer fileFilter 拒绝 → errorHandler 转换为 400 "仅支持 jpg/png/gif/webp"
 *   - 未选择文件     → 手动检查 req.file → 返回 400
 */
router.post('/image', authMiddleware(), upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'NO_FILE',
        message: '请选择要上传的图片（支持 jpg / png / gif / webp 格式，最大 5MB）',
      })
    }

    const url = `/uploads/${req.file.filename}`
    return res.json({
      success: true,
      data: { url, filename: req.file.filename, originalName: req.file.originalname, size: req.file.size },
    })
  } catch (err) {
    next(err)
  }
})

//Multer 错误会自动传递给 Express 全局错误中间件
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
