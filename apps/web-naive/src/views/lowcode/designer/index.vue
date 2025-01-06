<script setup lang="ts" name="Designer">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { EyeOutline, SaveOutline, SendOutline } from '@vicons/ionicons5';
import { NButton, NIcon, NInput, NSpace } from 'naive-ui';

import ComponentPanel from './components/ComponentPanel.vue';
import DesignCanvas from './components/DesignCanvas.vue';
import PropertyPanel from './components/PropertyPanel.vue';

const router = useRouter();

const pageName = ref('未命名页面');
const isEditingName = ref(false);

const handleSave = () => {
  // TODO: 实现保存逻辑
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
</script>

<template>
  <div class="designer-container">
    <div class="designer-header">
      <div class="header-left">
        <template v-if="isEditingName">
          <NInput
            v-model="pageName"
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
          <NButton size="small" @click="handleSave">
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
          <NButton @click="handleDataSourceClick"> 数据源 </NButton>
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
        <div class="panel-body">
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
  height: 100%;
  background-color: #f0f2f5;
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
  gap: 1px;
  padding: 1px;
  min-height: 0;
}

.designer-panel {
  background-color: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

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
    min-width: 450px;
    max-width: 600px;
    width: 30%;

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
}

.panel-body {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.designer-canvas {
  flex: 1;
  min-width: 375px;
  margin: 0 16px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: auto;
}
</style>
