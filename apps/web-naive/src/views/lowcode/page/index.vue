<script setup lang="ts">
import type { PageApi } from '#/api/lowcode/page.types';

import { h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NDataTable,
  NForm,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { deletePages, queryPageList } from '#/api/lowcode/page';
import { useDynamicHeight } from '#/utils/heightUtils';

import PageModal from './components/PageModal.vue';

const message = useMessage();
const router = useRouter();

// 分页参数
const pagination = reactive({
  itemCount: 0, // 总条数
  onChange: (page: number) => {
    pagination.page = page;
    fetchData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    fetchData();
  },
  page: 1,
  pageCount: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50],
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,

  showSizePicker: true,
  total: 0, // 总条数
});

// 查询条件
const queryForm = reactive<PageApi.QueryParams['queryBody']>({
  pageCode: '',
  pageName: '',
  pageType: '',
});

// 表格数据
const tableData = ref<PageApi.PageRecord[]>([]);
const loading = ref(false);

// 加载数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryPageList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });

    console.log('API Response:', result);

    // 更新分页信息
    pagination.total = result.total;
    pagination.itemCount = result.total;
    pagination.pageCount = Math.ceil(result.total / pagination.pageSize);

    // 更新表格数据
    tableData.value = result.records;

    console.log('Table Data:', tableData.value);
    console.log('Pagination:', pagination);
  } catch (error) {
    console.error('获取数据失败:', error);
    message.error('获取数据失败');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理重置
const handleReset = () => {
  queryForm.pageCode = '';
  queryForm.pageName = '';
  queryForm.pageType = '';
  pagination.page = 1;
  fetchData();
};

// 删除
const handleDelete = async (ids: number[]) => {
  try {
    await deletePages(ids);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
};

// 页面类型选项
const pageTypeOptions = [
  { label: '表单页面', value: 'FORM' },
  { label: '列表页面', value: 'LIST' },
  { label: '详情页面', value: 'DETAIL' },
];

// 表格列定义
const columns = [
  {
    fixed: 'left',
    key: 'pageCode',
    title: '页面编码',
    width: 150,
  },
  {
    key: 'pageName',
    title: '页面名称',
    width: 150,
  },
  {
    key: 'pageType',
    render: (row: PageApi.PageRecord) => {
      const option = pageTypeOptions.find((opt) => opt.value === row.pageType);
      return option?.label || row.pageType;
    },
    title: '页面类型',
    width: 120,
  },
  {
    key: 'status',
    render: (row: PageApi.PageRecord) => {
      return row.status === 1 ? '启用' : '禁用';
    },
    title: '状态',
    width: 100,
  },
  {
    key: 'gmtCreate',
    title: '创建时间',
    width: 180,
  },
  {
    key: 'gmtModified',
    title: '更新时间',
    width: 180,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: PageApi.PageRecord) => {
      return h(
        NButtonGroup,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                onClick: () => handleDesign(row),
                type: 'primary',
              },
              { default: () => '设计' },
            ),
            h(
              NButton,
              {
                onClick: () => handleEdit(row),
                type: 'info',
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                onClick: () => handleDelete([row.id]),
                type: 'error',
              },
              { default: () => '删除' },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 200,
  },
];

// 弹窗相关
const showModal = ref(false);
const editingRecord = ref<Nullable<PageApi.PageRecord>>(null);

// 处理新增
const handleAdd = () => {
  editingRecord.value = null;
  showModal.value = true;
};

// 处理编辑
const handleEdit = (row: PageApi.PageRecord) => {
  editingRecord.value = row;
  showModal.value = true;
};

// 处理设计
const handleDesign = (row: PageApi.PageRecord) => {
  const pageCode = row.pageCode;
  const version = row.version || '1.0.0'; // 如果没有version就使用默认值
  console.log('Navigating to designer with:', { pageCode, version });
  router.push({
    name: 'LowcodeDesigner',
    query: {
      pageCode,
      version,
    },
  });
};

// 处理弹窗成功
const handleModalSuccess = () => {
  fetchData();
};

// 动态高度计算
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
  fetchData();
});
</script>

<template>
  <Page title="页面管理">
    <!-- 查询区域 -->
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card mb-1 px-2 py-1">
        <NForm :model="queryForm" inline>
          <NSpace
            :size="[24, 0]"
            align="center"
            justify="space-between"
            style="width: 100%"
          >
            <NSpace :size="24" align="center">
              <NInput
                v-model:value="queryForm.pageCode"
                class="query-input"
                placeholder="页面编码"
              />
              <NInput
                v-model:value="queryForm.pageName"
                class="query-input"
                placeholder="页面名称"
              />
              <NSelect
                v-model:value="queryForm.pageType"
                :options="pageTypeOptions"
                class="query-input"
                clearable
                placeholder="页面类型"
              />
            </NSpace>
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">新增页面</NButton>
            </NSpace>
          </NSpace>
        </NForm>
      </NCard>
    </div>

    <!-- 表格区域 -->
    <NCard>
      <div v-if="tableData.length === 0" style="margin-bottom: 16px">
        <p>暂无数据</p>
        <p>总记录数: {{ pagination.total }}</p>
      </div>

      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :max-height="`${tableHeight}px`"
        :min-height="`${tableHeight}px`"
        :pagination="pagination"
        :scroll-x="1100"
        :single-line="false"
        flex-height
        remote
        striped
      />
    </NCard>

    <!-- 编辑弹窗 -->
    <PageModal
      v-model:show="showModal"
      :editing-record="editingRecord"
      @success="fetchData"
    />
  </Page>
</template>

<style scoped>
.query-card {
  padding: 8px 16px;
  margin-bottom: 16px;
}

.query-card :deep(.n-form) {
  display: flex;
  align-items: center;
  height: 100%;
}

.query-input {
  width: 200px;
  margin: 8px 0;
}

.n-data-table {
  flex: 1;
  overflow: auto;
}
</style>
