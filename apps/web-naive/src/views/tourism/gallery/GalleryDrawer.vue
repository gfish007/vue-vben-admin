<script setup lang="ts">
import type { GalleryListResp } from '#/api/app/attractionGallery';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useWindowSize } from '@vueuse/core';
import {
  NButton,
  NEmpty,
  NSpace,
  NTabPane,
  NTabs,
  useMessage,
  useThemeVars,
} from 'naive-ui';

import { queryGalleryList } from '#/api/app/attractionGallery';

import UploadModal from './UploadModal.vue';
import WaterfallList from './WaterfallList.vue';

const props = defineProps<{
  isVisible: boolean;
}>();

const message = useMessage();
const activeTab = ref('picture');
const pictureList = ref<GalleryListResp[]>([]);
const videoList = ref<GalleryListResp[]>([]);
const currentPage = ref(1);
const pageSize = 20;
const hasMoreData = ref(true); // 添加这行

const data = ref<{ attractionId: number; title: string }>({
  attractionId: 0, // 这里应该设置一个有效的默认值，或者在打开抽屉时设置
  title: '图库详情',
});

// 模拟数据生成函数
// const generateMockData = (
//   count: number,
//   type: 'PICTURE' | 'VIDEO',
// ): GalleryListResp[] => {
//   return Array.from({ length: count }, (_, index) => ({
//     attractionId: data.value.attractionId,
//     coverUrl:
//       type === 'VIDEO'
//         ? `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`
//         : undefined,
//     fileName: `${type.toLowerCase()}_${index + 1}.${type === 'PICTURE' ? 'jpg' : 'mp4'}`,
//     fileType: type,
//     fileUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`,
//     gmtCreate: new Date().toISOString(),
//     gmtModified: new Date().toISOString(),
//     height: Math.floor(Math.random() * 300) + 100,
//     id: Math.floor(Math.random() * 10_000) + 1,
//     mark: `This is a ${type.toLowerCase()} description`,
//     sortNo: index + 1,
//     userId: 1,
//     width: Math.floor(Math.random() * 300) + 200,
//   }));
// };

// Keep the drawer logic
const { width: windowWidth } = useWindowSize();

const themeVars = useThemeVars();

const drawerClass = computed(() => {
  if (windowWidth.value >= 1920) return 'w-[1200px]';
  if (windowWidth.value >= 1440) return 'w-[960px]';
  return 'w-[880px]';
});

const drawerStyle = computed(() => {
  return {
    header: {
      titleColor: themeVars.value.primaryColor,
      titleFontSize: '20px',
      titleFontWeight: 'bold',
    },
  };
});

const loadGalleryItems = async () => {
  if (!hasMoreData.value) return;

  try {
    const params = {
      page: {
        current: currentPage.value,
        size: pageSize,
      },
      queryBody: {
        attractionId: data.value.attractionId,
        fileType: activeTab.value === 'picture' ? 'PICTURE' : 'VIDEO',
      },
    };

    console.log('params', params);
    const response = await queryGalleryList<GalleryListResp>(params);

    const newItems = response.records;

    if (newItems.length === 0) {
      hasMoreData.value = false;
      return;
    }

    if (activeTab.value === 'picture') {
      pictureList.value =
        currentPage.value === 1
          ? newItems
          : [...pictureList.value, ...newItems];
    } else {
      videoList.value =
        currentPage.value === 1 ? newItems : [...videoList.value, ...newItems];
    }

    currentPage.value++;

    // 移除成功加载的提示
    // message.success('加载成功');
  } catch (error) {
    console.error('Failed to load gallery items:', error);
    message.error('加载图片/视频列表失败');
  }
};

const resetDataAndLoad = () => {
  currentPage.value = 1;
  hasMoreData.value = true;
  pictureList.value = [];
  videoList.value = [];
  loadGalleryItems();
};
const [Drawer, drawerApi] = useVbenDrawer({
  class: drawerClass,
  contentClass: 'p-4',
  onCancel() {
    drawerApi.close();
  },
  onConfirm() {
    drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const drawerData = drawerApi.getData<{
        attractionId: number;
        title: string;
      }>();
      data.value = {
        attractionId: drawerData.attractionId,
        title: drawerData.title,
      };
      resetDataAndLoad(); // 使用新的函数替换原来的逻辑
    }
  },
  styles: drawerStyle, // Add this line
});

const handleEdit = (item: GalleryListResp) => {
  // 模拟编辑操作
  message.info(`编辑项目：${item.fileName}`);
};

const handleDelete = async (_item: GalleryListResp) => {
  try {
    // 模拟删除操作
    await new Promise((resolve) => setTimeout(resolve, 500));
    message.success('删除成功');
    // 重新加载列表
    currentPage.value = 1;
    pictureList.value = [];
    videoList.value = [];
    loadGalleryItems();
  } catch (error) {
    console.error('Failed to delete gallery item:', error);
    message.error('删除失败');
  }
};

const handleLoadMore = () => {
  loadGalleryItems();
};

// Update the openUploadModal function
const openUploadModal = (type: string) => {
  uploadModal.value?.openModal(type as 'picture' | 'video');
};

// Add a handler for successful uploads
const handleUploadSuccess = () => {
  currentPage.value = 1;
  hasMoreData.value = true;
  if (activeTab.value === 'picture') {
    pictureList.value = [];
  } else {
    videoList.value = [];
  }
  loadGalleryItems();
};

// Remove separate refs for picture and video upload modals
const uploadModal = ref();

const handleTabChange = () => {
  resetDataAndLoad();
};

const currentList = computed(() =>
  activeTab.value === 'picture' ? pictureList.value : videoList.value,
);

const isEmptyList = computed(() => currentList.value.length === 0);

// 删除这里重复的 windowWidth 声明
// const { width: windowWidth } = useWindowSize();

// 如果 drawerWidth 没有被使用，我们可以删除它
// 如果你需要在其他地方使用 drawerWidth，请保留这段代码
// const drawerWidth = computed(() => {
//   if (windowWidth.value >= 1920) return 1200;
//   if (windowWidth.value >= 1440) return 960;
//   return 880;
// });
</script>

<template>
  <Drawer :title="`${data.title} 图库`">
    <NSpace :size="16" vertical>
      <div class="flex items-center justify-between">
        <NTabs
          v-model:value="activeTab"
          type="line"
          @update:value="handleTabChange"
        >
          <NTabPane name="picture" tab="图片" />
          <NTabPane name="video" tab="视频" />
        </NTabs>
        <NButton @click="openUploadModal(activeTab)">
          上传{{ activeTab === 'picture' ? '图片' : '视频' }}
        </NButton>
      </div>

      <NSpace :size="16" vertical>
        <NEmpty v-if="isEmptyList" description="暂无数据" />
        <WaterfallList
          v-else
          :active-tab="activeTab"
          :attraction-id="data.attractionId"
          :list="currentList"
          @delete="handleDelete"
          @edit="handleEdit"
          @load-more="handleLoadMore"
        />
      </NSpace>
    </NSpace>
  </Drawer>

  <UploadModal
    ref="uploadModal"
    :attraction-id="data.attractionId"
    @save-success="handleUploadSuccess"
    @upload-success="handleUploadSuccess"
  />
</template>

<style scoped></style>
