<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';

import type { LiveAccountApi } from '#/api/core/liveAccount.types';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NConfigProvider,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import {
  deleteLiveAccounts,
  getLiveAccountDetail,
  queryLiveAccountList,
  saveOrUpdateLiveAccount,
} from '#/api/core/liveAccount';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

const message = useMessage();

// 查询条件
const queryForm = reactive<LiveAccountApi.QueryParams['queryBody']>({
  accountName: '',
  channel: '',
  shopName: '',
});

// 表格数据
const tableData = ref<LiveAccountApi.LiveAccountRecord[]>([]);
const loading = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 1,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  // 添加这些必要的属性
  itemCount: 0,  // 总条数
  total: 0,      // 总条数
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,
  
  onChange: (page: number) => {
    pagination.page = page;
    fetchData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    fetchData();
  }
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref<LiveAccountApi.LiveAccountRecord>({
  accountName: '',
  channel: '',
  department: '',
  id: 0,
  shopName: '',
  uid: '',
});

// 表单规则
const rules: FormRules = {
  accountName: { message: '请输入账号', required: true, trigger: 'blur' },
  channel: { message: '请输入渠道', required: true, trigger: 'blur' },
  department: { message: '请输入部门', required: true, trigger: 'blur' },
  shopName: { message: '请输入店铺名', required: true, trigger: 'blur' },
  uid: { message: '请输入账号UID', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 状态管理
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 在 script setup 中添加渠道选项常量
const channelOptions = [
  { label: '抖音', value: 'DY' },
  { label: '快手', value: 'KS' },
  { label: '视频号', value: 'SPH' },
];

// 修改 handleEdit 函数
const handleEdit = async (row: LiveAccountApi.LiveAccountRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑直播账户';
    const detail = await getLiveAccountDetail(row.id);
    editingRecord.value = { ...detail };
    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: LiveAccountApi.LiveAccountRecord) => {
  deleteLoading.value = true;
  try {
    await deleteLiveAccounts([row.id]);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();
    await saveOrUpdateLiveAccount(editingRecord.value);
    message.success(editingRecord.value.id ? '编辑成功' : '新增成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请检查表单');
  } finally {
    saveLoading.value = false;
  }
};


const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryLiveAccountList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });

    // 更新分页信息
    pagination.total = result.total;
    pagination.itemCount = result.total;  // 这个很重要
    pagination.pageCount = result.pages;  // 总页数
    
    if (Array.isArray(result.records)) {
      tableData.value = result.records;
    } else {
      message.error('返回数据格式错误');
      tableData.value = [];
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    message.error('获取数据失败');
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

// 表格列定义
const columns = [
  {
    fixed: 'left',
    key: 'accountName',
    title: '账号',
    width: 150,
  },
  {
    key: 'uid',
    title: '账号UID',
    width: 150,
  },
  {
    key: 'department',
    title: '部门',
    width: 150,
  },
  {
    key: 'channel',
    render: (row: LiveAccountApi.LiveAccountRecord) => {
      const option = channelOptions.find((opt) => opt.value === row.channel);
      return option?.label || row.channel;
    },
    title: '渠道',
    width: 150,
  },
  {
    key: 'shopName',
    title: '店铺名',
    width: 150,
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
    render: (row: LiveAccountApi.LiveAccountRecord) => {
      return h(
        NButtonGroup,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                loading: editLoading.value,
                onClick: () => handleEdit(row),
                type: 'success',
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                loading: deleteLoading.value,
                onClick: () => handleDelete(row),
                type: 'error',
              },
              { default: () => '删除' },
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

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增直播账户';
  editingRecord.value = {
    accountName: '',
    channel: '',
    department: '',
    id: null,
    shopName: '',
    uid: '',
  };
  showModal.value = true;
};

// 初始加载数据
fetchData();

// 动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});
</script>

<template>
  <Page description="管理系统中的直播账户信息" title="直播账户管理">
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
              <NFormItem label="账号" label-placement="left">
                <NInput
                  v-model:value="queryForm.accountName"
                  style="width: 200px"
                />
              </NFormItem>
              <NFormItem label="渠道" label-placement="left">
                <NSelect
                  v-model:value="queryForm.channel"
                  :options="channelOptions"
                  clearable
                  style="width: 200px"
                />
              </NFormItem>
              <NFormItem label="店铺名" label-placement="left">
                <NInput
                  v-model:value="queryForm.shopName"
                  style="width: 200px"
                />
              </NFormItem>
            </NSpace>
            <NSpace>
              <NConfigProvider :theme="purpleTheme">
                <NButton type="primary" @click="handleSearch">搜索</NButton>
              </NConfigProvider>
              <NButton type="success" @click="handleAdd">新增账户</NButton>
            </NSpace>
          </NSpace>
        </NForm>
      </NCard>
    </div>

    <NCard>
      <div v-if="tableData.length === 0" style="margin-bottom: 16px">
        <p>No data available</p>
        <p>Total records: {{ pagination.total }}</p>
      </div>

      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :max-height="`${tableHeight}px`"
        :min-height="`${tableHeight}px`"
        remote
        :pagination="pagination"
        :scroll-x="1100"
        :single-line="false"
        flex-height
        striped
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 600px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="账号" path="accountName">
          <NInput v-model:value="editingRecord.accountName" />
        </NFormItem>
        <NFormItem label="账号UID" path="uid">
          <NInput v-model:value="editingRecord.uid" />
        </NFormItem>
        <NFormItem label="部门" path="department">
          <NInput v-model:value="editingRecord.department" />
        </NFormItem>
        <NFormItem label="渠道" path="channel">
          <NSelect
            v-model:value="editingRecord.channel"
            :disabled="!!editingRecord.id"
            :options="channelOptions"
            required
          />
        </NFormItem>
        <NFormItem label="店铺名" path="shopName">
          <NInput v-model:value="editingRecord.shopName" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NConfigProvider :theme="purpleTheme">
            <NButton :loading="saveLoading" type="primary" @click="handleSave">
              保存
            </NButton>
          </NConfigProvider>
        </NSpace>
      </template>
    </NModal>
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
  margin-bottom: 0;
}

.n-data-table {
  flex: 1;
  overflow: auto;
}
</style>
