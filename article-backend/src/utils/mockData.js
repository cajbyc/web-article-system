/**
 * 共享内存模拟数据（数据库不可用时使用）
 * 所有 controller 引用同一份数据，保证注册后的用户在各模块一致
 */

const mockCategories = [
  { id: 1, name: '学习笔记', sort: 1 },
  { id: 2, name: '课程报告', sort: 2 },
  { id: 3, name: '技术分享', sort: 3 },
  { id: 4, name: '校园随笔', sort: 4 },
  { id: 5, name: '学术交流', sort: 5 },
]

const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$MOCK_HASHED_PASSWORD_FOR_ADMIN',
    nickname: '管理员',
    email: 'admin@test.com',
    avatar: null,
    role: 'admin',
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let nextUserId = 2

const mockArticles = [
  {
    id: 1, title: '如何高效整理课堂笔记', cover: null, categoryId: 1, status: 'published',
    content: `# 如何高效整理课堂笔记\n\n课堂笔记是学习过程中不可或缺的环节，好的笔记习惯能极大提升复习效率。以下是我在长期学习中总结的一些方法。\n\n## 1. 康奈尔笔记法\n\n将页面分为三个区域：右侧大区域记录课堂内容，左侧窄栏写关键词和问题，底部写总结。这种结构迫使你在课后主动回顾和提炼要点。\n\n## 2. 思维导图法\n\n对于逻辑性强的课程（如哲学、历史），用思维导图将概念之间的关系可视化。推荐工具：XMind、幕布。\n\n## 3. 笔记数字化\n\n使用 Notion、Obsidian 等工具将笔记电子化，便于搜索和跨设备同步。同时支持插入图片、公式和代码块。\n\n## 4. 定期回顾\n\n根据艾宾浩斯遗忘曲线，在1天、3天、7天、30天后分别复习一次，记忆保持率可达90%以上。\n\n> 记笔记的目的不是记录一切，而是帮你理解和回忆核心内容。`,
    viewCount: 156, likeCount: 12, collectCount: 9,
    userId: 1, createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 2, title: '数据结构课程实验报告', cover: null, categoryId: 2, status: 'published',
    content: `# 数据结构课程实验报告\n\n## 实验目的\n\n掌握二叉树的遍历算法（前序、中序、后序、层序），理解递归与非递归实现的区别。\n\n## 实验内容\n\n### 1. 二叉树的构建\n\n使用递归方式根据前序遍历序列构建二叉树，空节点用 '#' 表示。\n\n\`\`\`cpp\nTreeNode* buildTree(string& pre, int& idx) {\n    if (idx >= pre.size() || pre[idx] == '#') {\n        idx++;\n        return nullptr;\n    }\n    TreeNode* node = new TreeNode(pre[idx++] - '0');\n    node->left = buildTree(pre, idx);\n    node->right = buildTree(pre, idx);\n    return node;\n}\n\`\`\`\n\n### 2. 非递归中序遍历\n\n使用栈模拟递归调用过程，空间复杂度 O(h)，h 为树高。\n\n### 3. 层序遍历\n\n借助队列实现，按层逐个访问节点。\n\n## 实验结论\n\n递归实现简洁但可能栈溢出；非递归实现更适合处理大规模数据。层序遍历在求树宽、找最短路径等场景中有重要应用。`,
    viewCount: 89, likeCount: 6, collectCount: 3,
    userId: 1, createdAt: '2026-04-03T14:30:00Z', updatedAt: '2026-04-03T14:30:00Z',
  },
  {
    id: 3, title: 'Git 工作流与团队协作实践', cover: null, categoryId: 3, status: 'published',
    content: `# Git 工作流与团队协作实践\n\n在多人协作开发中，规范的 Git 工作流是项目顺利推进的保障。本文介绍几种主流工作流及实践经验。\n\n## Git Flow\n\n最经典的工作流，适合发布周期较长的项目：\n- \`main\`：生产分支，始终保持可部署状态\n- \`develop\`：开发主分支\n- \`feature/*\`：功能分支，从 develop 创建\n- \`release/*\`：预发布分支\n- \`hotfix/*\`：紧急修复分支\n\n## GitHub Flow\n\n更轻量的工作流，适合持续部署的项目：\n1. 从 main 创建分支\n2. 提交修改并频繁推送\n3. 创建 Pull Request\n4. 代码评审\n5. 合并到 main 并部署\n\n## 实践建议\n\n- 提交信息遵循 Conventional Commits 规范\n- 每个 PR 控制在 200 行以内，便于 Review\n- 使用 CI/CD 自动跑测试和 lint\n- 保护主分支，禁止直接 push\n\n> 好的工作流不是选最复杂的，而是选最适合团队的。`,
    viewCount: 203, likeCount: 18, collectCount: 11,
    userId: 1, createdAt: '2026-04-05T10:15:00Z', updatedAt: '2026-04-05T10:15:00Z',
  },
  {
    id: 4, title: '校园里的春天', cover: null, categoryId: 4, status: 'published',
    content: `# 校园里的春天\n\n三月的风带着些许暖意，校园里的樱花悄然盛开。从图书馆的窗户望出去，粉白色的花瓣在阳光下如雪般纷飞。\n\n清晨的林荫道上，晨读的同学三三两两。有人念着英语，有人低声背诵古诗，偶尔传来几声鸟鸣，与书声交织成最朴素的乐章。\n\n午后的草坪上，几只校园猫懒洋洋地晒着太阳。有人带了猫粮，蹲在旁边轻轻呼唤。猫咪半眯着眼，尾巴偶尔甩动，像是对这份善意的淡淡回应。\n\n傍晚时分，操场上渐渐热闹起来。跑步的、打球的、散步的，每个人都以自己的节奏度过这一天最后的时光。夕阳将教学楼的影子拉得很长，钟楼的剪影在橘红色天幕下格外好看。\n\n春天总是短暂的，但这些细碎的瞬间会在记忆里停留很久。多年后想起大学时光，最先浮现的或许不是课本上的内容，而是某个春日午后，樱花树下吹过的那阵风。`,
    viewCount: 312, likeCount: 24, collectCount: 16,
    userId: 1, createdAt: '2026-04-07T16:00:00Z', updatedAt: '2026-04-07T16:00:00Z',
  },
  {
    id: 5, title: '浅谈大语言模型的涌现能力', cover: null, categoryId: 5, status: 'published',
    content: `# 浅谈大语言模型的涌现能力\n\n## 什么是涌现能力？\n\n涌现（Emergence）是指系统中出现个体层面不具备的宏观特性。在大语言模型（LLM）中，涌现能力指模型参数规模达到一定阈值后，突然表现出小模型所没有的能力。\n\n## 典型涌现现象\n\n1. **思维链推理**：当参数量超过约 60B 时，模型在复杂推理任务上的表现突然跃升\n2. **少样本学习**：仅给几个示例就能理解并完成新任务\n3. **代码生成**：未经专门训练却能编写和调试代码\n4. **跨语言迁移**：在英语上训练的能力可以迁移到中文等其他语言\n\n## 争议与反思\n\n部分研究者认为涌现可能是评估方法的假象：\n- 精确匹配指标使得小模型的"部分正确"得零分\n- 换用连续指标后，能力提升更趋平滑\n\n但无论如何，大模型在实用层面的能力飞跃是真实的，争论的焦点更多在于理论解释。\n\n## 未来展望\n\n涌现能力的机理仍是开放问题。理解其本质，对于构建更高效、更可控的 AI 系统至关重要。或许，答案藏在规模与结构之间某个尚未被发现的平衡点上。`,
    viewCount: 178, likeCount: 14, collectCount: 7,
    userId: 1, createdAt: '2026-04-09T11:30:00Z', updatedAt: '2026-04-09T11:30:00Z',
  },
]

let nextArticleId = 6

const mockLikes = new Set()      // userId-articleId
const mockCollects = new Set()   // userId-articleId

let nextCommentId = 1
const mockComments = []

const mockRecycleBin = []

// 角色申请记录
let nextApplicationId = 1
const mockRoleApplications = [] // { id, userId, username, nickname, fromRole, toRole, reason, status: 'pending'|'approved'|'rejected', reviewedBy, reviewNote, createdAt, reviewedAt }

module.exports = {
  mockCategories,
  mockUsers,
  nextUserId,
  getNextUserId() { return nextUserId++ },
  mockArticles,
  nextArticleId,
  getNextArticleId() { return nextArticleId++ },
  mockLikes,
  mockCollects,
  nextCommentId,
  getNextCommentId() { return nextCommentId++ },
  mockComments,
  mockRecycleBin,
  mockRoleApplications,
  nextApplicationId,
  getNextApplicationId() { return nextApplicationId++ },
}
