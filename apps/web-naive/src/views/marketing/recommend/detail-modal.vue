<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui';

import type { RecommendDetailApi } from '#/api/marketing/recommendDetail.types';

import { h, onMounted, reactive, ref, watch } from 'vue';

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
  NRow,
  NSpace,
  NTabPane,
  NTabs,
  useDialog,
  useMessage,
} from 'naive-ui';

import {
  queryRecommendDetailList,
  saveOrUpdateRecommendDetail,
  deleteRecommendDetails,
  batchSaveRecommendDetails,
} from '#/api/marketing/recommendDetail';
import { useDynamicHeight } from '#/utils/heightUtils';

// 导入可勾选弹窗列表组件
import SelectableListModal from './components/SelectableListModal.vue';

const props = defineProps<{
  recommendId: string;
  recommendTitle: string;
  regionId?: string; // 添加regionId参数
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const message = useMessage();
const dialog = useDialog();

// 表格数据
const foodTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);
const hotelTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);
const attractionTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);
const leisureTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);
const activityTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);
const svcTableData = ref<RecommendDetailApi.RecommendDetailRecord[]>([]);

const loading = ref(false);

// 模态框相关
const showModal = ref(false);
const modalTitle = ref('');
const currentTargetType = ref<'food' | 'hotel' | 'attraction' | 'leisure' | 'activity' | 'svc'>('food');

const editingRecord = ref<RecommendDetailApi.RecommendDetailSaveReq>({
  recommendId: props.recommendId,
  targetType: 'spot',
  relationId: '0',
  sortOrder: 999,
  title: '',
});

// 可勾选弹窗相关
const showSelectableModal = ref(false);
const selectableTargetType = ref<'spot' | 'activity' | 'svc'>('spot');
const selectedIds = ref<(string | number)[]>([]);

// 区域ID（从父组件props获取）
const regionId = ref<number | undefined>(undefined);

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

// 查询数据
const fetchData = async () => {
  if (!props.recommendId) return;

  loading.value = true;
  try {
    console.log('开始获取数据，recommendId:', props.recommendId);
    const result = await queryRecommendDetailList(props.recommendId);
    console.log('API返回结果:', result);

    // 确保result和result.records存在
    if (result && Array.isArray(result)) {
      console.log('获取到的数据:', result);
      // 按目标类型分组
      foodTableData.value = result.filter(record => record.targetType === 'FOOD');
      hotelTableData.value = result.filter(record => record.targetType === 'HOTEL');
      attractionTableData.value = result.filter(record => record.targetType === 'ATTRACTION');
      leisureTableData.value = result.filter(record => record.targetType === 'ACTIVITY');
      activityTableData.value = result.filter(record => record.targetType === 'activity');
      svcTableData.value = result.filter(record => record.targetType === 'svc');

      console.log('food数据:', foodTableData.value);
      console.log('hotel数据:', hotelTableData.value);
      console.log('attraction数据:', attractionTableData.value);
      console.log('leisure数据:', leisureTableData.value);
      console.log('activity数据:', activityTableData.value);
    } else {
      console.log('没有获取到有效数据');
      // 如果没有数据，初始化为空数组
      foodTableData.value = [];
      hotelTableData.value = [];
      attractionTableData.value = [];
      leisureTableData.value = [];
      activityTableData.value = [];
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    message.error(`获取数据失败: ${error.message || '未知错误'}`);
    // 出错时也初始化为空数组
    foodTableData.value = [];
    hotelTableData.value = [];
    attractionTableData.value = [];
    leisureTableData.value = [];
    activityTableData.value = [];
  } finally {
    loading.value = false;
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
const handleAdd = (targetType: 'food' | 'hotel' | 'attraction' | 'leisure' | 'activity' | 'svc') => {
  currentTargetType.value = targetType;
  selectableTargetType.value = targetType === 'food' || targetType === 'hotel' || targetType === 'attraction' || targetType === 'leisure' ? 'spot' : 
                            targetType === 'activity' ? 'activity' : 'svc';
  selectedIds.value = [];
  // 确保regionId已经设置
  if (props.regionId) {
    regionId.value = props.regionId;
  }
  showSelectableModal.value = true;
};

// 处理批量新增确认
const handleBatchAddConfirm = (selectedItems: Array<{ id: number; title: string }>) => {
  // 根据目标类型将新记录添加到对应的表格数据中
  let newRecords = selectedItems.map((item) => ({
    id: `temp_${Date.now()}_${item.id}`, // 临时ID，用于前端显示，以temp_开头明确标识为临时记录
    gmtCreate: new Date().toISOString(),
    gmtModified: new Date().toISOString(),
    recommendId: props.recommendId,
    targetType: currentTargetType.value === 'food' ? 'FOOD' : 
              currentTargetType.value === 'hotel' ? 'HOTEL' : 
              currentTargetType.value === 'attraction' ? 'ATTRACTION' : 
              currentTargetType.value === 'leisure' ? 'ACTIVITY' : 
              currentTargetType.value === 'svc' ? 'svc' : currentTargetType.value,
    relationId: item.id.toString(),
    sortOrder: 999,
    title: item.title,
  }));

  // 如果是活动列表，将targetType修改为SERVER
  if (currentTargetType.value === 'activity') {
    newRecords = newRecords.map(record => ({...record, targetType: 'SERVER'}));
  }

  // 根据目标类型更新对应的表格数据，避免重复记录
  const updateTableData = (tableData: Ref<RecommendDetailApi.RecommendDetailRecord[]>) => {
    newRecords.forEach(newRecord => {
      const existingIndex = tableData.value.findIndex(
        record => record.relationId === newRecord.relationId && record.targetType === newRecord.targetType
      );

      if (existingIndex >= 0) {
        // 如果存在，替换现有记录
        tableData.value[existingIndex] = newRecord;
      } else {
        // 如果不存在，添加新记录
        tableData.value.push(newRecord);
      }
    });
  };

  // 根据目标类型更新对应的表格数据
  if (currentTargetType.value === 'food') {
    updateTableData(foodTableData);
  } else if (currentTargetType.value === 'hotel') {
    updateTableData(hotelTableData);
  } else if (currentTargetType.value === 'attraction') {
    updateTableData(attractionTableData);
  } else if (currentTargetType.value === 'leisure') {
    updateTableData(leisureTableData);
  } else if (currentTargetType.value === 'activity') {
    // 修改活动列表的targetType为SERVER
    newRecords.forEach(record => record.targetType = 'SERVER');
    updateTableData(activityTableData);
  } else if (currentTargetType.value === 'svc') {
    updateTableData(svcTableData);
  }

  message.success(`成功添加${selectedItems.length}条记录到列表`);
  showSelectableModal.value = false;
};

// 处理编辑
const handleEdit = async (row: RecommendDetailApi.RecommendDetailRecord) => {
  editLoading.value = true;
  try {
    // 根据targetType设置currentTargetType
    switch (row.targetType) {
      case 'FOOD':
        currentTargetType.value = 'food';
        break;
      case 'HOTEL':
        currentTargetType.value = 'hotel';
        break;
      case 'ATTRACTION':
        currentTargetType.value = 'attraction';
        break;
      case 'ACTIVITY':
        currentTargetType.value = 'leisure';
        break;
      case 'activity':
        currentTargetType.value = 'activity';
        break;
      case 'svc':
        currentTargetType.value = 'svc';
        break;
      default:
        currentTargetType.value = 'food';
    }
    
    modalTitle.value = `编辑${getTargetTypeName(currentTargetType.value)}`;

    editingRecord.value = {
      id: row.id, // 保持原有的ID，包括临时ID
      recommendId: row.recommendId,
      targetType: row.targetType,
      relationId: row.relationId,
      sortOrder: row.sortOrder,
      title: row.title,
    };

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
        // 检查是否是临时记录（新添加但未保存的记录）
        // 如果是临时记录，直接从表格中移除
        if (row.targetType === 'FOOD') {
          foodTableData.value = foodTableData.value.filter(item => item.id !== row.id);
        } else if (row.targetType === 'HOTEL') {
          hotelTableData.value = hotelTableData.value.filter(item => item.id !== row.id);
        } else if (row.targetType === 'ATTRACTION') {
          attractionTableData.value = attractionTableData.value.filter(item => item.id !== row.id);
        } else if (row.targetType === 'ACTIVITY') {
          leisureTableData.value = leisureTableData.value.filter(item => item.id !== row.id);
        } else if (row.targetType === 'activity') {
          activityTableData.value = activityTableData.value.filter(item => item.id !== row.id);
        } else if (row.targetType === 'svc') {
          svcTableData.value = svcTableData.value.filter(item => item.id !== row.id);
        }
        // message.success('删除成功');
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

    // 检查是否是编辑现有记录还是保存新记录
    if (editingRecord.value.id && !editingRecord.value.id.toString().startsWith('temp_')) {
      // 编辑现有记录（已保存到后端的记录）
      await saveOrUpdateRecommendDetail(editingRecord.value);
      message.success('编辑成功');
      // 重新获取数据以更新界面
      fetchData();
    } else {
      // 保存新记录（不立即提交到后端，只更新表格）
      const newRecord = {
        id: editingRecord.value.id || `temp_${Date.now()}_${editingRecord.value.relationId}`, // 使用现有ID或生成临时ID
        gmtCreate: new Date().toISOString(),
        gmtModified: new Date().toISOString(),
        recommendId: editingRecord.value.recommendId,
        targetType: editingRecord.value.targetType,
        relationId: editingRecord.value.relationId,
        sortOrder: editingRecord.value.sortOrder,
        title: editingRecord.value.title,
      };

      // 根据目标类型更新对应的表格数据
      if (editingRecord.value.targetType === 'FOOD') {
        if (editingRecord.value.id && editingRecord.value.id.toString().startsWith('temp_')) {
          // 编辑临时记录
          foodTableData.value = [...foodTableData.value.filter(item => item.id !== editingRecord.value.id), newRecord];
        } else {
          // 新增记录
          foodTableData.value = [...foodTableData.value, newRecord];
        }
      } else if (editingRecord.value.targetType === 'HOTEL') {
        if (editingRecord.value.id && editingRecord.value.id.toString().startsWith('temp_')) {
          // 编辑临时记录
          hotelTableData.value = [...hotelTableData.value.filter(item => item.id !== editingRecord.value.id), newRecord];
        } else {
          // 新增记录
          hotelTableData.value = [...hotelTableData.value, newRecord];
        }
      } else if (editingRecord.value.targetType === 'ATTRACTION') {
        if (editingRecord.value.id && editingRecord.value.id.toString().startsWith('temp_')) {
          // 编辑临时记录
          attractionTableData.value = [...attractionTableData.value.filter(item => item.id !== editingRecord.value.id), newRecord];
        } else {
          // 新增记录
          attractionTableData.value = [...attractionTableData.value, newRecord];
        }
      } else if (editingRecord.value.targetType === 'ACTIVITY') {
        if (editingRecord.value.id && editingRecord.value.id.toString().startsWith('temp_')) {
          // 编辑临时记录
          leisureTableData.value = [...leisureTableData.value.filter(item => item.id !== editingRecord.value.id), newRecord];
        } else {
          // 新增记录
          leisureTableData.value = [...leisureTableData.value, newRecord];
        }
      } else if (editingRecord.value.targetType === 'activity') {
        if (editingRecord.value.id && editingRecord.value.id.toString().startsWith('temp_')) {
          // 编辑临时记录
          activityTableData.value = [...activityTableData.value.filter(item => item.id !== editingRecord.value.id), newRecord];
        } else {
          // 新增记录
          activityTableData.value = [...activityTableData.value, newRecord];
        }
      } else if (editingRecord.value.targetType === 'svc') {
        if (editingRecord.value.id && editingRecord.value.id.toString().startsWith('temp_')) {
          // 编辑临时记录
          svcTableData.value = [...svcTableData.value.filter(item => item.id !== editingRecord.value.id), newRecord];
        } else {
          // 新增记录
          svcTableData.value = [...svcTableData.value, newRecord];
        }
      }

      message.success('保存成功');
      // 不关闭模态框，保持当前状态
    }

    showModal.value = false;
  } catch (error) {
    console.error('保存失败:', error);
    message.error(`保存失败: ${error.message || '未知错误'}`);
  } finally {
    saveLoading.value = false;
  }
};

// 处理全局保存
const handleGlobalSave = async () => {
  try {
    console.log('开始全局保存...');

    // 收集所有表格中的数据
      const allRecords = [
        ...foodTableData.value,
        ...hotelTableData.value,
        ...attractionTableData.value,
        ...leisureTableData.value,
        ...activityTableData.value,
        ...svcTableData.value,
      ];
    console.log('收集到的记录总数:', allRecords.length);

    // 过滤掉无效记录和临时记录
    // const validRecords = allRecords.filter(record =>
    //   record &&
    //   record.id &&
    //   !record.id.toString().startsWith('temp_') &&
    //   record.recommendId &&
    //   record.targetType
    // );
    // console.log('有效记录数:', validRecords.length);

    // 确保必要的字段有默认值，并正确设置targetType
    const processedRecords = allRecords.map(record => ({
      id: record.id,
      recommendId: record.recommendId,
      targetType: record.targetType,
      relationId: record.relationId,
      sortOrder: record.sortOrder || 999,
      title: record.title || '',
    }));

    // 如果没有需要保存的记录，直接返回
    if (processedRecords.length === 0) {
      message.info('没有需要保存的数据');
      return;
    }

    // 使用区域ID调用批量保存接口
    if (props.recommendId !== undefined && props.recommendId !== null) {
      await batchSaveRecommendDetails(props.recommendId.toString(), processedRecords);
      message.success('数据保存成功');
    } else {
      message.error('区域ID无效，无法保存数据');
      return;
    }

    // 重新获取数据以更新界面
    console.log('重新获取数据...');
    fetchData();
  } catch (error) {
    console.error('全局保存失败:', error);
    message.error(`保存失败: ${error.message || '未知错误'}`);
  }
};

// 获取目标类型名称
const getTargetTypeName = (targetType: string) => {
  const typeMap: Record<string, string> = {
    food: '美食',
    hotel: '住宿',
    attraction: '景点',
    leisure: '休闲',
    activity: '活动',
    svc: '服务',
  };
  return typeMap[targetType] || '未知';
};

// 关闭弹窗
const handleClose = () => {
  emit('close');
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
  // 设置区域ID
  if (props.regionId !== undefined) {
    regionId.value = props.regionId;
  }
});

// 监听推荐ID变化
watch(() => props.recommendId, () => {
  fetchData();
});

// 监听区域ID变化
watch(() => props.regionId, (newRegionId) => {
  if (newRegionId !== undefined) {
    regionId.value = newRegionId;
  }
});
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="margin-bottom: 16px; text-align: right;">
      <NButton type="primary" @click="handleGlobalSave">全局保存</NButton>
    </div>
    <NTabs type="line" style="flex: 1; display: flex; flex-direction: column;">
      <NTabPane name="food" tab="美食">
        <NCard style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('food')">新增美食</NButton>
          </div>
          <div style="flex: 1; overflow: auto;">
            <NDataTable
              :columns="createColumns('spot')"
              :data="foodTableData"
              :loading="loading"
              :max-height="`${tableHeight}px`"
              :min-height="`${tableHeight}px`"
              :row-key="(row) => String(row.id)"
              striped
              style="flex: 1;"
            />
          </div>
        </NCard>
      </NTabPane>
      
      <NTabPane name="hotel" tab="住宿">
        <NCard style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('hotel')">新增住宿</NButton>
          </div>
          <div style="flex: 1; overflow: auto;">
            <NDataTable
              :columns="createColumns('spot')"
              :data="hotelTableData"
              :loading="loading"
              :max-height="`${tableHeight}px`"
              :min-height="`${tableHeight}px`"
              :row-key="(row) => String(row.id)"
              striped
              style="flex: 1;"
            />
          </div>
        </NCard>
      </NTabPane>
      
      <NTabPane name="attraction" tab="景点">
        <NCard style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('attraction')">新增景点</NButton>
          </div>
          <div style="flex: 1; overflow: auto;">
            <NDataTable
              :columns="createColumns('spot')"
              :data="attractionTableData"
              :loading="loading"
              :max-height="`${tableHeight}px`"
              :min-height="`${tableHeight}px`"
              :row-key="(row) => String(row.id)"
              striped
              style="flex: 1;"
            />
          </div>
        </NCard>
      </NTabPane>
      
      <NTabPane name="leisure" tab="休闲">
        <NCard style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('leisure')">新增休闲</NButton>
          </div>
          <div style="flex: 1; overflow: auto;">
            <NDataTable
              :columns="createColumns('spot')"
              :data="leisureTableData"
              :loading="loading"
              :max-height="`${tableHeight}px`"
              :min-height="`${tableHeight}px`"
              :row-key="(row) => String(row.id)"
              striped
              style="flex: 1;"
            />
          </div>
        </NCard>
      </NTabPane>
      
      <NTabPane name="activity" tab="活动">
        <NCard style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('activity')">新增活动</NButton>
          </div>
          <div style="flex: 1; overflow: auto;">
            <NDataTable
              :columns="createColumns('activity')"
              :data="activityTableData"
              :loading="loading"
              :max-height="`${tableHeight}px`"
              :min-height="`${tableHeight}px`"
              :row-key="(row) => String(row.id)"
              striped
              style="flex: 1;"
            />
          </div>
        </NCard>
      </NTabPane>
      
      <NTabPane name="svc" tab="服务">
        <NCard style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="margin-bottom: 16px;">
            <NButton type="primary" @click="() => handleAdd('svc')">新增服务</NButton>
          </div>
          <div style="flex: 1; overflow: auto;">
            <NDataTable
              :columns="createColumns('svc')"
              :data="svcTableData"
              :loading="loading"
              :max-height="`${tableHeight}px`"
              :min-height="`${tableHeight}px`"
              :row-key="(row) => String(row.id)"
              striped
              style="flex: 1;"
            />
          </div>
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
            <NFormItem label="标题" path="title">
              <NInput v-model:value="editingRecord.title" />
            </NFormItem>
          </NCol>
          <NCol :span="12">
            <NFormItem label="关联ID" path="relationId">
              <NInput v-model:value="editingRecord.relationId" :disabled="true" />
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

    <!-- 可勾选弹窗列表 -->
    <SelectableListModal
      v-if="showSelectableModal"
      v-model:show="showSelectableModal"
      :target-type="selectableTargetType"
      :selected-ids="selectedIds"
      :region-id="regionId"
      :current-target-type="currentTargetType"
      @cancel="showSelectableModal = false"
      @confirm="handleBatchAddConfirm"
    />
  </div>
</template>

<style scoped>
.n-data-table {
  flex: 1;
}
</style>
