// Vercel Serverless Function 入口
// 将 Express 应用适配为 Vercel 函数格式
//
// 部署方式：
//   1. 整个 src/ 目录作为 api/ 目录部署
//   2. 或将此文件复制到 article-backend/api/index.js

require('dotenv').config()

const express = require('express')
const cors = require('cors')

const app = express()

// ========== CORS 配置 ==========
app.use(cors({
  origin: function (origin, callback) {
    // Vercel 部署：优先使用 FRONTEND_URL 白名单，未配置则允许所有来源
    const whitelist = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
      : []
    if (!origin || whitelist.length === 0 || whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // 暂时放行，生产环境可收紧
    }
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ========== 健康检查 ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// ========== 路由挂载 ==========
app.use('/api/auth', require('../src/routes/auth'))
app.use('/api/articles', require('../src/routes/article'))
app.use('/api/upload', require('../src/routes/upload'))
app.use('/api/likes', require('../src/routes/interaction'))
app.use('/api/collects', require('../src/routes/interaction'))
app.use('/api/comments', require('../src/routes/interaction'))
app.use('/api/admin', require('../src/routes/admin'))

// ========== 统一异常处理 ==========
const { errorHandler } = require('../src/middlewares/errorHandler')
app.use(errorHandler())

app.use((req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: `接口不存在: ${req.method} ${req.originalUrl}` })
})

// ========== 导出为 Vercel Serverless Function ==========
module.exports = app
