<script setup lang="ts">
import { computed } from 'vue';

import {
  AppsOutline,
  CreateOutline,
  GridOutline,
  LayersOutline,
  ListOutline,
  TextOutline,
  ToggleOutline,
} from '@vicons/ionicons5';
import { NCollapse, NCollapseItem, NIcon } from 'naive-ui';

import { componentCategories, components } from './registry';

// 图标映射
const iconMap = {
  apps: AppsOutline,
  grid: GridOutline,
  layout: LayersOutline,
  select: ListOutline,
  switch: ToggleOutline,
  text: TextOutline,
  'text-input': CreateOutline,
} as const;

// 按分类组织组件
const groupedComponents = computed(() => {
  const groups = new Map();

  componentCategories.forEach((category) => {
    category.children.forEach((subCategory) => {
      const componentsInCategory = components.filter(
        (comp) => comp.category === subCategory.code,
      );
      if (componentsInCategory.length > 0) {
        groups.set(subCategory.code, {
          code: subCategory.code,
          components: componentsInCategory,
          name: subCategory.name,
        });
      }
    });
  });

  return [...groups.values()];
});

// 处理拖拽开始
const handleDragStart = (event: DragEvent, component: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('component', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  }
};

// 获取图标组件
const getIcon = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || AppsOutline;
};
</script>

<template>
  <div class="component-panel">
    <NCollapse :default-expanded-names="groupedComponents.map((g) => g.code)">
      <NCollapseItem
        v-for="group in groupedComponents"
        :key="group.code"
        :name="group.code"
        :title="group.name"
      >
        <div class="component-grid">
          <div
            v-for="component in group.components"
            :key="component.componentCode"
            class="component-card"
            draggable="true"
            @dragstart="(e) => handleDragStart(e, component)"
          >
            <div class="icon-wrapper">
              <NIcon :size="20">
                <component :is="getIcon(component.icon)" />
              </NIcon>
            </div>
            <span class="component-name">{{ component.componentName }}</span>
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style lang="less" scoped>
.component-panel {
  height: 100%;

  :deep(.n-collapse) {
    background-color: transparent;
    border: none;
  }

  :deep(.n-collapse-item) {
    margin-bottom: 8px;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    overflow: hidden;

    .n-collapse-item__header {
      background-color: #fafafa;
      font-weight: 500;
      padding: 8px 12px;
    }

    .n-collapse-item__content-inner {
      padding: 8px;
    }
  }
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.component-card {
  cursor: move;
  transition: all 0.2s ease;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background-color: #fff;
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: #e8e8e8;
  }

  .icon-wrapper {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 4px;
    margin-bottom: 4px;
  }

  .component-name {
    font-size: 12px;
    color: #333;
    line-height: 1.2;
  }
}
</style>
