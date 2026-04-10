<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="brand-name">随笔</span>
          <span class="brand-desc">多角色文章管理系统</span>
        </div>
        <div class="footer-links">
          <router-link to="/articles">文章</router-link>
          <router-link to="/about">使用说明</router-link>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 随笔文章系统</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.app-footer {
  background: #1a1a2e;
  color: #8e8ea0;
  margin-top: auto;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;

  @media (max-width: 1240px) {
    padding: 0 16px;
  }
}

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;

  .brand-name {
    font-size: 16px;
    font-weight: 700;
    color: #f0f0f5;
    letter-spacing: -0.3px;
  }

  .brand-desc {
    font-size: 13px;
    color: #5e5e72;
  }
}

.footer-links {
  display: flex;
  gap: 20px;

  a {
    color: #8e8ea0;
    font-size: 13px;
    transition: color 0.2s;

    &:hover {
      color: #b7e4c7;
    }
  }
}

.footer-bottom {
  padding: 14px 0;
  font-size: 12px;
  color: #4a4a5e;
}
</style>
