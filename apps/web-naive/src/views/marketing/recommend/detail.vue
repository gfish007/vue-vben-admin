<script setup lang="ts">
import type { FormInst, FormRules, UploadFileInfo } from 'naive-ui';

import type { RecommendApi } from '#/api/marketing/recommend.types';
import type { RecommendDetailApi } from '#/api/marketing/recommendDetail.types';

import { h, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
  NTabPane,
  NTabs,
  NUpload,
  useDialog,
  useMessage,
} from 'naive-ui';

import {
  queryRecommendDetailList,
  saveOrUpdateRecommendDetail,
  deleteRecommendDetails,
} from '#/api/marketing/recommendDetail';
import { uploadFile } from '#/api/core/file';
import { useDynamicHeight } from '#/utils/heightUtils';

// 导入目标类型的API
import { querySpotList } from '#/api/core/spot';
import { queryAttractionList } from '#/api/core/attraction';
import { queryRegionActivityList } from '#/api/core/regionActivity';

const message = useMessage();
const dialog = useDialog();
const route = useRoute();
const router = useRouter();

// 推荐ID（从路由参数获取）
const recommendId = route.params.id as string;
const recommendTitle = route.params.title as string || '推荐详情';

// 表格数据
const spotTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);
const attractionTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);
const activityTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);

const loading = ref(false);

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const currentTargetType = ref<'spot' | 'attraction' | 'activity'>('spot');

const editingRecord = ref<RecommendDetailApi.RecommendDetailSaveReq>({
  recommendId: parseInt(recommendId),
  targetType: 'spot',
  relationId: 0,
  sortOrder: 999,
  title: '',
});

// 目标选择相关
const targetOptions = ref<Array<{ label: string; value: number }>>([]);
const targetQueryForm = reactive({
  title: '',
});

// 表单规则
const rules: FormRules = {
  relationId: { message: '请选择目标', required: true, type: 'number', trigger: 'change' },
  sortOrder: { message: '请输入排序', required: true, type: 'number', trigger: 'blur' },
  title: { message: '请输入标题', required: true, trigger: 'blur' },
};

const formRef = ref<FormInst | null>(null);

// 添加新的 loading 状态
const editLoading = ref(false);
const deleteLoading = ref(false);
const saveLoading = ref(false);
const targetLoading = ref(false);

// 查询数据
const fetchData = async () => {
  if (!recommendId) return;
  
  loading.value = true;
  try {
    const result = await queryRecommendDetailList(recommendId);
    
    // 按目标类型分组
    spotTableData.value = result.records.filter(record => record.targetType === 'spot');
    attractionTableData.value = result.records.filter(record => record.targetType === 'attraction');
    activityTableData.value = result.records.filter(record => record.targetType === 'activity');
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 查询目标数据
const fetchTargetData = async () => {
  targetLoading.value = true;
  try {
    let result: any;
    
    switch (currentTargetType.value) {
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
        result = await queryRegionActivityList({
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

// 表格列定义
const createColumns = (targetType: string) => [
  {
    key: 'title',
    title: '标题',
    width: 150,
  },
  {
    key: 'relationId',
    title: '关联ID',
    width: 100,
  },
  {
    key: 'sortOrder',
    title: '排序',
    width: 80,
  },
  {
    fixed: 'right',
    key: 'actions',
    render: (row: RecommendDetailApi.RecommendDetailRecord) => {
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

// 处理新增
const handleAdd = (targetType: 'spot' | 'attraction' | 'activity') => {
  currentTargetType.value = targetType;
  modalTitle.value = `新增${getTargetTypeName(targetType)}`;
  editingRecord.value = {
    recommendId: parseInt(recommendId),
    targetType,
    relationId: 0,
    sortOrder: 999,
    title: '',
  };

  // 重置目标选项
  targetOptions.value = [];

  showModal.value = true;
  
  // 获取目标选项数据
  fetchTargetData();
};

// 处理编辑
const handleEdit = async (row: RecommendDetailApi.RecommendDetailRecord) => {
  editLoading.value = true;
  try {
    currentTargetType.value = row.targetType as 'spot' | 'attraction' | 'activity';
    modalTitle.value = `编辑${getTargetTypeName(row.targetType)}`;

    editingRecord.value = {
      id: row.id,
      recommendId: row.recommendId,
      targetType: row.targetType,
      relationId: row.relationId,
      sortOrder: row.sortOrder,
      title: row.title,
    };
    
    // 获取目标选项数据
    await fetchTargetData();

    showModal.value = true;
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败');
  } finally {
    editLoading.value = false;
  }
};

// 处理删除
const handleDelete = async (row: RecommendDetailApi.RecommendDetailRecord) => {
  // 添加二次确认
  dialog.warning({
    title: '确认删除',
    content: `确定要删除 "${row.title}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      deleteLoading.value = true;
      try {
        await deleteRecommendDetails([row.id]);
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

// 处理保存
const handleSave = async () => {
  if (!formRef.value) return;
  saveLoading.value = true;
  try {
    await formRef.value.validate();

    await saveOrUpdateRecommendDetail(editingRecord.value);
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

// 获取目标类型名称
const getTargetTypeName = (targetType: string) => {
  const typeMap: Record<string, string> = {
    spot: '地点',
    attraction: '景点',
    activity: '活动',
  };
  return typeMap[targetType] || '未知';
};

// 返回推荐列表
const handleBack = () => {
  router.push('/marketing/recommend');
};

// 初始加载数据
fetchData();

// 添加一个计算属性来动态计算表格高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

// 监听目标类型变化
watch(currentTargetType, () => {
  fetchTargetData();
});

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});
</script>

<template>
  <Page :description="`推荐【${recommendTitle}】的详情配置`" title="推荐详情配置">
    <div style="margin-bottom: 16px;">
      <NButton @click="handleBack">返回推荐列表</NButton>
    </div>

    <NTabs type="line">
      <NTabPane name="spot" tab="POI地点列表">
        <NCard>
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('spot')">新增地点</NButton>
          </div>
          <NDataTable
            :columns="createColumns('spot')"
            :data="spotTableData"
            :loading="loading"
            :max-height="`${tableHeight}px`"
            :min-height="`${tableHeight}px`"
            striped
          />
        </NCard>
      </NTabPane>
      <NTabPane name="attraction" tab="打卡点列表">
        <NCard>
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('attraction')">新增打卡点</NButton>
          </div>
          <NDataTable
            :columns="createColumns('attraction')"
            :data="attractionTableData"
            :loading="loading"
            :max-height="`${tableHeight}px`"
            :min-height="`${tableHeight}px`"
            striped
          />
        </NCard>
      </NTabPane>
      <NTabPane name="activity" tab="活动列表">
        <NCard>
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('activity')">新增活动</NButton>
          </div>
          <NDataTable
            :columns="createColumns('activity')"
            :data="activityTableData"
            :loading="loading"
            :max-height="`${tableHeight}px`"
            :min-height="`${tableHeight}px`"
            striped
          />
        </NCard>
      </NTabPane>
    </NTabs>

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
            <NFormItem label="目标" path="relationId">
              <NSelect
                v-model:value="editingRecord.relationId"
                :loading="targetLoading"
                :options="targetOptions"
                clearable
                filterable
              >
                <template #header>
                  <NInput 
                    v-model:value="targetQueryForm.title" 
                    placeholder="搜索目标" 
                    style="margin-bottom: 8px;"
                    @keydown.enter="handleTargetSearch"
                  />
                  <NButton 
                    size="small" 
                    type="primary" 
                    @click="handleTargetSearch"
                    style="margin-bottom: 8px;"
                  >
                    搜索
                  </NButton>
                </template>
              </NSelect>
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="标题" path="title">
              <NInput v-model:value="editingRecord.title" />
            </NFormItem>
          </NCol>
        </NRow>

        <NRow :gutter="24">
          <NCol :span="12">
            <NFormItem label="排序" path="sortOrder">
              <NInput v-model:value="editingRecord.sortOrder" type="number" />
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