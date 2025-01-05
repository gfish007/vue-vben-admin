<script setup lang="ts">
import type { ComponentDefinition } from '../../../../types/lowcode';

import { computed } from 'vue';

import {
  AppsOutline,
  CreateOutline,
  GridOutline,
  LayersOutline,
  ListOutline,
  ToggleOutline,
} from '@vicons/ionicons5';
import {
  NCard,
  NCollapse,
  NCollapseItem,
  NIcon,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { componentCategories, components } from './registry';

// 图标映射
const iconMap = {
  apps: AppsOutline,
  grid: GridOutline,
  layout: LayersOutline,
  select: ListOutline,
  switch: ToggleOutline,
  'text-input': CreateOutline,
} as const;

// 按分组和分类组织组件
const groupedComponents = computed(() => {
  const groups = new Map<string, Map<string, ComponentDefinition[]>>();

  // 初始化分组
  componentCategories.forEach((group) => {
    const categories = new Map<string, ComponentDefinition[]>();
    group.children.forEach((category) => {
      categories.set(category.code, []);
    });
    groups.set(group.code, categories);
  });

  // 组织组件
  components.forEach((component) => {
    const group = groups.get(component.group);
    if (group) {
      const category = group.get(component.category);
      if (category) {
        category.push(component);
      }
    }
  });

  return groups;
});

// 处理组件拖拽
const handleDragStart = (event: DragEvent, component: ComponentDefinition) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('component', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  }
};

// 获取组件图标
const getComponentIcon = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || AppsOutline;
};
</script>

<template>
  <div class="component-panel">
    <NTabs animated type="segment">
      <NTabPane
        v-for="group in componentCategories"
        :key="group.code"
        :name="group.code"
        :tab="group.name"
      >
        <NCollapse>
          <NCollapseItem
            v-for="category in group.children"
            :key="category.code"
            :title="category.name"
          >
            <div class="component-grid">
              <NCard
                v-for="component in groupedComponents
                  .get(group.code)
                  ?.get(category.code)"
                :key="component.componentCode"
                class="component-item"
                draggable="true"
                size="small"
                @dragstart="(e) => handleDragStart(e, component)"
              >
                <div class="component-content">
                  <div class="component-icon">
                    <NIcon :size="24">
                      <component :is="getComponentIcon(component.icon)" />
                    </NIcon>
                  </div>
                  <div class="component-name">
                    {{ component.componentName }}
                  </div>
                </div>
              </NCard>
            </div>
          </NCollapseItem>
        </NCollapse>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style lang="less" scoped>
.component-panel {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;

  :deep(.n-tabs) {
    flex: 1;
    display: flex;
    flex-direction: column;

    .n-tabs-nav {
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .n-tab-pane {
      flex: 1;
      overflow: auto;
      padding: 0;
    }
  }

  :deep(.n-collapse) {
    border: none;
    background: none;

    .n-collapse-item {
      border: none;

      .n-collapse-item__header {
        font-size: 14px;
        font-weight: 500;
        padding: 12px 16px;

        &:hover {
          background-color: #f5f7f9;
        }
      }

      .n-collapse-item__content-inner {
        padding: 12px;
      }
    }
  }
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.component-item {
  cursor: move;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .component-icon {
      color: #1890ff;
      background-color: #e6f7ff;
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

.component-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.component-icon {
  margin-bottom: 8px;
  color: #595959;
  background-color: #f5f5f5;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.component-name {
  font-size: 13px;
  color: #333;
  text-align: center;
  font-weight: 500;
}
</style>
