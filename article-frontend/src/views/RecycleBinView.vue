<template>
  <div class="recycle-bin-view">
    <div class="page-card">
      <div class="page-header">
        <h2>回收站</h2>
      </div>

      <el-alert title="回收站中的文章将在 30 天后自动清除" type="warning" show-icon :closable="false" style="margin-bottom: 16px; border-radius: 8px;" />

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="删除时间" width="170">
          <template #default="{ row }">{{ formatTime(row.deleteAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确定恢复此文章？" @confirm="handleRestore(row.id)">
              <template #reference>
                <el-button size="small" link type="primary">恢复</el-button>
              </template>
            </el-popconfirm>
            <el-popconfirm title="彻底删除后无法恢复，确定吗？" @confirm="handlePermanent(row.id)">
              <template #reference>
                <el-button size="small" link type="danger">彻底删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          background
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="(p) => { page = p; fetchData() }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRecycleBin, restoreArticle, permanentDelete } from '../api/article'

const loading = ref(false)
const list = ref([])
const page = ref(1)
const pageSize = 10
const total = ref(0)

onMounted(() => fetchData())

async function fetchData() {
  loading.value = true
  try {
    const res = await getRecycleBin({ page: page.value, pageSize })
    list.value = res.data.list
    total.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function handleRestore(id) {
  await restoreArticle(id)
  ElMessage.success('文章已恢复')
  fetchData()
}

async function handlePermanent(id) {
  await permanentDelete(id)
  ElMessage.warning('已彻底删除')
  fetchData()
}

function statusLabel(status) {
  const map = { draft: '草稿', published: '已发布', private: '私密' }
  return map[status] || '-'
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.recycle-bin-view {
  max-width: 1100px;
  margin: 0 auto;
}

.page-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 24px 28px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
    letter-spacing: -0.3px;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
