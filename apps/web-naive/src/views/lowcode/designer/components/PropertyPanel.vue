<script setup lang="ts" name="PropertyPanel">
import type { ComponentInstance } from '../../../../types/lowcode';

import { computed, watch } from 'vue';

import { NEmpty, NTabPane, NTabs } from 'naive-ui';

import { useLowCodeStore } from '../../../../store/modules/lowcode';
import * as componentRenders from './definitions';
import DefaultDataPanel from './panels/DefaultDataPanel.vue';
import DefaultEventPanel from './panels/DefaultEventPanel.vue';
// 导入默认面板组件
import DefaultPropsPanel from './panels/DefaultPropsPanel.vue';
import DefaultStylePanel from './panels/DefaultStylePanel.vue';

// 记录可用的组件渲染器
console.log('[PropertyPanel] 可用的组件渲染器:', Object.keys(componentRenders));

const store = useLowCodeStore();

// 当前选中的组件
const currentComponent = computed<ComponentInstance | null>(() => {
  if (!store.currentComponentId) return null;

  // 递归查找组件
  const findComponent = (
    components: ComponentInstance[],
  ): ComponentInstance | null => {
    for (const comp of components) {
      if (comp.componentInstanceId === store.currentComponentId) {
        return comp;
      }
      if (comp.children?.length) {
        const found = findComponent(comp.children);
        if (found) return found;
      }
    }
    return null;
  };

  return findComponent(store.components);
});

// 监听组件变化，确保属性面板更新
watch(
  [() => store.currentComponentId, () => store.components],
  () => {
    console.log('[PropertyPanel] 组件变化:', {
      component: currentComponent.value,
      componentId: store.currentComponentId,
    });
  },
  { deep: true, immediate: true },
);

// 获取自定义面板组件
const getPanelComponent = (type: string) => {
  if (!currentComponent.value) return null;

  const componentCode = currentComponent.value.componentCode;
  const customPanelName = `${componentCode}${type}Panel`;

  console.log('[PropertyPanel] 获取面板组件:', {
    availablePanels: Object.keys(componentRenders),
    componentCode,
    customPanelName,
    customPanels: currentComponent.value.propertyPanel?.customPanels,
    propertyPanel: currentComponent.value.propertyPanel,
    type,
  });

  // 尝试从 propertyPanel 配置中获取自定义面板
  const panelType = type.toLowerCase();
  const customPanelFromConfig =
    currentComponent.value.propertyPanel?.customPanels?.[
      panelType as keyof PropertyPanelConfig['customPanels']
    ];

  if (customPanelFromConfig) {
    console.log('[PropertyPanel] 找到自定义面板配置:', {
      availableComponents: Object.keys(componentRenders),
      customPanelFromConfig,
      panelType,
    });

    const customPanel =
      componentRenders[customPanelFromConfig as keyof typeof componentRenders];
    if (customPanel) {
      console.log(
        '[PropertyPanel] 使用配置指定的自定义面板:',
        customPanelFromConfig,
      );
      return customPanel;
    }
  }

  // 使用默认面板组件
  console.log('[PropertyPanel] 使用默认面板:', type);
  switch (type) {
    case 'Props': {
      return DefaultPropsPanel;
    }
    case 'Style': {
      return DefaultStylePanel;
    }
    case 'Data': {
      return DefaultDataPanel;
    }
    case 'Event': {
      return DefaultEventPanel;
    }
    default: {
      return null;
    }
  }
};

// 获取启用的标签页
const enabledTabs = computed(() => {
  if (!currentComponent.value) return [];

  // 从组件定义中获取启用的标签页
  const defaultTabs = ['props', 'style'];
  return currentComponent.value.propertyPanel?.enabledTabs || defaultTabs;
});
</script>

<template>
  <div class="property-panel">
    <template v-if="currentComponent">
      <NTabs type="segment">
        <!-- 属性配置 -->
        <NTabPane v-if="enabledTabs.includes('props')" name="props" tab="属性">
          <component
            :is="getPanelComponent('Props')"
            :component="currentComponent"
          />
        </NTabPane>

        <!-- 样式配置 -->
        <NTabPane v-if="enabledTabs.includes('style')" name="style" tab="样式">
          <component
            :is="getPanelComponent('Style')"
            :component="currentComponent"
          />
        </NTabPane>

        <!-- 数据配置 -->
        <NTabPane v-if="enabledTabs.includes('data')" name="data" tab="数据">
          <component
            :is="getPanelComponent('Data')"
            :component="currentComponent"
          />
        </NTabPane>

        <!-- 事件配置 -->
        <NTabPane v-if="enabledTabs.includes('event')" name="event" tab="事件">
          <component
            :is="getPanelComponent('Event')"
            :component="currentComponent"
          />
        </NTabPane>
      </NTabs>
    </template>
    <template v-else>
      <NEmpty description="请选择一个组件" />
    </template>
  </div>
</template>

<style lang="less" scoped>
.property-panel {
  height: 100%;
  padding: 16px;
  overflow: auto;
}
</style>
