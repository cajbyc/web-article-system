const express = require('express')
const router = express.Router()
const {
  getArticleList, getArticleById, createArticle, updateArticle, deleteArticle,
  getMyArticles, getRecycleBin, restoreArticle, permanentDelete, getCategories, getPublicStats,
  getUserArticles, createCategory, updateCategory, deleteCategory,
} = require('../controllers/articleController')
const { authMiddleware } = require('../middlewares/auth')
const { checkRole } = require('../middlewares/role')

// ========== 分类 ==========
router.get('/categories', getCategories)

// ========== 公开统计 ==========
router.get('/stats', getPublicStats)

// ========== 文章列表（公开） ==========
router.get('/', getArticleList)

// ========== 我的文章（需登录，必须在 /:id 之前）==========
router.get('/my', authMiddleware(), checkRole(['editor', 'author', 'admin']), getMyArticles)

// ========== 回收站（需登录，必须在 /:id 之前）==========
router.get('/recycle', authMiddleware(), checkRole(['editor', 'author', 'admin']), getRecycleBin)

// ========== 某用户的公开文章（必须在 /:id 之前）==========
router.get('/user/:id', getUserArticles)

// ========== 单篇文章（公开）==========
router.get('/:id', getArticleById)

// 以下接口均需登录
router.use(authMiddleware())

// ========== 发布/编辑/删除（需 editor/author 或 admin）==========
router.post('/', checkRole(['editor', 'author', 'admin']), createArticle)
router.put('/:id', checkRole(['editor', 'author', 'admin']), updateArticle)
router.delete('/:id', checkRole(['editor', 'author', 'admin']), deleteArticle)
router.post('/:id/restore', restoreArticle)
router.delete('/:id/permanent', permanentDelete)

// ========== 分类管理（需 admin）==========
router.post('/categories', checkRole(['admin']), createCategory)
router.put('/categories/:id', checkRole(['admin']), updateCategory)
router.delete('/categories/:id', checkRole(['admin']), deleteCategory)

module.exports = router
