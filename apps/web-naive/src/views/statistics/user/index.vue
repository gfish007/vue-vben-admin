<script setup lang="ts">
import type { FormRules } from 'naive-ui';

import type { UserApi } from '#/api/app/user.types';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { disableUser, enableUser, queryUserList } from '#/api/app/user';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();

// 查询条件
const queryForm = reactive<UserApi.QueryParams['queryBody']>({
  appid: undefined,
  enabled: null,
  gmtCreateBegin: null,
  gmtCreateEnd: null,
  gmtLoginBegin: null,
  gmtLoginEnd: null,
  nickname: '',
  phone: '',
});

// 表格数据
const tableData = ref<UserApi.UserRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  itemCount: 0,
  showSizePicker: true,
  showQuickJumper: true,
  pageSizes: [10, 20, 50],
});

// 表单规则
const rules: FormRules = {
  nickname: { message: '请输入用户昵称', required: true, trigger: 'blur' },
  phone: { message: '请输入手机号', required: true, trigger: 'blur' },
};

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryUserList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: {
        ...queryForm,
        gmtCreateBegin: queryForm.gmtCreateBegin ? new Date(queryForm.gmtCreateBegin) : undefined,
        gmtCreateEnd: queryForm.gmtCreateEnd ? new Date(queryForm.gmtCreateEnd) : undefined,
        gmtLoginBegin: queryForm.gmtLoginBegin ? new Date(queryForm.gmtLoginBegin) : undefined,
        gmtLoginEnd: queryForm.gmtLoginEnd ? new Date(queryForm.gmtLoginEnd) : undefined,
      },
    });
    tableData.value = result.records;
    pagination.total = result.total;
    pagination.itemCount = result.total;
    pagination.pageSize = result.size;
    // 确保页码不会超过总页数
    const totalPages = Math.ceil(result.total / pagination.pageSize);
    if (pagination.page > totalPages && totalPages > 0) {
      pagination.page = totalPages;
    }
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 表格列定义
const columns = [
  { 
    key: 'avatar', 
    title: '头像', 
    width: 80,
    render: (row: UserApi.UserRecord) => {
      return h(NImage, {
        src: row.avatar || '',
        alt: row.nickname,
        width: 40,
        height: 40,
        style: {
          borderRadius: '50%',
        },
        onError: (e: any) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPHBhdGggZD0iTTIwIDExLjVDMTguMDQ0NCAxMS41IDE2LjQ1IDEzLjA5NDQgMTYuNDUgMTVDMTYuNDUgMTYuOTA1NiAxOC4wNDQ0IDE4LjUgMjAgMTguNUMyMS45NTU2IDE4LjUgMjMuNTUgMTYuOTA1NiAyMy41NSAxNUMyMy41NSAxMy4wOTQ0IDIxLjk1NTYgMTEuNSAyMCAxMS41WiIgZmlsbD0iIzhDOEM4QyIvPgo8cGF0aCBkPSJNMTUuNSAyNC41QzE1LjUgMjMuNjc5NSAxNS44MjA1IDIzLjM1ODkgMTYuMjQyNiAyMi45MzY4QzE2LjY2NDcgMjIuNTE0NyAxNy4yMjQ0IDIyLjE5NDEgMTcuODQ3OSAyMi4xOTQxSDIyLjE1MjFDMjIuNzc1NiAyMi4xOTQxIDIzLjMzNTMgMjIuNTE0NyAyMy43NTc0IDIyLjkzNjhDMjQuMTc5NSAyMy4zNTg5IDI0LjUgMjMuNjc5NSAyNC41IDI0LjVDMjQuNSAyNS4wMzA0IDI0LjI4OTMgMjUuNTM5MSAyMy45MTQyIDI1LjkxNDJDMjMuNTM5MSAyNi4yODkzIDIzLjAzMDQgMjYuNSAyMi41IDI2LjVIMTcuNUMxNi45Njk2IDI2LjUgMTYuNDYwOSAyNi4yODkzIDE2LjA4NTggMjUuOTE0MkMxNS43MTA3IDI1LjUzOTEgMTUuNSAyNS4wMzA0IDE1LjUgMjQuNVoiIGZpbGw9IiM4QzhDOEMiLz4KPC9zdmc+';
        }
      });
    }
  },
  { key: 'nickname', title: '昵称', width: 120 },
  { key: 'phone', title: '手机号', width: 120 },
  { key: 'appid', title: '小程序id', width: 150 },
  { key: 'openid', title: 'openid', width: 180 },
  { key: 'gmtCreate', title: '创建时间', width: 180 },
  { key: 'gmtModified', title: '更新时间', width: 180 },
  { key: 'gmtLogin', title: '最近登录', width: 180 },
  {
    key: 'enabled',
    render: (row: UserApi.UserRecord) => (row.enabled === 1 ? '正常' : '禁用'),
    title: '状态',
    width: 80,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: UserApi.UserRecord) => {
      return h(
        NButtonGroup,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                loading: editLoading.value,
                onClick: () => handleDetail(row),
                type: 'info',
              },
              { default: () => '明细' },
            ),
            h(
              NButton,
              {
                loading: deleteLoading.value,
                onClick: () => handleToggleStatus(row),
                type: row.enabled === 1 ? 'error' : 'success',
              },
              { default: () => (row.enabled === 1 ? '禁用' : '启用') },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 150,
  },
];

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理重置
const handleReset = () => {
  queryForm.appid = undefined;
  queryForm.enabled = null;
  queryForm.gmtCreateBegin = null;
  queryForm.gmtCreateEnd = null;
  queryForm.gmtLoginBegin = null;
  queryForm.gmtLoginEnd = null;
  queryForm.nickname = '';
  queryForm.phone = '';
  handleSearch();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 处理分页大小变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
};

// 处理明细
const handleDetail = (row: UserApi.UserRecord) => {
  // 这里可以实现查看用户详情的逻辑
  message.info(`查看用户 ${row.nickname} 的详情`);
};

// 处理启用/禁用
const handleToggleStatus = async (row: UserApi.UserRecord) => {
  deleteLoading.value = true;
  try {
    if (row.enabled === 1) {
      await disableUser(row.id);
      message.success('禁用成功');
    } else {
      await enableUser(row.id);
      message.success('启用成功');
    }
    fetchData();
  } catch {
    message.error('操作失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 初始加载数据
fetchData();

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});
</script>

<template>
  <Page description="统计用户信息" title="用户统计">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card">
        <NForm :model="queryForm" inline>
          <NSpace
            :size="[24, 0]"
            align="center"
            justify="space-between"
            style="width: 100%"
          >
            <NSpace :size="24" align="center">
              <NFormItem label="手机号" label-placement="left">
                <NInput v-model:value="queryForm.phone" style="width: 150px" />
              </NFormItem>
              <NFormItem label="昵称" label-placement="left">
                <NInput v-model:value="queryForm.nickname" style="width: 150px" />
              </NFormItem>
              <NFormItem label="状态" label-placement="left">
                <NSelect
                  v-model:value="queryForm.enabled"
                  :options="[
                    { label: '正常', value: 1 },
                    { label: '禁用', value: 0 },
                  ]"
                  clearable
                  style="width: 120px"
                />
              </NFormItem>
              <NFormItem label="注册时间" label-placement="left">
                <NDatePicker
                  v-model:value="queryForm.gmtCreateBegin"
                  placeholder="开始时间"
                  style="width: 150px"
                  type="date"
                />
                <span style="margin: 0 8px">-</span>
                <NDatePicker
                  v-model:value="queryForm.gmtCreateEnd"
                  placeholder="结束时间"
                  style="width: 150px"
                  type="date"
                />
              </NFormItem>
            </NSpace>
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
            </NSpace>
          </NSpace>
        </NForm>
      </NCard>
    </div>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :max-height="`${tableHeight}px`"
        :min-height="`${tableHeight}px`"
        :scroll-x="1300"
        striped
      />
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
        <div>共 {{ pagination.itemCount }} 条记录</div>
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.pageSizes"
          show-size-picker
          show-quick-jumper
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </NCard>
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

.query-card :deep(.n-form-item) {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.query-card :deep(.n-form-item-label) {
  height: auto;
  padding: 0 8px 0 0;
  line-height: normal;
}

.query-card :deep(.n-form-item-blank) {
  display: flex;
  align-items: center;
}

.query-card :deep(.n-button-group) {
  display: flex;
}

.query-card :deep(.n-button-group .n-button) {
  margin-right: 0;
}

.n-data-table {
  flex: 1;
}
</style>
