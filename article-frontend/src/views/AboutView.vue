<template>
  <div class="about-view">
    <el-card shadow="never">
      <template #header>
        <h2>使用说明</h2>
      </template>

      <h3>快速开始</h3>
      <el-steps :active="4" finish-status="success" simple style="margin-top: 12px;">
        <el-step title="注册账号" />
        <el-step title="登录系统" />
        <el-step title="浏览文章" />
        <el-step title="互动交流" />
      </el-steps>

      <el-divider />

      <h3>角色使用指南</h3>
      <el-table :data="roleData" border stripe style="margin-top: 12px;">
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column prop="desc" label="说明" width="140" />
        <el-table-column prop="guide" label="操作指南" />
      </el-table>

      <el-divider />

      <h3>常用功能说明</h3>
      <el-row :gutter="16" style="margin-top: 12px;">
        <el-col :span="8" :xs="12" v-for="mod in modules" :key="mod.name">
          <div class="module-card">
            <span class="mod-icon">{{ mod.icon }}</span>
            <span class="mod-name">{{ mod.name }}</span>
            <span class="mod-desc">{{ mod.desc }}</span>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <h3>常见问题</h3>
      <el-collapse style="margin-top: 12px;">
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
          使用顶部导航栏的搜索框，输入关键词后按回车，即可搜索文章标题和分类。
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

      <el-divider />

      <p class="footer-note">&copy;2026 文章管理系统 · 毕业设计专用 · 基于 Vercel 部署</p>
    </el-card>
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

  h2 { margin: 0; font-size: 22px; }
  h3 { font-size: 18px; color: #303133; }
}

.module-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .mod-icon { font-size: 28px; }
  .mod-name { font-size: 15px; font-weight: 600; color: #303133; }
  .mod-desc { font-size: 13px; color: #909399; }
}

.footer-note {
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
