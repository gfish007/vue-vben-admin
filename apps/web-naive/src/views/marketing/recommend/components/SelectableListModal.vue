<script setup lang="ts">
import type { Ref } from 'vue';
import type { DataTableColumns } from 'naive-ui';

import { h, onMounted, reactive, ref, watch } from 'vue';

import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { querySpotList } from '#/api/core/spot';
import { queryRegionActivityList } from '#/api/core/regionActivity';
import { querySvcList } from '#/api/core/svc';
import { useDynamicHeight } from '#/utils/heightUtils';

// 定义组件props
const props = defineProps<{
  show: boolean;
  targetType: 'spot' | 'activity' | 'svc';
  selectedIds: (string | number)[];
  regionId?: number; // 添加regionId参数
  currentTargetType: 'food' | 'hotel' | 'attraction' | 'leisure' | 'activity' | 'svc';
}>();

// 定义组件emits
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'confirm', value: Array<{ id: number; title: string }>): void;
  (e: 'cancel'): void;
}>();

const message = useMessage();

// 表格数据
const tableData = ref<any[]>([]);
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



// 查询条件
const queryForm = reactive({
  title: '',
});

// 选中的数据
const checkedRowKeys = ref<(string | number)[]>([...props.selectedIds]);

// 表格列定义
const columns: Ref<DataTableColumns<any>> = ref([]);

// 动态高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

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

// 初始化列定义
const initColumns = () => {
  columns.value = [
    {
      type: 'selection',
      fixed: 'left',
    },
    {
      key: 'title',
      title: '标题',
      width: 200,
    },
  ];

  // 根据不同类型添加额外的列
  switch (props.targetType) {
    case 'spot':
      columns.value.push(
        {
          key: 'address',
          title: '地址',
          width: 200,
        },
        {
          key: 'spotType',
          title: '类型',
          width: 100,
          render: (row) => {
            const typeMap = {
              FOOD: '美食',
              ACTIVITY: '休闲',
              HOTEL: '住宿',
              ATTRACTION: '景点',
            };
            return typeMap[row.spotType] || '未知';
          },
        },
      );
      break;
    
    case 'activity':
      columns.value.push(
        {
          key: 'regionName',
          title: '区域名',
          width: 150,
        },
        {
          key: 'gmtStart',
          title: '开始时间',
          width: 170,
        },
        {
          key: 'gmtEnd',
          title: '结束时间',
          width: 170,
        },
      );
      break;
      
    case 'svc':
      columns.value.push(
        {
          key: 'regionName',
          title: '区域名',
          width: 150,
        },
        {
          key: 'tags',
          title: '标签',
          width: 150,
          render: (row) => {
            if (!row.tags || !Array.isArray(row.tags) || row.tags.length === 0) {
              return '无标签';
            }
            return row.tags.join(', ');
          },
        },
      );
      break;
  }

  columns.value.push({
    key: 'id',
    title: 'ID',
    width: 80,
  });
};

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    let result: any;

    switch (props.targetType) {
      case 'spot':
        // 美食、住宿、景点、休闲都使用spot接口，通过spotType区分
        result = await querySpotList({
          page: {
            current: pagination.page,
            size: pagination.pageSize,
          },
          queryBody: {
            title: queryForm.title || undefined,
            // 根据targetType添加spotType查询条件
            spotType: props.currentTargetType === 'food' ? 'FOOD' : 
                     props.currentTargetType === 'hotel' ? 'HOTEL' : 
                     props.currentTargetType === 'leisure' ? 'ACTIVITY' : 
                     props.currentTargetType === 'attraction' ? 'ATTRACTION' : undefined
          },
          regionId: props.regionId, // 添加regionId参数
        });
        break;
      
      case 'activity':
        result = await queryRegionActivityList({
          page: {
            current: pagination.page,
            size: pagination.pageSize,
          },
          queryBody: {
            title: queryForm.title || undefined,
          },
          regionId: props.regionId, // 添加regionId参数
        });
        break;
        
      case 'svc':
        result = await querySvcList({
          page: {
            current: pagination.page,
            size: pagination.pageSize,
          },
          queryBody: {
            title: queryForm.title || undefined,
          },
          regionId: props.regionId, // 添加regionId参数
        });
        break;
      default:
        return;
    }

    tableData.value = result.records;
    pagination.total = result.total;
    pagination.itemCount = result.total;
    // 确保页码不会超过总页数
    const totalPages = Math.ceil(result.total / pagination.pageSize);
    if (pagination.page > totalPages && totalPages > 0) {
      pagination.page = totalPages;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    message.error('获取数据失败');
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
  queryForm.title = '';
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

// 处理确认
const handleConfirm = () => {
  // 获取选中的行数据
  const selectedRows = tableData.value.filter((row) =>
    checkedRowKeys.value.includes(row.id),
  );

  // 转换为需要的格式
  const result = selectedRows.map((row) => ({
    id: row.id,
    title: row.title,
  }));

  emit('confirm', result);
};

// 处理取消
const handleCancel = () => {
  emit('cancel');
  emit('update:show', false);
};

// 监听show变化
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      // 重置选中项
      checkedRowKeys.value = [...props.selectedIds];
      // 获取数据
      fetchData();
    }
  },
);

// 监听targetType变化
watch(
  () => props.targetType,
  () => {
    initColumns();
    handleSearch();
  },
);

// 监听regionId变化
watch(
  () => props.regionId,
  () => {
    handleSearch();
  },
);

// 初始化
onMounted(() => {
  initColumns();
  if (props.show) {
    fetchData();
  }
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});
</script>

<template>
  <NModal
    :show="show"
    :title="`选择${getTargetTypeName(props.currentTargetType)}`"
    preset="card"
    style="width: 80vw; max-width: 1200px"
    @update:show="(val) => $emit('update:show', val)"
  >
    <div ref="queryCardRef" class="w-full">
      <NCard class="query-card mb-4">
        <NForm :model="queryForm" inline>
          <NSpace :size="[24, 0]" align="center" justify="space-between" style="width: 100%">
            <NSpace :size="24" align="center">
              <NFormItem label="标题" label-placement="left">
                <NInput v-model:value="queryForm.title" style="width: 200px" />
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

    <NDataTable
      v-model:checked-row-keys="checkedRowKeys"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :max-height="`${tableHeight}px`"
      :min-height="`${tableHeight}px`"
      :row-key="(row) => String(row.id)"
      striped
    />

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
      <div>共 {{ pagination.total }} 条记录</div>
      <NPagination
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :item-count="pagination.total"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" @click="handleConfirm">确认</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.query-card {
  padding: 8px 16px;
}
</style>