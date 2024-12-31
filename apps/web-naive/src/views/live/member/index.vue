<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';

import type { LiveMemberApi } from '#/api/core/liveMember.types';

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
  NTag,
  useMessage,
} from 'naive-ui';

import {
  deleteLiveMembers,
  getLiveMemberDetail,
  queryLiveMemberList,
  saveOrUpdateLiveMember,
} from '#/api/core/liveMember';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

const message = useMessage();

// 角色选项
const roleOptions = [
  { label: '直播', value: 'ZB' },
  { label: '场控', value: 'CK' },
];

// 查询条件
const queryForm = reactive<LiveMemberApi.QueryParams['queryBody']>({
  department: '',
  name: '',
  role: undefined,
});

// 表格数据
const tableData = ref<LiveMemberApi.LiveMemberRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const editingRecord = ref<LiveMemberApi.LiveMemberRecord>({
  department: '',
  id: null,
  job: '',
  memberId: 0,
  name: '',
  phone: '',
  role: 'ZB',
});

// 表单规则
const rules: FormRules = {
  department: { message: '请输入部门', required: true, trigger: 'blur' },
  job: { message: '请输入岗位', required: true, trigger: 'blur' },
  memberId: { message: '请输入成员ID', required: true, trigger: 'blur' },
  name: { message: '请输入名称', required: true, trigger: 'blur' },
  phone: {
    message: '请输入正确的手机号',
    pattern: /^1[3-9]\d{9}$/,
    required: true,
    trigger: 'blur',
  },
  role: { message: '请选择角色', required: true, trigger: 'change' },
};

const formRef = ref<FormInst | null>(null);

// 状态管理
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 修改 handleEdit 函数
const handleEdit = async (row: LiveMemberApi.LiveMemberRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑直播成员';
    const detail = await getLiveMemberDetail(row.id);
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
const handleDelete = async (row: LiveMemberApi.LiveMemberRecord) => {
  deleteLoading.value = true;
  try {
    await deleteLiveMembers([row.id]);
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
    await saveOrUpdateLiveMember(editingRecord.value);
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

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryLiveMemberList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });

    if (Array.isArray(result.records)) {
      tableData.value = result.records;
      pagination.total = result.total;
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
    key: 'name',
    title: '名称',
    width: 150,
  },
  {
    key: 'department',
    title: '部门',
    width: 150,
  },
  {
    key: 'job',
    title: '岗位',
    width: 150,
  },
  {
    key: 'phone',
    title: '手机号',
    width: 150,
  },
  {
    key: 'role',
    render: (row: LiveMemberApi.LiveMemberRecord) => {
      const option = roleOptions.find((opt) => opt.value === row.role);
      return h(
        NTag,
        { type: row.role === 'ZB' ? 'success' : 'info' },
        { default: () => option?.label || row.role },
      );
    },
    title: '角色',
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
    render: (row: LiveMemberApi.LiveMemberRecord) => {
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

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增直播成员';
  editingRecord.value = {
    department: '',
    id: null,
    job: '',
    memberId: 0,
    name: '',
    phone: '',
    role: 'ZB',
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
  <Page description="管理系统中的直播成员信息" title="直播成员管理">
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
              <NFormItem label="名称" label-placement="left">
                <NInput v-model:value="queryForm.name" style="width: 200px" />
              </NFormItem>
              <NFormItem label="部门" label-placement="left">
                <NInput
                  v-model:value="queryForm.department"
                  style="width: 200px"
                />
              </NFormItem>
              <NFormItem label="角色" label-placement="left">
                <NSelect
                  v-model:value="queryForm.role"
                  :options="roleOptions"
                  clearable
                  style="width: 200px"
                />
              </NFormItem>
            </NSpace>
            <NSpace>
              <NConfigProvider :theme="purpleTheme">
                <NButton type="primary" @click="handleSearch">搜索</NButton>
              </NConfigProvider>
              <NButton type="success" @click="handleAdd">新增成员</NButton>
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
        :pagination="pagination"
        :scroll-x="1100"
        :single-line="false"
        flex-height
        striped
        @update:page="handlePageChange"
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
        <NFormItem label="名称" path="name">
          <NInput v-model:value="editingRecord.name" />
        </NFormItem>
        <NFormItem label="成员ID" path="memberId">
          <NInput v-model:value="editingRecord.memberId" />
        </NFormItem>
        <NFormItem label="部门" path="department">
          <NInput v-model:value="editingRecord.department" />
        </NFormItem>
        <NFormItem label="岗位" path="job">
          <NInput v-model:value="editingRecord.job" />
        </NFormItem>
        <NFormItem label="手机号" path="phone">
          <NInput v-model:value="editingRecord.phone" />
        </NFormItem>
        <NFormItem label="角色" path="role">
          <NSelect
            v-model:value="editingRecord.role"
            :options="roleOptions"
            required
          />
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
