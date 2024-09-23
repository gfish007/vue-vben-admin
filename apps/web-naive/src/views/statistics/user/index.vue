<script setup lang="ts">
import type { FormRules } from 'naive-ui';

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
  NInput,
  NSpace,
  useMessage,
} from 'naive-ui';

import { disableUser, enableUser, queryUserList } from '#/api/app/user';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();

// 查询条件
const queryForm = reactive({
  appid: '',
  enabled: null,
  gmtCreate: null,
  gmtLogin: null,
  nickname: '',
  phone: '',
});

// 表格数据
const tableData = ref<any[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 表单规则
const rules: FormRules = {
  appid: { message: '请输入appid', required: true, trigger: 'blur' },
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
        gmtCreateBegin: queryForm.gmtCreate
          ? new Date(queryForm.gmtCreate[0])
          : null,
        gmtCreateEnd: queryForm.gmtCreate
          ? new Date(queryForm.gmtCreate[1])
          : null,
        gmtLoginBegin: queryForm.gmtLogin
          ? new Date(queryForm.gmtLogin[0])
          : null,
        gmtLoginEnd: queryForm.gmtLogin
          ? new Date(queryForm.gmtLogin[1])
          : null,
      },
    });
    tableData.value = result.records;
    pagination.total = result.total;
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 表格列定义
const columns = [
  { key: 'id', title: 'ID', width: 60 },
  { key: 'nickname', title: '昵称', width: 180 },
  { key: 'phoneNumber', title: '手机号', width: 180 },
  { key: 'gmtCreate', title: '创建时间', width: 180 },
  { key: 'gmtModified', title: '更新时间', width: 180 },
  {
    key: 'enabled',
    render: (row: any) => (row.enabled ? '正常' : '禁用'),
    title: '状态',
    width: 100,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: any) => {
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
                type: row.enabled ? 'error' : 'success',
              },
              { default: () => (row.enabled ? '禁用' : '启用') },
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
  Object.keys(queryForm).forEach((key) => {
    queryForm[key] = null;
  });
  console.log(queryForm);
  queryForm.gmtCreate = null;
  queryForm.gmtLogin = null;
  handleSearch();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 处理明细
const handleDetail = (row: any) => {
  // 这里可以实现查看用户详情的逻辑
  message.info(`查看用户 ${row.nickname} 的详情`);
};

// 处理启用/禁用
const handleToggleStatus = async (row: any) => {
  deleteLoading.value = true;
  try {
    if (row.enabled) {
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
    <NCard ref="queryCardRef" class="query-card mb-4 p-2">
      <NForm :model="queryForm" class="flex h-full items-center" inline>
        <NSpace
          :size="[24, 0]"
          align="center"
          class="w-full"
          justify="space-between"
        >
          <NSpace :size="24" align="center" wrap>
            <NFormItem
              class="mb-0 flex items-center"
              label="appid"
              label-placement="left"
              label-width="96"
            >
              <NInput v-model:value="queryForm.appid" class="w-52" />
            </NFormItem>
            <NFormItem
              class="mb-0 flex items-center"
              label="手机号"
              label-placement="left"
              label-width="96"
            >
              <NInput v-model:value="queryForm.phone" class="w-52" />
            </NFormItem>
            <NFormItem
              class="mb-0 flex items-center"
              label="昵称"
              label-placement="left"
              label-width="96"
            >
              <NInput v-model:value="queryForm.nickname" class="w-52" />
            </NFormItem>
            <NFormItem
              class="mb-0 flex items-center"
              label="状态"
              label-placement="left"
              label-width="96"
            >
              <NInput v-model:value="queryForm.enabled" class="w-52" />
            </NFormItem>
            <NFormItem
              class="mb-0 flex items-center"
              label="注册时间"
              label-placement="left"
              label-width="96"
            >
              <NDatePicker
                v-model:value="queryForm.gmtCreate"
                class="w-52"
                clearable
                type="daterange"
              />
            </NFormItem>
            <NFormItem
              class="mb-0 flex items-center"
              label="最近登录时间"
              label-placement="left"
              label-width="96"
            >
              <NDatePicker
                v-model:value="queryForm.gmtLogin"
                class="w-52"
                clearable
                type="daterange"
              />
            </NFormItem>
            <NButtonGroup>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
            </NButtonGroup>
          </NSpace>
        </NSpace>
      </NForm>
    </NCard>

    <NCard class="table-card flex flex-col overflow-hidden">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="900"
        :style="{ height: `${tableHeight}px` }"
        class="flex-1 overflow-auto"
        flex-height
        striped
        @update:page="handlePageChange"
      />
    </NCard>
  </Page>
</template>

<style scoped></style>
