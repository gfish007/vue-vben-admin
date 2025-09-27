<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';

import type { DictApi } from '#/api/system/dict.types';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NCol,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NRow,
  NSpace,
  useMessage,
} from 'naive-ui';

import {
  deleteDicts,
  getDictDetail,
  queryDictList,
  saveOrUpdateDict,
} from '#/api/system/dict';
import { useDynamicHeight } from '#/utils/heightUtils';

const message = useMessage();

// 查询条件
const queryForm = reactive<DictApi.QueryParams['queryBody']>({
  groupKey: undefined,
  dictKey: undefined,
});

// 表格数据
const tableData = ref<DictApi.DictRecord[]>([]);
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

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const isJsonMode = ref(false);

const editingRecord = ref<DictApi.DictSaveReq>({
  dictKey: '',
  dictValue: '',
  groupKey: '',
  groupDesc: '',
});

// 表单规则
const rules: FormRules = {
  dictKey: { message: '请输入字典key', required: true, trigger: 'blur' },
  dictValue: { message: '请输入字典值', required: true, trigger: 'blur' },
  groupKey: { message: '请输入分组key', required: true, trigger: 'blur' },
  groupDesc: { message: '请输入分组描述', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryDictList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
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
  { key: 'dictKey', title: '字典Key', width: 150 },
  {
    key: 'dictValue',
    title: '字典值',
    width: 200,
    render: (row: DictApi.DictRecord) => {
      // 尝试解析JSON，如果成功则格式化显示
      try {
        const parsed = JSON.parse(row.dictValue);
        return h('pre', { style: 'white-space: pre-wrap; word-break: break-all;' }, JSON.stringify(parsed, null, 2));
      } catch {
        // 如果不是有效的JSON，直接显示原文
        return h('div', { style: 'white-space: pre-wrap; word-break: break-all;' }, row.dictValue);
      }
    }
  },
  { key: 'groupKey', title: '分组Key', width: 150 },
  { key: 'groupDesc', title: '分组描述', width: 150 },
  { key: 'gmtCreate', title: '创建时间', width: 180 },
  { key: 'gmtModified', title: '更新时间', width: 180 },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: DictApi.DictRecord) => {
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
                type: 'primary',
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

// 处理重置
const handleReset = () => {
  queryForm.groupKey = undefined;
  queryForm.dictKey = undefined;
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

// 切换JSON模式
const toggleJsonMode = () => {
  isJsonMode.value = !isJsonMode.value;
  if (isJsonMode.value && editingRecord.value.dictValue) {
    try {
      // 尝试格式化现有的JSON
      const parsed = JSON.parse(editingRecord.value.dictValue);
      editingRecord.value.dictValue = JSON.stringify(parsed, null, 2);
    } catch {
      // 如果不是有效的JSON，不处理
      message.warning('当前内容不是有效的JSON格式');
      isJsonMode.value = false;
    }
  }
};

// 格式化JSON
const formatJson = () => {
  if (editingRecord.value.dictValue) {
    try {
      const parsed = JSON.parse(editingRecord.value.dictValue);
      editingRecord.value.dictValue = JSON.stringify(parsed, null, 2);
      message.success('JSON格式化成功');
    } catch (error) {
      message.error('JSON格式无效: ' + (error as Error).message);
    }
  }
};

// 压缩JSON
const compressJson = () => {
  if (editingRecord.value.dictValue) {
    try {
      const parsed = JSON.parse(editingRecord.value.dictValue);
      editingRecord.value.dictValue = JSON.stringify(parsed);
      message.success('JSON压缩成功');
    } catch (error) {
      message.error('JSON格式无效: ' + (error as Error).message);
    }
  }
};

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增字典';
  editingRecord.value = {
    dictKey: '',
    dictValue: '',
    groupKey: '',
    groupDesc: '',
  };
  isJsonMode.value = false;

  showModal.value = true;
};

// 修改 handleEdit 函数
const handleEdit = async (row: DictApi.DictRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑字典';
    const detail = await getDictDetail(row.id);

    editingRecord.value = {
      id: detail.id,
      dictKey: detail.dictKey,
      dictValue: detail.dictValue,
      groupKey: detail.groupKey,
      groupDesc: detail.groupDesc,
    };

    // 检查是否为JSON格式
    try {
      JSON.parse(detail.dictValue);
      isJsonMode.value = true;
    } catch {
      isJsonMode.value = false;
    }

    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: DictApi.DictRecord) => {
  deleteLoading.value = true;
  try {
    await deleteDicts([row.id]);
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

    // 如果是JSON模式，验证JSON格式
    if (isJsonMode.value && editingRecord.value.dictValue) {
      try {
        JSON.parse(editingRecord.value.dictValue);
      } catch (error) {
        message.error('JSON格式无效: ' + (error as Error).message);
        saveLoading.value = false;
        return;
      }
    }

    await saveOrUpdateDict(editingRecord.value);
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
  <Page description="管理系统中的字典信息" title="字典管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card">
        <NForm :model="queryForm" inline>
          <div style="display: flex; flex-wrap: wrap; gap: 16px 24px; width: 100%; align-items: center;">
            <NFormItem label="分组Key" label-placement="left" style="margin-bottom: 0;">
              <NInput v-model:value="queryForm.groupKey" style="width: 150px" />
            </NFormItem>
            <NFormItem label="字典Key" label-placement="left" style="margin-bottom: 0;">
              <NInput v-model:value="queryForm.dictKey" style="width: 150px" />
            </NFormItem>
            <div style="display: flex; gap: 16px; margin-left: auto;">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">新增字典</NButton>
            </div>
          </div>
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
        :scroll-x="1200"
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

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 80vw; max-width: 800px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="left"
        label-width="120px"
        require-mark-placement="right-hanging"
      >
        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="分组Key" path="groupKey">
              <NInput v-model:value="editingRecord.groupKey" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="分组描述" path="groupDesc">
              <NInput v-model:value="editingRecord.groupDesc" />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="字典Key" path="dictKey">
              <NInput v-model:value="editingRecord.dictKey" />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="24">
            <NFormItem label="字典值" path="dictValue">
              <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>字典内容</span>
                  <NSpace>
                    <NButton
                      size="small"
                      type="primary"
                      @click="toggleJsonMode"
                    >
                      {{ isJsonMode ? '普通模式' : 'JSON模式' }}
                    </NButton>
                    <NButton
                      v-if="isJsonMode"
                      size="small"
                      @click="formatJson"
                    >
                      格式化
                    </NButton>
                    <NButton
                      v-if="isJsonMode"
                      size="small"
                      @click="compressJson"
                    >
                      压缩
                    </NButton>
                  </NSpace>
                </div>
                <NInput
                  v-model:value="editingRecord.dictValue"
                  :autosize="{ minRows: 6, maxRows: 15 }"
                  type="textarea"
                  style="width: 100%;"
                />
              </div>
            </NFormItem>
          </NCol>
        </NRow>


      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton :loading="saveLoading" type="primary" @click="handleSave">
            保存
          </NButton>
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
