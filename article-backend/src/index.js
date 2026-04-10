require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

// 初始化
const app = express()
const PORT = process.env.PORT || 3000

// ========== 中间件 ==========
app.use(cors({
  origin: function (origin, callback) {
    const whitelist = [
      'http://localhost:5173',
      'http://localhost:5174',
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : []),
    ]
    // 允许无 origin 的请求（如服务端请求、Postman）
    if (!origin || whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // 开发阶段放行所有来源，生产环境可改为 callback(new Error('Not allowed'))
    }
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务 - 图片上传目录
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// ========== 测试路由 ==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  })
})

// ========== 路由挂载 ==========
app.use('/api/auth', require('./routes/auth'))
app.use('/api/articles', require('./routes/article'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/likes', require('./routes/likes'))
app.use('/api/collects', require('./routes/collects'))
app.use('/api/comments', require('./routes/comments'))
app.use('/api/admin', require('./routes/admin'))

// ========== 统一异常处理中间件 ==========
const { errorHandler } = require('./middlewares/errorHandler')
app.use(errorHandler())

// ========== 404 处理（放在错误处理之后）==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
  })
})

// ========== 启动服务 ==========
function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`)
    console.log(`📡 健康检查: http://localhost:${PORT}/api/health`)
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
    console.log(`📋 API 路由: /api/auth, /api/articles, /api/likes, /api/collects, /api/comments, /api/admin`)
  })
}

startServer()

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n⏹️  服务正在关闭...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n⏹️  收到终止信号，正在退出')
  process.exit(0)
})
