<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <router-link to="/" class="site-link">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span class="site-name">文章系统</span>
        </router-link>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">管理后台</div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </span>
          <span class="nav-label">返回前台</span>
        </router-link>
      </div>
    </aside>

    <main class="admin-main">
      <div class="admin-breadcrumb">
        <router-link to="/admin/dashboard" class="breadcrumb-link">管理后台</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ currentPageTitle }}</span>
      </div>
      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  {
    path: '/admin/dashboard',
    label: '数据看板',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  },
  {
    path: '/admin/users',
    label: '用户管理',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  },
  {
    path: '/admin/articles',
    label: '文章管理',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  },
  {
    path: '/admin/comments',
    label: '评论管理',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  },
  {
    path: '/admin/categories',
    label: '分类管理',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
  },
  {
    path: '/admin/applications',
    label: '角色审批',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>',
  },
  {
    path: '/admin/logs',
    label: '操作日志',
    icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  },
]

const pageTitles = {
  '/admin/dashboard': '数据看板',
  '/admin/users': '用户管理',
  '/admin/articles': '文章管理',
  '/admin/comments': '评论管理',
  '/admin/categories': '分类管理',
  '/admin/applications': '角色审批',
  '/admin/logs': '操作日志',
}

const currentPageTitle = computed(() => pageTitles[route.path] || '管理后台')
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - 58px);
}

.admin-sidebar {
  width: 220px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: calc(100vh - 58px);
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.site-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e0e0ec;
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  transition: color 0.2s;

  &:hover { color: #fff; }
}

.site-name {
  letter-spacing: 0.3px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 10px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 2px;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.85);
  }

  &.active {
    background: rgba(45, 106, 79, 0.25);
    color: #74c69d;
  }

  .nav-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .nav-label {
    white-space: nowrap;
  }
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
}

.admin-breadcrumb {
  padding: 16px 28px;
  font-size: 13px;
  color: #8e8ea0;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  .breadcrumb-link {
    color: #8e8ea0;
    text-decoration: none;
    &:hover { color: #2d6a4f; }
  }

  .breadcrumb-sep {
    margin: 0 6px;
    color: #d0d0d8;
  }

  .breadcrumb-current {
    color: #1a1a2e;
    font-weight: 600;
  }
}

.admin-content {
  flex: 1;
  padding: 24px 28px;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    height: auto;
    position: relative;
    flex-direction: row;
    overflow-x: auto;
    padding: 0;

    .sidebar-header {
      display: none;
    }

    .sidebar-nav {
      display: flex;
      gap: 0;
      padding: 8px;
    }

    .nav-section-title {
      display: none;
    }

    .nav-item {
      padding: 8px 12px;
      font-size: 13px;
      white-space: nowrap;
      margin-bottom: 0;
    }
  }

  .sidebar-footer {
    display: none;
  }

  .admin-content {
    padding: 16px;
  }
}
</style>
