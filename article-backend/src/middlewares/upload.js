const multer = require('multer')
const { randomUUID } = require('crypto')
const path = require('path')

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型，仅允许 jpg/jpeg/png/gif/webp'), false)
  }
}

/**
 * 上传中间件
 *
 * 存储策略：
 * - 本地开发：multer.diskStorage → public/uploads/ 目录
 * - Vercel Serverless：multer.memoryStorage → 文件暂存内存，由路由层上传到云存储
 *
 * 环境判断：NODE_ENV=production 时使用内存存储，避免写入只读文件系统
 */
const storage = process.env.NODE_ENV === 'production'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'public/uploads/')
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
        cb(null, uniqueName)
      },
    })

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

module.exports = upload
