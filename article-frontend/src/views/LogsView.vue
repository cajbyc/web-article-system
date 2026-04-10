<template>
  <div class="logs-view">
    <el-page-header @back="$router.push('/admin/dashboard')" title="返回看板">
      <template #content><span class="page-title">操作日志</span></template>
    </el-page-header>

    <div class="toolbar">
      <el-input
        v-model="searchOperator"
        placeholder="搜索操作人..."
        clearable
        style="width: 200px;"
        @keyup.enter="fetchData"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DDTHH:mm:ss"
        style="width: 320px;"
        @change="fetchData"
      />
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe style="margin-top: 16px;">
      <el-table-column prop="id" label="ID" width="65" />
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column prop="content" label="操作描述" min-width="350" show-overflow-tooltip />
      <el-table-column prop="ip" label="IP地址" width="140" />
      <el-table-column label="操作时间" width="175">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchData"
      />
    </div>

    <el-empty v-if="!loading && list.length === 0 && !searchOperator && !dateRange" description="暂无操作日志记录" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getOperationLogs } from '../api/admin'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20
const searchOperator = ref('')
const dateRange = ref([])

onMounted(fetchData)

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize,
      operator: searchOperator.value,
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await getOperationLogs(params)
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('获取日志列表失败:', err)
  } finally {
    loading.value = false
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.logs-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
