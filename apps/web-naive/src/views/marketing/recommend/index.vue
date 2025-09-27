<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { RecommendApi } from '#/api/marketing/recommend.types';

import { h, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NButtonGroup,
  NCard,
  NCol,
  NDataTable,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NRow,
  NSelect,
  NSpace,
  NUpload,
  useDialog,
  useMessage,
} from 'naive-ui';

import RecommendDetailModal from './detail-modal.vue';

import {
  deleteRecommends,
  queryRecommendList,
  saveOrUpdateRecommend,
  updateRecommendStatus,
} from '#/api/marketing/recommend';
import { uploadFile } from '#/api/core/file';
import { useDynamicHeight } from '#/utils/heightUtils';

// 导入目标类型的API
import { requestClient } from '#/api/request';

// 目标数据查询API
interface TargetQueryParams {
  page: {
    current: number;
    size: number;
  };
  queryBody: {
    title?: string;
  };
}

interface SpotRecord {
  id: number;
  title: string;
  // 其他字段...
}

interface AttractionRecord {
  id: number;
  title: string;
  // 其他字段...
}

interface ActivityRecord {
  id: number;
  title: string;
  // 其他字段...
}

interface TargetQueryResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 查询地点数据
async function querySpotList(params: TargetQueryParams): Promise<TargetQueryResult<SpotRecord>> {
  return requestClient.post<TargetQueryResult<SpotRecord>>('/open/spot/list', params);
}

// 查询景点数据
async function queryAttractionList(params: TargetQueryParams): Promise<TargetQueryResult<AttractionRecord>> {
  return requestClient.post<TargetQueryResult<AttractionRecord>>('/open/attraction/list', params);
}

// 查询活动数据
async function queryActivityList(params: TargetQueryParams): Promise<TargetQueryResult<ActivityRecord>> {
  return requestClient.post<TargetQueryResult<ActivityRecord>>('/open/activity/list', params);
}

const message = useMessage();
const dialog = useDialog();
const router = useRouter();

// 查询条件
const queryForm = reactive<RecommendApi.QueryParams['queryBody']>({
  title: undefined,
  startTimeBegin: undefined,
  startTimeEnd: undefined,
  status: undefined,
});

// 表格数据
const tableData = ref<RecommendApi.RecommendRecord[]>([]);
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

// 推荐详情弹窗相关
const showDetailModal = ref(false);
const currentRecommendId = ref('');
const currentRecommendTitle = ref('');

const editingRecord = ref<RecommendApi.RecommendSaveReq>({
  targetType: 'spot',
  targetId: 0,
  sortOrder: 999,
  regionId: 0,
  regionName: '',
  title: '',
});

// 目标类型相关
const targetTypeOptions = [
  { label: '地点', value: 'spot' },
  { label: '景点', value: 'attraction' },
  { label: '活动', value: 'activity' },
];

// 目标选择相关
const targetOptions = ref<Array<{ label: string; value: number }>>([]);
const targetQueryForm = reactive({
  title: '',
});

// 区域选择相关
const regionOptions = ref<Array<{ label: string; value: number }>>([]);
const regionQueryForm = reactive({
  title: '',
});

// 表单规则
const rules: FormRules = {
  regionId: { message: '请选择区域', required: true, trigger: 'change' },
  title: { message: '请输入标题', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);
const targetLoading = ref(false);
const regionLoading = ref(false);

// 格式化日期时间
const formatDate = (date: string | number | Date | null): string => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 解析后端返回的时间格式
const parseBackendDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  // 将 "2025-01-10 12:12:12" 转换为 "2025-01-10T12:12:12"
  const isoString = dateString.replace(' ', 'T');
  const date = new Date(isoString);

  // 检查日期是否有效
  return isNaN(date.getTime()) ? null : date;
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    // 格式化查询时间
    const queryBody = {
      ...queryForm,
      startTimeBegin: queryForm.startTimeBegin ? formatDate(queryForm.startTimeBegin) : undefined,
      startTimeEnd: queryForm.startTimeEnd ? formatDate(queryForm.startTimeEnd) : undefined,
    };

    const result = await queryRecommendList({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody,
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

// 查询目标数据
const fetchTargetData = async () => {
  if (!editingRecord.value.targetType) return;

  targetLoading.value = true;
  try {
    let result: any;

    switch (editingRecord.value.targetType) {
      case 'spot':
        result = await querySpotList({
          page: { current: 1, size: 100 },
          queryBody: { title: targetQueryForm.title || undefined },
        });
        break;
      case 'attraction':
        result = await queryAttractionList({
          page: { current: 1, size: 100 },
          queryBody: { title: targetQueryForm.title || undefined },
        });
        break;
      case 'activity':
        result = await queryActivityList({
          page: { current: 1, size: 100 },
          queryBody: { title: targetQueryForm.title || undefined },
        });
        break;
      default:
        targetOptions.value = [];
        return;
    }

    targetOptions.value = result.records.map((item: any) => ({
      label: item.title,
      value: item.id,
    }));
  } catch (error) {
    console.error('获取目标数据失败:', error);
    message.error('获取目标数据失败');
    targetOptions.value = [];
  } finally {
    targetLoading.value = false;
  }
};

// 监听目标类型变化
watch(() => editingRecord.value.targetType, () => {
  editingRecord.value.targetId = 0;
  targetOptions.value = [];
  fetchTargetData();
});

// 查询区域数据
import { queryRegionList } from '#/api/core/region';
const fetchRegionData = async () => {
  regionLoading.value = true;
  try {
    const result = await queryRegionList({
      page: { current: 1, size: 100 },
      queryBody: { title: regionQueryForm.title || undefined },
    });

    regionOptions.value = result.records.map((item: any) => ({
      label: item.title,
      value: item.id,
    }));
  } catch (error) {
    console.error('获取区域数据失败:', error);
    message.error('获取区域数据失败');
    regionOptions.value = [];
  } finally {
    regionLoading.value = false;
  }
};

// 监听组件挂载时获取区域数据
onMounted(() => {
  fetchRegionData();
});

// 表格列定义
const columns = [
  {
    key: 'title',
    title: '标题',
    width: 150,
  },

  {
    key: 'regionId',
    title: '区域ID',
    width: 100,
  },
  {
    key: 'regionName',
    title: '区域',
    width: 100,
  },
  {
    key: 'status',
    render: (row: RecommendApi.RecommendRecord) => {
      return row.status === 1 ? '正常' : '下架';
    },
    title: '状态',
    width: 100,
  },
  {
    key: 'gmtCreate',
    title: '创建时间',
    width: 150,
  },
  {
    key: 'gmtModified',
    title: '更新时间',
    width: 150,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: RecommendApi.RecommendRecord) => {
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
            h(
              NButton,
              {
                onClick: () => handleToggleStatus(row),
                type: row.status === 1 ? 'warning' : 'success',
              },
              { default: () => (row.status === 1 ? '下架' : '启用') },
            ),
            h(
              NButton,
              {
                onClick: () => handleConfigure(row),
                type: 'info',
              },
              { default: () => '配置' },
            ),
          ],
        },
      );
    },
    title: '操作',
    width: 200,
  },
];

// 处理查询
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

// 处理重置
const handleReset = () => {
  queryForm.title = undefined;
  queryForm.startTimeBegin = undefined;
  queryForm.startTimeEnd = undefined;
  queryForm.status = undefined;
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

// 处理新增
const handleAdd = () => {
  modalTitle.value = '新增推荐';
  editingRecord.value = {
    targetType: 'spot',
    targetId: 0,
    sortOrder: 999,
    regionId: 0,
    regionName: '',
    title: '',
  };

  showModal.value = true;
};

// 修改 handleEdit 函数
const handleEdit = async (row: RecommendApi.RecommendRecord) => {
  editLoading.value = true;
  try {
    modalTitle.value = '编辑推荐';

    editingRecord.value = {
      id: row.id,
      targetType: row.targetType,
      targetId: row.targetId,
      sortOrder: row.sortOrder,
      regionId: row.regionId,
      regionName: row.regionName,
      title: row.title,
      status: row.status,
    };

    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 修改 handleDelete 函数
const handleDelete = async (row: RecommendApi.RecommendRecord) => {
  // 添加二次确认
  dialog.warning({
    title: '确认删除',
    content: `确定要删除推荐 "${row.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      deleteLoading.value = true;
      try {
        await deleteRecommends([row.id]);
        message.success('删除成功');
        fetchData();
      } catch {
        message.error('删除失败');
      } finally {
        deleteLoading.value = false;
      }
    },
  });
};

// 处理启用/禁用
const handleToggleStatus = async (row: RecommendApi.RecommendRecord) => {
  // 添加二次确认
  const action = row.status === 1 ? '下架' : '启用';
  dialog.warning({
    title: `确认${action}`,
    content: `确定要${action}推荐 "${row.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const newStatus = row.status === 1 ? 0 : 1; // 1:正常, 0:下架
        await updateRecommendStatus({
          id: row.id,
          status: newStatus,
        });
        message.success(`${newStatus === 1 ? '启用' : '下架'}成功`);
        fetchData();
      } catch {
        message.error('操作失败');
      }
    },
  });
};



// 修改 handleSave 函数
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();

    await saveOrUpdateRecommend(editingRecord.value);
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

// 处理目标查询
const handleTargetSearch = () => {
  fetchTargetData();
};

// 处理区域查询
const handleRegionSearch = () => {
  fetchRegionData();
};

// 处理区域变更
const handleRegionChange = (value: number) => {
  // 根据选择的区域ID找到对应的区域名称
  const selectedRegion = regionOptions.value.find(option => option.value === value);
  if (selectedRegion) {
    editingRecord.value.regionName = selectedRegion.label;
  } else {
    editingRecord.value.regionName = '';
  }
};

// 处理配置
const handleConfigure = (row: RecommendApi.RecommendRecord) => {
  // 设置当前配置的推荐ID和标题
  currentRecommendId.value = row.id;
  currentRecommendTitle.value = row.title;
  console.log(1111, row.regionId);
  // 设置区域ID
  if (row.regionId) {
    editingRecord.value.regionId = row.regionId;
  }
  console.log(1112, editingRecord.value.regionId);
  // 显示推荐详情弹窗
  showDetailModal.value = true;
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
  <Page description="管理系统中的推荐信息" title="推荐管理">
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card">
        <NForm :model="queryForm" inline>
          <div style="display: flex; flex-wrap: wrap; gap: 16px 24px; width: 100%; align-items: center;">
            <NFormItem label="标题" label-placement="left" style="margin-bottom: 0;">
              <NInput v-model:value="queryForm.title" style="width: 150px" />
            </NFormItem>
            <NFormItem label="有效时间" label-placement="left" style="margin-bottom: 0;">
              <NDatePicker
                v-model:value="queryForm.startTimeBegin"
                placeholder="开始时间"
                style="width: 150px"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
              <span style="margin: 0 8px">-</span>
              <NDatePicker
                v-model:value="queryForm.startTimeEnd"
                placeholder="结束时间"
                style="width: 150px"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </NFormItem>
            <NFormItem label="状态" label-placement="left" style="margin-bottom: 0;">
              <NSelect
                v-model:value="queryForm.status"
                :options="[
                  { label: '正常', value: 1 },
                  { label: '下架', value: 0 },
                ]"
                clearable
                style="width: 120px"
              />
            </NFormItem>
            <div style="display: flex; gap: 16px; margin-left: auto;">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
              <NButton type="success" @click="handleAdd">新增推荐</NButton>
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
        :scroll-x="1500"
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
      style="width: 80vw; max-width: 1000px"
    >
      <NForm
        ref="formRef"
        :model="editingRecord"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="标题" path="title">
              <NInput v-model:value="editingRecord.title" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="区域" path="regionId">
              <NSelect
                v-model:value="editingRecord.regionId"
                :loading="regionLoading"
                :options="regionOptions"
                clearable
                filterable
                @update:value="handleRegionChange"
              >
                <template #header>
                  <NInput
                    v-model:value="regionQueryForm.title"
                    placeholder="搜索区域"
                    style="margin-bottom: 8px;"
                    @keydown.enter="handleRegionSearch"
                  />
                  <NButton
                    size="small"
                    type="primary"
                    @click="handleRegionSearch"
                    style="margin-bottom: 8px;"
                  >
                    搜索
                  </NButton>
                </template>
              </NSelect>
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

    <!-- 推荐详情抽屉 -->
    <NDrawer
      v-model:show="showDetailModal"
      :width="1200"
      placement="right"
    >
      <NDrawerContent
        :title="`推荐详情 - ${currentRecommendTitle}`"
        closable
      >
        <RecommendDetailModal
          v-if="showDetailModal"
          :recommend-id="currentRecommendId"
          :recommend-title="currentRecommendTitle"
          :region-id="editingRecord.regionId ? editingRecord.regionId.toString() : '0'"
          @close="showDetailModal = false"
        />
      </NDrawerContent>
    </NDrawer>
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
