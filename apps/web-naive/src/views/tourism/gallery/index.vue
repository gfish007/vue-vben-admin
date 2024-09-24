<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NConfigProvider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NPagination,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { queryAttractionGallery } from '#/api/app/attractionGallery';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

const message = useMessage();

// 查询条件
const queryForm = reactive({
  regionId: undefined, // Change from null to undefined
  title: '',
});

// 卡片数据
const cardData = ref<any[]>([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
});

// 查询数据
const fetchData = async () => {
  loading.value = true;
  try {
    const result = await queryAttractionGallery({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });
    cardData.value = result.records;
    pagination.total = result.total;
  } catch {
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
  queryForm.regionId = undefined; // Change from null to undefined
  queryForm.title = '';
  handleSearch();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 初始加载数据
fetchData();

// 添加一个计算属性来动态计算卡片列表高度
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});

// 渲染卡片
const renderCard = (item: any) => {
  const { gmtModified, locationInfo, regionName, title } = item;
  return `
    <div class="h-full">
      <div class="font-bold text-lg mb-2">${title}</div>
      <div>区域: ${regionName}</div>
      <div>更新时间: ${gmtModified}</div>
      <div>经度: ${locationInfo.longitude}</div>
      <div>纬度: ${locationInfo.latitude}</div>
    </div>
  `;
};
</script>

<template>
  <Page description="管理景点图库信息" title="景点图库">
    <NCard ref="queryCardRef" class="query-card mb-4 p-2">
      <NForm :model="queryForm" class="flex h-full items-center" inline>
        <NSpace
          :size="[24, 0]"
          align="center"
          class="w-full"
          justify="space-between"
        >
          <NSpace :size="24" align="center">
            <NFormItem
              class="mb-0 flex items-center"
              label="区域ID"
              label-placement="left"
            >
              <NSelect
                v-model:value="queryForm.regionId"
                class="w-52"
                placeholder="请选择区域"
              />
            </NFormItem>
            <NFormItem
              class="mb-0 flex items-center"
              label="景点标题"
              label-placement="left"
            >
              <NInput v-model:value="queryForm.title" class="w-52" />
            </NFormItem>
          </NSpace>
          <NSpace>
            <NConfigProvider :theme="purpleTheme">
              <NButton type="primary" @click="handleSearch">搜索</NButton>
            </NConfigProvider>
            <NButton @click="handleReset">重置</NButton>
          </NSpace>
        </NSpace>
      </NForm>
    </NCard>

    <NCard class="card-list-card flex flex-col overflow-hidden">
      <NGrid
        :cols="4"
        :style="{ height: `${tableHeight}px`, overflowY: 'auto' }"
        :x-gap="24"
        :y-gap="24"
      >
        <NGridItem v-for="item in cardData" :key="item.id">
          <div class="card-item rounded-lg bg-white p-4 shadow-md">
            <div v-html="renderCard(item)"></div>
          </div>
        </NGridItem>
      </NGrid>
      <div class="mt-4 flex justify-end">
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.total"
          @update:page="handlePageChange"
        />
      </div>
    </NCard>
  </Page>
</template>

<style scoped>
.card-list-card {
  height: calc(100vh - 200px); /* Adjust this value based on your layout */
}
</style>
