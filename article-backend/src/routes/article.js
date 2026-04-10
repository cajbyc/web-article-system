const express = require('express')
const router = express.Router()
const {
  getArticleList, getArticleById, createArticle, updateArticle, deleteArticle,
  getMyArticles, getRecycleBin, restoreArticle, permanentDelete, getCategories,
} = require('../controllers/articleController')
const { authMiddleware } = require('../middlewares/auth')
const { checkRole } = require('../middlewares/role')

// ========== 分类 ==========
router.get('/categories', getCategories)

// ========== 文章列表（公开） ==========
router.get('/', getArticleList)

// ========== 单篇文章（公开）==========
router.get('/:id', getArticleById)

// 以下接口均需登录
router.use(authMiddleware())

// ========== 发布/编辑/删除（需 editor 或 admin）==========
router.post('/', checkRole(['editor', 'admin']), createArticle)
router.put('/:id', checkRole(['editor', 'admin']), updateArticle)
router.delete('/:id', checkRole(['editor', 'admin']), deleteArticle)

// ========== 我的文章 ==========
router.get('/my', checkRole(['editor', 'admin']), getMyArticles)

// ========== 回收站 ==========
router.get('/recycle', checkRole(['editor', 'admin']), getRecycleBin)
router.post('/:id/restore', restoreArticle)
router.delete('/:id/permanent', permanentDelete)

module.exports = router
