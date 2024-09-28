<script setup lang="ts">
import type { GalleryListResp } from '#/api/app/attractionGallery';

import { onMounted, onUnmounted, ref } from 'vue';

import {
  NButton,
  NImage,
  NModal,
  NPopconfirm,
  NSpin,
  useMessage,
} from 'naive-ui';

import {
  queryGalleryList,
  removeAttractionGallery,
  setFirstImage,
} from '#/api/app/attractionGallery';

const props = defineProps<{
  activeTab: string;
  attractionId: number;
  list: GalleryListResp[];
}>();

const emit = defineEmits(['delete', 'edit', 'load-more']);

const message = useMessage();

const galleryItems = ref<GalleryListResp[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);
const pageSize = 20;

const previewVisible = ref(false);
const previewItem = ref<GalleryListResp | null>(null);

const observerTarget = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

const fetchGalleryItems = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const response = await queryGalleryList<GalleryListResp>({
      page: { current: currentPage.value, size: pageSize },
      queryBody: {
        attractionId: props.attractionId,
        fileType: props.activeTab === 'picture' ? 'PICTURE' : 'VIDEO',
      },
    });

    galleryItems.value.push(...response.records);
    hasMore.value = response.records.length === pageSize;
    if (hasMore.value) {
      currentPage.value++;
    }
  } catch (error) {
    console.error('Failed to fetch gallery items:', error);
    message.error('Failed to load gallery items');
  } finally {
    loading.value = false;
  }
};

const handleItemClick = (item: GalleryListResp) => {
  previewItem.value = item;
  previewVisible.value = true;
};

const handleDelete = async (item: GalleryListResp) => {
  try {
    await removeAttractionGallery([item.id]);
    message.success('Image deleted successfully');
    galleryItems.value = galleryItems.value.filter((i) => i.id !== item.id);
  } catch (error) {
    console.error('Failed to delete image:', error);
    message.error('Failed to delete image');
  }
};

const handleSetFirstImage = async (item: GalleryListResp) => {
  try {
    await setFirstImage(item.id);
    message.success('已设置为首图，优先展示！请刷新列表');
  } catch (error) {
    console.error('Failed to set image as first:', error);
    message.error('设置首图失败，请稍后再试');
  }
};

onMounted(() => {
  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading.value && hasMore.value) {
        console.log('fetchGalleryItems');
        fetchGalleryItems();
      }
    },
    { threshold: 0.1 },
  );

  if (observerTarget.value) {
    observer.value.observe(observerTarget.value);
  }

  // Initial load
  fetchGalleryItems();
});

onUnmounted(() => {
  if (observer.value && observerTarget.value) {
    observer.value.unobserve(observerTarget.value);
  }
});
</script>

<template>
  <div class="w-full">
    <div
      class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-5"
    >
      <div
        v-for="item in galleryItems"
        :key="item.id"
        class="group relative aspect-square overflow-hidden rounded-md border"
      >
        <div
          :style="{
            backgroundImage: `url('${item.fileUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
          class="h-full w-full bg-cover bg-center bg-no-repeat"
          @click="handleItemClick(item)"
        ></div>
        <NPopconfirm @positive-click="handleDelete(item)">
          <template #trigger>
            <NButton
              circle
              class="absolute bottom-1 right-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              type="error"
              @click.stop
            >
              <template #icon>
                <span class="icon-[mdi--delete]"></span>
              </template>
            </NButton>
          </template>
          是否确认删除图片?
        </NPopconfirm>
        <NButton
          circle
          class="absolute bottom-1 left-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          type="primary"
          @click.stop="handleSetFirstImage(item)"
        >
          <template #icon>
            <span class="icon-[mdi--star]"></span>
          </template>
        </NButton>
      </div>
    </div>

    <div ref="observerTarget" class="mt-4 flex justify-center">
      <NSpin v-if="loading" />
      <NButton v-else-if="hasMore" @click="fetchGalleryItems">
        加载更多
      </NButton>
      <p v-else class="text-gray-500">没有更多图片了</p>
    </div>

    <NModal
      v-model:show="previewVisible"
      class="w-11/12 max-w-4xl"
      preset="card"
    >
      <template v-if="previewItem">
        <NImage
          :alt="previewItem.fileName"
          :src="previewItem.fileUrl"
          class="h-auto w-full"
          object-fit="contain"
        />
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.group {
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
}
</style>

<!-- 移除 <style> 部分，因为我们现在使用 Tailwind CSS 类 -->
