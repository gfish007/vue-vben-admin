<script setup lang="ts">
import { computed } from 'vue';

import { NEmpty } from 'naive-ui';

import { useLowCodeStore } from '../../../store/modules/lowcode';
import * as componentRenders from '../designer/components/definitions';

const store = useLowCodeStore();

// 使用 store 中的组件列表
const components = computed(() => store.components);

// 获取组件的渲染函数
const getComponentRender = (componentCode: string) => {
  const renderKey = `${componentCode}Render` as keyof typeof componentRenders;
  return componentRenders[renderKey] || null;
};
</script>

<template>
  <div class="preview-container">
    <div class="preview-content">
      <template v-if="components.length > 0">
        <component
          :is="getComponentRender(component.componentCode)"
          v-for="component in components"
          :key="component.componentInstanceId"
          v-bind="component.props"
          :style="component.style"
        >
          <!-- 如果是容器组件，渲染子组件 -->
          <template
            v-if="component.componentCode === 'Container' && component.children"
          >
            <div
              v-for="child in component.children"
              :key="child.componentInstanceId"
              class="container-item"
            >
              <component
                :is="getComponentRender(child.componentCode)"
                v-bind="child.props"
                :style="child.style"
              />
            </div>
          </template>
        </component>
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

:deep(.n-space) {
  gap: 0 !important;
}

.container-item {
  width: inherit;
  margin: 0;
}
</style>
