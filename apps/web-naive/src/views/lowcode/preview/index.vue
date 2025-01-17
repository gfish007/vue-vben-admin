<script setup lang="ts">
import { computed } from 'vue';

import { NEmpty } from 'naive-ui';

import { useLowCodeStore } from '../../../store/modules/lowcode';
import ComponentRenderer from '../designer/components/ComponentRenderer.vue';

const store = useLowCodeStore();

// 使用 store 中的组件列表
const components = computed(() => {
  console.log('【预览页面】获取组件列表:', {
    isPreview: true,
    组件列表: store.components.map((comp) => ({
      子组件: comp.children?.length || 0,
      属性: comp.props,
      数据绑定: comp.dataBinding,
      样式: comp.style,
      组件ID: comp.componentInstanceId,
      组件类型: comp.componentCode,
    })),
    组件数量: store.components.length,
  });
  return store.components;
});
</script>

<template>
  <div class="preview-container">
    <div class="preview-content">
      <template v-if="components.length > 0">
        <ComponentRenderer
          v-for="component in components"
          :key="component.componentInstanceId"
          :is-preview="true"
          :node="component"
        />
      </template>
      <template v-else>
        <NEmpty description="暂无内容" />
      </template>
    </div>
  </div>
</template>

<style lang="less" scoped>
.preview-container {
  height: 100%;
  padding: 24px;
  background-color: #f5f5f5;
  overflow: auto;
}

.preview-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0;
}

:deep(.component-wrapper) {
  &:hover {
    outline: none !important;
  }

  &.is-selected {
    outline: none !important;
  }

  &.is-container {
    &.drag-over {
      outline: none !important;
      background-color: transparent !important;
    }
  }

  .delete-button {
    display: none !important;
  }
}

:deep(.n-space) {
  gap: 0 !important;
}
</style>
