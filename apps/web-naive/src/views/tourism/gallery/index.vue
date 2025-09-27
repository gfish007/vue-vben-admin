<script lang="ts" setup>
import { nextTick, onMounted, reactive, ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

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

import { queryAttraction } from '#/api/app/attractionGallery';
import { queryRegionList } from '#/api/core/region';
import { useDynamicHeight } from '#/utils/heightUtils';
import { purpleTheme } from '#/utils/theme';

import GalleryDrawer from './GalleryDrawer.vue';

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
    const result = await queryAttraction({
      page: {
        current: pagination.page,
        size: pagination.pageSize,
      },
      queryBody: queryForm,
    });
    // 直接使用返回的数据，不需要额外处理galleryList
    cardData.value = result.records;
    pagination.total = result.total;
  } catch {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// Add this near the top of the script, with other ref declarations
const regionOptions = ref<{ label: string; value: number }[]>([]);

// Add this function to fetch region list
const fetchRegionList = async () => {
  try {
    const result = await queryRegionList({
      page: { current: 1, size: 1000 }, // Adjust size as needed
      queryBody: {},
    });
    regionOptions.value = result.records.map((region) => ({
      label: region.title,
      value: region.id,
    }));
  } catch (error) {
    console.error('获取区域列表失败:', error);
    message.error('获取区域列表失败');
  }
};

onMounted(async () => {
  await nextTick();
  // Add this line to fetch region list
  await fetchRegionList();
});

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

// 添加一个计算属性来动态计算卡片列表高
const queryCardRef = ref<HTMLElement | null>(null);
const { queryCardHeight, tableHeight } = useDynamicHeight(queryCardRef);

onMounted(() => {
  if (queryCardRef.value) {
    queryCardHeight.value = queryCardRef.value.offsetHeight;
  }
});

// Update the renderCard function
const renderCard = (item: any) => {
  const { gmtModified, locationInfo, regionName, title } = item;
  return `
    <div class="h-full cursor-pointer">
      <div class="font-bold text-lg mb-2">${title}</div>
      <div>区域: ${regionName}</div>
      <div>更新时间: ${gmtModified}</div>

    </div>
  `;
};

// Update the useVbenDrawer call
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: GalleryDrawer,
  title: '景点详情',
});

// Update the handleCardClick function
const handleCardClick = (item: any) => {
  console.info('Card clicked with item:', item); // Log the entire item
  drawerApi.setData({
    attractionId: item.id, // Make sure item.id exists and is the correct property
    title: item.title,
  });
  drawerApi.open();
};
</script>

<template>
  <Page description="管理景点图库信息" title="景点图库">
    <div ref="queryCardRef" class="w-full">
      <NCard ref="queryCardRef" class="query-card mb-4 p-2">
        <NForm :model="queryForm" class="flex h-full items-center" inline>
          <div style="display: flex; flex-wrap: wrap; gap: 16px 24px; width: 100%; align-items: center;">
            <NFormItem
              class="mb-0 flex items-center"
              label="区域ID"
              label-placement="left"
            >
              <NSelect
                v-model:value="queryForm.regionId"
                :options="regionOptions"
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
            <div style="display: flex; gap: 16px; margin-left: auto;">
              <NConfigProvider :theme="purpleTheme">
                <NButton type="primary" @click="handleSearch">搜索</NButton>
              </NConfigProvider>
              <NButton @click="handleReset">重置</NButton>
            </div>
          </div>
        </NForm>
      </NCard>
    </div>
    <NCard class="flex flex-col overflow-hidden">
      <div 
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        :style="{ height: `${tableHeight + 44}px`, overflowY: 'auto' }"
      >
        <div 
          v-for="item in cardData" 
          :key="item.id"
          class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 cursor-pointer"
          @click="handleCardClick(item)"
        >
          <!-- 封面图片占位 -->
          <div class="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
            <div class="w-full h-full flex items-center justify-center">
              <span class="icon-[mdi--image-outline] text-5xl text-gray-300"></span>
            </div>
            <!-- 图片数量标签 -->
            <div 
              class="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
            >
              图库
            </div>
          </div>
          
          <!-- 内容区域 -->
          <div class="p-4">
            <h3 class="font-bold text-lg mb-2 line-clamp-1 text-gray-800 group-hover:text-blue-600 transition-colors">
              {{ item.title }}
            </h3>
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-start">
                <span class="icon-[mdi--map-marker-outline] mr-2 mt-0.5 text-gray-400 flex-shrink-0"></span>
                <span class="line-clamp-2">{{ item.locationInfo?.address?.formattedAddress || item.regionName || '未指定地址' }}</span>
              </div>
              <div class="flex items-center">
                <span class="icon-[mdi--clock-outline] mr-2 text-gray-400"></span>
                <span>{{ item.gmtModified ? new Date(item.gmtModified).toLocaleDateString() : '未知时间' }}</span>
              </div>
              <div class="flex items-center">
                <span class="icon-[mdi--map-outline] mr-2 text-gray-400"></span>
                <span class="line-clamp-1">{{ item.regionName || '未指定区域' }}</span>
              </div>
            </div>
          </div>
          
          <!-- 悬停时显示的操作按钮 -->
          <div class="absolute inset-0 bg-black bg-opacity-0 flex items-center justify-center transition-all duration-300 group-hover:bg-opacity-20">
            <NButton 
              type="primary" 
              size="small" 
              class="opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
            >
              管理图库
            </NButton>
          </div>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.total"
          @update:page="handlePageChange"
        />
      </div>
    </NCard>
    <Drawer />
  </Page>
</template>

<style scoped>
/* 添加一些额外的样式优化 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片悬停效果优化 */
.card-item {
  transition: all 0.3s ease;
}

.card-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* 查询卡片样式优化 */
.query-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 响应式优化 */
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
