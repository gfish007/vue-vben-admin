<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { 
  NButton, 
  NCard, 
  NSpace, 
  NTooltip,
  NSplit,
  useMessage,
  NDialogProvider,
  NMessageProvider,
} from 'naive-ui';
import { useLowCodeStore } from '#/store/modules/lowcode';
import { getPageDetail, saveOrUpdatePage } from '#/api/lowcode/page';
import { useHistory } from './hooks/useHistory';
import { useShortcuts } from './hooks/useShortcuts';
import ComponentPanel from './components/ComponentPanel.vue';
import DesignCanvas from './components/DesignCanvas.vue';
import PropertyPanel from './components/PropertyPanel.vue';
import OutlineTree from './components/OutlineTree.vue';
import PreviewModal from './components/PreviewModal.vue';

const props = defineProps<{
  pageCode: string;
}>();

const store = useLowCodeStore();
const message = useMessage();
const { canUndo, canRedo, undo, redo } = useHistory();
const showPreview = ref(false);

const { shortcuts } = useShortcuts();

// 加载页面数据
const loadPageData = async () => {
  try {
    console.log('Loading page data for:', props.pageCode);
    const data = await getPageDetail(props.pageCode);
    console.log('Page data:', data);
    if (data) {
      store.setCurrentPage(data);
      console.log('Store state after update:', {
        currentPage: store.currentPage,
        componentRelations: store.componentRelations,
      });
    }
  } catch (error) {
    console.error('Failed to load page:', error);
    message.error('加载页面失败');
  }
};

// 保存页面
const handleSave = async () => {
  try {
    await saveOrUpdatePage({
      ...store.currentPage,
      layoutConfig: {
        components: store.componentRelations,
      },
    });
    message.success('保存成功');
  } catch (err) {
    message.error('保存失败');
  }
};

onMounted(() => {
  loadPageData();
});
</script>

<template>
  <NMessageProvider>
    <NDialogProvider>
      <Page :title="`${store.currentPage?.pageName || ''} - 页面设计器`" class="h-screen">
        <template #headerContent>
          <NSpace>
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton :disabled="!canUndo" secondary size="small" @click="undo">
                  <template #icon><i class="mdi:undo" /></template>
                  撤销
                </NButton>
              </template>
              {{ shortcuts[0]?.key }}
            </NTooltip>
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton :disabled="!canRedo" secondary size="small" @click="redo">
                  <template #icon><i class="mdi:redo" /></template>
                  重做
                </NButton>
              </template>
              {{ shortcuts[1]?.key }}
            </NTooltip>
            <NButton secondary size="small" @click="showPreview = true">
              <template #icon><i class="mdi:eye" /></template>
              预览
            </NButton>
            <NButton type="primary" size="small" @click="handleSave">
              <template #icon><i class="mdi:content-save" /></template>
              保存
            </NButton>
          </NSpace>
        </template>

        <!-- 设计器主体 -->
        <div class="designer-body flex h-[calc(100vh-64px)]">
          <!-- 左侧组件面板 -->
          <div class="designer-left w-[250px] border-r border-[#eee] bg-[#f9f9f9]">
            <ComponentPanel />
          </div>

          <!-- 中间画布区域 -->
          <div class="designer-center flex-1 bg-[#f0f2f5]">
            <div class="mx-auto my-4 h-[calc(100%-32px)]">
              <div class="mobile-simulator mx-auto h-full w-[375px] overflow-hidden rounded-lg bg-white shadow-lg">
                <div class="mobile-header h-[44px] bg-[#f7f7f7] text-center leading-[44px]">
                  {{ store.currentPage?.pageName || '页面预览' }}
                </div>
                <div class="mobile-body h-[calc(100%-44px)] overflow-auto">
                  <DesignCanvas />
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧属性面板 -->
          <div class="designer-right w-[300px] border-l border-[#eee] bg-[#f9f9f9]">
            <PropertyPanel />
          </div>
        </div>

        <!-- 预览弹窗 -->
        <PreviewModal v-model:show="showPreview" />

        <!-- 快捷键帮助 -->
        <div class="fixed bottom-4 right-4">
          <NTooltip placement="left" trigger="hover">
            <template #trigger>
              <NButton circle secondary>
                <i class="mdi:keyboard text-lg" />
              </NButton>
            </template>
            <div class="p-2">
              <div v-for="shortcut in shortcuts" :key="shortcut.key" class="mb-2">
                <span class="font-mono">{{ shortcut.key }}</span>
                <span class="ml-2 text-gray-400">{{ shortcut.description }}</span>
              </div>
            </div>
          </NTooltip>
        </div>
      </Page>
    </NDialogProvider>
  </NMessageProvider>
</template>

<style scoped>
.mobile-simulator {
  position: relative;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
}

.mobile-header {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 8px;
    transform: translateX(-50%);
    width: 40%;
    height: 4px;
    background: #000;
    border-radius: 4px;
    opacity: 0.1;
  }
}
</style> 
