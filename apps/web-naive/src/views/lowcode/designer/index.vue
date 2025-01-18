<script setup lang="ts" name="Designer">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { EyeOutline, SaveOutline, SendOutline } from '@vicons/ionicons5';
import { NButton, NIcon, NInput, NSpace, useMessage } from 'naive-ui';

import { useLowCodeStore } from '../../../store/modules/lowcode';
import ComponentPanel from './components/ComponentPanel.vue';
import DesignCanvas from './components/DesignCanvas.vue';
import PropertyPanel from './components/PropertyPanel.vue';

const router = useRouter();
const route = useRoute();
const store = useLowCodeStore();
const message = useMessage();

const pageName = ref('未命名页面');
const isEditingName = ref(false);
const isSaving = ref(false);

// 初始化页面
const initPage = async () => {
  try {
    // 从查询参数中获取 pageCode 和 version
    const pageCode = route.query.pageCode as string;
    const version = route.query.version as string;
    console.log('Loading page:', { pageCode, version });

    if (pageCode && version) {
      // 如果有参数，加载页面详情
      await store.loadPageDetail({ pageCode, version });
      if (store.currentPage) {
        pageName.value = store.currentPage.pageName;
      }
    } else {
      // 否则初始化一个新页面
      store.initPage();
    }
  } catch (error) {
    console.error('Failed to init page:', error);
    message.error(`初始化页面失败：${(error as Error).message}`);
  }
};

// 保存页面
const handleSave = async () => {
  if (isSaving.value) return;

  console.log('保存页面：', store.currentPage);
  try {
    isSaving.value = true;
    // 更新页面名称
    if (store.currentPage) {
      store.updateCurrentPage({
        ...store.currentPage,
        pageName: pageName.value,
      });
    }

    // 保存页面
    const result = await store.savePage();
    if (result) {
      message.success('保存成功');
    } else {
      message.error('保存失败');
    }
  } catch (error) {
    console.error('Failed to save page:', error);
    message.error(`保存失败：${(error as Error).message}`);
  } finally {
    isSaving.value = false;
  }
};

const handlePreview = () => {
  router.push('/lowcode/preview');
};

const handlePublish = () => {
  // TODO: 实现发布逻辑
};

const handleDataSourceClick = () => {
  router.push('/lowcode/datasource');
};

// 在组件挂载时初始化页面
onMounted(() => {
  initPage();
});
</script>

<template>
  <div class="designer-container">
    <div class="designer-header">
      <div class="header-left">
        <template v-if="isEditingName">
          <NInput
            v-model:value="pageName"
            size="small"
            @blur="isEditingName = false"
            @keyup.enter="isEditingName = false"
          />
        </template>
        <template v-else>
          <h2 class="page-title" @dblclick="isEditingName = true">
            {{ pageName }}
          </h2>
        </template>
      </div>
      <div class="header-right">
        <NSpace>
          <NButton size="small" @click="handlePreview">
            <template #icon>
              <NIcon>
                <EyeOutline />
              </NIcon>
            </template>
            预览
          </NButton>
          <NButton :loading="isSaving" size="small" @click="handleSave">
            <template #icon>
              <NIcon>
                <SaveOutline />
              </NIcon>
            </template>
            保存
          </NButton>
          <NButton size="small" type="primary" @click="handlePublish">
            <template #icon>
              <NIcon>
                <SendOutline />
              </NIcon>
            </template>
            发布
          </NButton>
          <NButton @click="handleDataSourceClick">数据源</NButton>
        </NSpace>
      </div>
    </div>
    <div class="designer-body">
      <div class="designer-panel left-panel">
        <div class="panel-header">组件库</div>
        <div class="panel-body">
          <ComponentPanel />
        </div>
      </div>
      <div class="designer-canvas">
        <DesignCanvas />
      </div>
      <div class="designer-panel right-panel">
        <div class="panel-header">属性配置</div>
        <div class="right-panel-body">
          <PropertyPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.designer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f2f5;
  overflow: hidden;
}

.designer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;

  .page-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
    cursor: text;

    &:hover {
      color: #1890ff;
    }
  }

  :deep(.n-input) {
    width: 200px;
  }
}

.designer-body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  height: calc(100vh - 56px);
  box-sizing: border-box;
  min-height: 0;
}

.designer-panel {
  background-color: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  height: 100%;

  &.left-panel {
    min-width: 400px;
    max-width: 600px;
    width: 25%;

    .panel-header {
      background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
      color: white;
    }
  }

  &.right-panel {
    min-width: 500px;
    max-width: 700px;
    width: 25%;

    .panel-header {
      background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
      color: white;
    }
  }
}

.panel-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 500;
  flex-shrink: 0;
}

.panel-body {
  flex: 1;
  overflow: hidden;
  padding: 16px;
  min-height: 0;
}
.right-panel-body {
  flex: 1;
  overflow: hidden;
  padding: 0px;
  min-height: 0;
}

.designer-canvas {
  flex: 1;
  min-width: 375px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
