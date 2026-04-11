<template>
  <div class="default-layout">
    <Header />
    <main class="main-content" :class="{ 'admin-page': isAdminRoute }">
      <router-view />
    </main>
    <Footer v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
</script>

<style lang="scss" scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fb;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(45, 106, 79, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(45, 106, 79, 0.02) 0%, transparent 50%);
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;

  &.admin-page {
    max-width: 100%;
    padding: 0;
    background: #f5f6f8;
  }

  @media (max-width: 1240px) {
    max-width: 100%;
    padding: 16px;

    &.admin-page {
      padding: 0;
    }
  }
}
</style>
