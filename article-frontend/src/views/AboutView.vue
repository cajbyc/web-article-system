<template>
  <div class="about-view">
    <div class="about-card">
      <div class="about-hero">
        <h1>使用说明</h1>
        <p>快速了解系统的功能与角色</p>
      </div>

      <!-- 快速开始 -->
      <section class="about-section">
        <h3>快速开始</h3>
        <div class="steps-row">
          <div class="step-item" v-for="(step, i) in 4" :key="i">
            <div class="step-num">{{ i + 1 }}</div>
            <span class="step-text">{{ ['注册账号', '登录系统', '浏览文章', '互动交流'][i] }}</span>
            <svg v-if="i < 3" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#d4d4dc" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </section>

      <!-- 角色指南 -->
      <section class="about-section">
        <h3>角色使用指南</h3>
        <div class="role-cards">
          <div class="role-card" v-for="role in roleData" :key="role.role">
            <span class="role-name">{{ role.role }}</span>
            <span class="role-desc">{{ role.desc }}</span>
            <p class="role-guide">{{ role.guide }}</p>
          </div>
        </div>
      </section>

      <!-- 功能模块 -->
      <section class="about-section">
        <h3>功能模块</h3>
        <div class="module-grid">
          <div class="module-item" v-for="mod in modules" :key="mod.name">
            <span class="mod-icon">{{ mod.icon }}</span>
            <div>
              <span class="mod-name">{{ mod.name }}</span>
              <span class="mod-desc">{{ mod.desc }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="about-section">
        <h3>常见问题</h3>
        <el-collapse class="faq-list">
          <el-collapse-item title="如何注册账号？" name="1">
            点击导航栏「注册」，填写用户名、邮箱和密码即可完成注册。注册成功后自动跳转到登录页面。
          </el-collapse-item>
          <el-collapse-item title="如何发布文章？" name="2">
            只有编辑/作者角色的用户可以发布文章。登录后点击导航栏「写文章」，填写标题、内容、分类等信息，支持上传封面图片，点击发布即可。
          </el-collapse-item>
          <el-collapse-item title="如何点赞、收藏和评论？" name="3">
            登录后，在文章详情页可以点击点赞按钮、收藏按钮，也可以在底部评论区发表评论。
          </el-collapse-item>
          <el-collapse-item title="如何搜索文章？" name="4">
            使用顶部导航栏的搜索框，输入关键词后按回车，即可搜索文章标题和内容。
          </el-collapse-item>
          <el-collapse-item title="如何管理自己的文章？" name="5">
            编辑/作者角色登录后，点击「我的文章」查看所有已发布文章，可进行编辑、删除、状态切换等操作。删除的文章会进入回收站，可恢复。
          </el-collapse-item>
          <el-collapse-item title="管理员能做什么？" name="6">
            管理员登录后可进入「管理面板」，进行用户管理（禁用/启用）、文章审核、评论管理、查看数据统计和操作日志等。
          </el-collapse-item>
          <el-collapse-item title="忘记密码怎么办？" name="7">
            目前请联系管理员重置密码，或在登录页面尝试重新注册新账号。
          </el-collapse-item>
        </el-collapse>
      </section>

      <div class="about-footer">&copy; 2026 墨笔文章系统</div>
    </div>
  </div>
</template>

<script setup>
const roleData = [
  { role: '游客', desc: '未登录访客', guide: '可直接浏览首页文章列表和文章详情，使用搜索功能查找文章，点击「注册」创建账号' },
  { role: '普通用户', desc: '已注册用户', guide: '登录后可对文章进行点赞、收藏和评论，在「个人中心」修改资料，在「我的收藏」「我的评论」查看记录' },
  { role: '编辑/作者', desc: '内容创作者', guide: '点击「写文章」发布内容，「我的文章」管理已发布文章（编辑/删除/上下架），删除的文章可在「回收站」恢复' },
  { role: '管理员', desc: '系统运维者', guide: '进入「管理面板」进行用户管理（禁用/启用/角色分配）、文章审核、评论管理、查看数据统计和操作日志' },
]

const modules = [
  { icon: '🔐', name: '注册与登录', desc: '点击导航栏注册/登录，3次密码错误将锁定账号' },
  { icon: '📝', name: '文章浏览', desc: '首页/列表页浏览文章，支持按分类筛选和关键词搜索' },
  { icon: '✍️', name: '文章发布', desc: '编辑/作者角色可发布文章，支持富文本编辑和封面图片上传' },
  { icon: '❤️', name: '互动功能', desc: '登录后可对文章点赞、收藏、评论' },
  { icon: '👤', name: '个人中心', desc: '修改个人资料、查看我的收藏/评论/文章' },
  { icon: '⚙️', name: '管理后台', desc: '管理员专属：用户管理、文章审核、数据统计、日志查看' },
]
</script>

<style lang="scss" scoped>
.about-view {
  max-width: 900px;
  margin: 0 auto;
}

.about-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.about-hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #2d4a3e 100%);
  padding: 32px 28px;
  color: #fff;

  h1 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  p {
    font-size: 14px;
    opacity: 0.6;
  }
}

.about-section {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  &:last-of-type { border-bottom: none; }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 16px;
  }
}

// 步骤条
.steps-row {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  .step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #2d6a4f;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .step-text {
    font-size: 14px;
    color: #4a4a68;
    font-weight: 500;
  }
}

// 角色
.role-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.role-card {
  background: rgba(45, 106, 79, 0.02);
  border: 1px solid rgba(45, 106, 79, 0.06);
  border-radius: 10px;
  padding: 16px;

  .role-name {
    font-size: 15px;
    font-weight: 600;
    color: #2d6a4f;
    margin-right: 8px;
  }

  .role-desc {
    font-size: 12px;
    color: #8e8ea0;
  }

  .role-guide {
    margin-top: 8px;
    font-size: 13px;
    color: #4a4a68;
    line-height: 1.6;
  }
}

// 模块
.module-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.module-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  .mod-icon {
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .mod-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 2px;
  }

  .mod-desc {
    font-size: 12px;
    color: #8e8ea0;
    line-height: 1.5;
  }
}

// FAQ
.faq-list {
  border: none;

  :deep(.el-collapse-item__header) {
    font-size: 14px;
    font-weight: 500;
    color: #4a4a68;
    border-bottom-color: rgba(0, 0, 0, 0.04);
  }

  :deep(.el-collapse-item__content) {
    font-size: 14px;
    color: #4a4a68;
    line-height: 1.7;
    padding-bottom: 12px;
  }
}

.about-footer {
  text-align: center;
  padding: 16px;
  color: #b8b8c8;
  font-size: 12px;
}
</style>
